/**
 * Booking rules, server side. The portal UI mirrors these for display, but
 * every write re-checks here. Nothing a client can do bypasses:
 *   - the 3-day lead time (LEAD_DAYS in dates.ts)
 *   - open route days (AppState "portalAvailability" + AvailabilityDay overrides)
 *   - the per-day capacity (counts EVERY job that day, from any source)
 *   - the plan's monthly visit allowance
 */
import { prisma } from "@/lib/prisma";
import {
  dayKey,
  keyToDate,
  monthDays,
  weekdayOf,
  isEditableKey,
  todayKey,
  earliestBookableKey,
  addDaysKey,
} from "./dates";

export type AvailabilityTemplate = { weekdays: number[]; capacity: number };

export async function getAvailabilityTemplate(): Promise<AvailabilityTemplate> {
  const row = await prisma.appState.findUnique({ where: { key: "portalAvailability" } });
  try {
    const v = row ? (JSON.parse(row.value) as Partial<AvailabilityTemplate>) : {};
    const weekdays = Array.isArray(v.weekdays) ? v.weekdays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) : [2, 3, 4];
    const capacity = typeof v.capacity === "number" && v.capacity > 0 ? v.capacity : 8;
    return { weekdays, capacity };
  } catch {
    return { weekdays: [2, 3, 4], capacity: 8 };
  }
}

export type DayInfo = {
  key: string;
  open: boolean;
  capacity: number;
  booked: number;
  /** Open, not full, and 3+ days out. */
  bookable: boolean;
  /** 3+ days out, whether or not open. */
  editable: boolean;
  past: boolean;
  today: boolean;
  note: string | null;
};

/** Availability for every day of a month, with the day's total job count. */
export async function monthAvailability(monthKey: string): Promise<Map<string, DayInfo>> {
  const keys = monthDays(monthKey);
  const from = keyToDate(keys[0]);
  const to = keyToDate(addDaysKey(keys[keys.length - 1], 1));
  const [tpl, overrides, jobs] = await Promise.all([
    getAvailabilityTemplate(),
    prisma.availabilityDay.findMany({ where: { date: { gte: new Date(from.getTime() - 86_400_000), lt: new Date(to.getTime() + 86_400_000) } } }),
    prisma.job.findMany({
      where: { date: { gte: new Date(from.getTime() - 86_400_000), lt: new Date(to.getTime() + 86_400_000) }, status: { not: "CANCELED" } },
      select: { date: true },
    }),
  ]);
  const byKey = new Map(overrides.map((o) => [dayKey(o.date), o]));
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const k = dayKey(j.date);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const today = todayKey();
  const out = new Map<string, DayInfo>();
  for (const key of keys) {
    const o = byKey.get(key);
    const open = o ? o.open : tpl.weekdays.includes(weekdayOf(key));
    const capacity = o?.capacity ?? tpl.capacity;
    const booked = counts.get(key) ?? 0;
    const editable = isEditableKey(key);
    out.set(key, {
      key,
      open,
      capacity,
      booked,
      bookable: open && editable && booked < capacity,
      editable,
      past: key < today,
      today: key === today,
      note: o?.note ?? null,
    });
  }
  return out;
}

/** Re-check one day right before writing. Throws a readable message. */
export async function assertBookable(key: string): Promise<void> {
  if (!isEditableKey(key)) {
    throw new Error(`Visits can only be booked ${earliestBookableKey() === key ? "" : "3 or more days out. The earliest day is " + earliestBookableKey() + "."}`.trim());
  }
  const info = (await monthAvailability(key.slice(0, 7))).get(key);
  if (!info) throw new Error("That day is not on the calendar.");
  if (!info.open) throw new Error("That day is not an open route day. Pick a day shown in white.");
  if (info.booked >= info.capacity) throw new Error("That day is full. Pick another open day.");
}

/** How many plan visits this subscription still has in a month. */
export async function planAllowance(subscriptionId: string, monthKey: string): Promise<{ allowed: number; used: number; left: number }> {
  const sub = await prisma.planSubscription.findUnique({ where: { id: subscriptionId }, select: { visitsPerMonth: true } });
  if (!sub) return { allowed: 0, used: 0, left: 0 };
  const keys = monthDays(monthKey);
  const from = keyToDate(keys[0]);
  const to = keyToDate(addDaysKey(keys[keys.length - 1], 1));
  const used = await prisma.job.count({
    where: {
      subscriptionId,
      status: { not: "CANCELED" },
      date: { gte: new Date(from.getTime() - 43_200_000), lt: new Date(to.getTime() - 43_200_000) },
    },
  });
  return { allowed: sub.visitsPerMonth, used, left: Math.max(0, sub.visitsPerMonth - used) };
}

/**
 * Pick N days in a month for a plan: the preferred weekday if set, evenly
 * spaced, skipping closed or full days to the nearest open one. Pure planning;
 * returns keys, writes nothing.
 */
export function spreadDays(avail: Map<string, DayInfo>, count: number, preferredWeekday: number | null, taken: Set<string> = new Set()): string[] {
  const keys = Array.from(avail.keys());
  const candidates = keys.filter((k) => {
    const d = avail.get(k)!;
    return d.bookable && !taken.has(k) && (preferredWeekday == null || weekdayOf(k) === preferredWeekday);
  });
  const pool = candidates.length >= count ? candidates : keys.filter((k) => avail.get(k)!.bookable && !taken.has(k));
  if (pool.length === 0 || count <= 0) return [];
  if (pool.length <= count) return pool;
  // Evenly spaced picks across the pool, e.g. 2 of 8 Tuesdays -> the 2nd and the 6th.
  const out: string[] = [];
  const step = pool.length / count;
  for (let i = 0; i < count; i++) {
    const idx = Math.min(pool.length - 1, Math.floor(step * i + step / 2));
    const k = pool[idx];
    if (!out.includes(k)) out.push(k);
  }
  for (const k of pool) {
    if (out.length >= count) break;
    if (!out.includes(k)) out.push(k);
  }
  return out.sort();
}

/**
 * Days in a month for a weekday pattern: weekday 2 + ordinals [1,3] = the 1st
 * and 3rd Tuesday. ordinals [] = every one of that weekday. When a chosen day
 * is closed, full, or inside the 3-day window, slide to the nearest bookable
 * day in the same week (up to 3 days either side), else skip it.
 */
export function patternDays(avail: Map<string, DayInfo>, weekday: number, ordinals: number[], taken: Set<string> = new Set()): string[] {
  const keys = Array.from(avail.keys());
  const same = keys.filter((k) => weekdayOf(k) === weekday);
  const wanted = ordinals.length ? ordinals.map((o) => same[o - 1]).filter(Boolean) : same;
  const out: string[] = [];
  for (const k of wanted) {
    const idx = keys.indexOf(k);
    const order = [0, 1, -1, 2, -2, 3, -3];
    for (const off of order) {
      const cand = keys[idx + off];
      if (!cand) continue;
      const d = avail.get(cand);
      if (d && d.bookable && !taken.has(cand) && !out.includes(cand)) {
        out.push(cand);
        break;
      }
    }
  }
  return out.sort();
}

/** "1st and 3rd Tuesday" for the confirmation copy. */
export function patternLabel(weekday: number, ordinals: number[]): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const ord = ["", "1st", "2nd", "3rd", "4th", "5th"];
  if (!ordinals.length) return `every ${names[weekday]}`;
  return `the ${ordinals.map((o) => ord[o]).join(" and ")} ${names[weekday]}`;
}
