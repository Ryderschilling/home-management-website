/**
 * Day math for the portal, always in America/Chicago (the business timezone).
 * Vercel runs in UTC, so never use getFullYear()/getDate() on a raw Date for
 * anything a client sees. Work in "YYYY-MM-DD" day keys and convert at the edges.
 *
 * Mirrors the dayKey rules in the dashboard's src/lib/format.ts.
 */
export const TZ = "America/Chicago";

/** Orders and edits are only allowed this many days out. The 22nd can touch the 25th onward. */
export const LEAD_DAYS = 3;

const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "2026-09-23" for the Chicago calendar day this instant falls on. */
export function dayKey(d: Date): string {
  return keyFmt.format(d);
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function isDayKey(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** A Date at local NOON on that Chicago day. Noon so no DST shift can move the day. */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  // Probe: 17:00Z is noon CDT, 18:00Z is noon CST. Pick whichever lands on the right day.
  for (const h of [17, 18]) {
    const cand = new Date(Date.UTC(y, m - 1, d, h, 0, 0));
    if (dayKey(cand) === key) return cand;
  }
  return new Date(Date.UTC(y, m - 1, d, 17));
}

/** Local 9:00am on that Chicago day, the default visit time on the calendar. */
export function keyToVisitTime(key: string, hour = 9): Date {
  const noon = keyToDate(key);
  return new Date(noon.getTime() + (hour - 12) * 3_600_000);
}

export function addDaysKey(key: string, n: number): string {
  const d = keyToDate(key);
  return dayKey(new Date(d.getTime() + n * 86_400_000));
}

/** First day a client may book or edit: today + LEAD_DAYS. */
export function earliestBookableKey(): string {
  return addDaysKey(todayKey(), LEAD_DAYS);
}

/** True when the client may still add, move or cancel something on this day. */
export function isEditableKey(key: string): boolean {
  return key >= earliestBookableKey();
}

export function monthKeyOf(key: string): string {
  return key.slice(0, 7);
}

export function currentMonthKey(): string {
  return todayKey().slice(0, 7);
}

export function addMonths(monthKey: string, n: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Every day key of a month, in order. */
export function monthDays(monthKey: string): string[] {
  const n = daysInMonth(monthKey);
  return Array.from({ length: n }, (_, i) => `${monthKey}-${String(i + 1).padStart(2, "0")}`);
}

/** 0 = Sunday ... 6 = Saturday, for a day key. */
export function weekdayOf(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

const longFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
const shortFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" });
const monthFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

/** "Tuesday, October 7" */
export function fmtLong(keyOrDate: string | Date): string {
  return longFmt.format(typeof keyOrDate === "string" ? keyToDate(keyOrDate) : keyOrDate);
}

/** "Oct 7, 2026" */
export function fmtShort(keyOrDate: string | Date): string {
  return shortFmt.format(typeof keyOrDate === "string" ? keyToDate(keyOrDate) : keyOrDate);
}

/** "October 2026" */
export function fmtMonth(monthKey: string): string {
  return monthFmt.format(keyToDate(`${monthKey}-01`));
}

export function fmtTime(d: Date): string {
  return timeFmt.format(d);
}

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** A Date n days before now. Lives here so pages stay free of clock calls in render. */
export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}
