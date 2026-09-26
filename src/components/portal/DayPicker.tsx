"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchMonthDays } from "@/app/portal/actions/orders";
import { addMonths, fmtMonth, weekdayOf } from "@/lib/portal/dates";
import type { DayView } from "./types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The month grid used inside the order popup. Big squares, open days white,
 * everything else grey. Tapping toggles a day. `max` caps the picks.
 */
export default function DayPicker({
  month,
  minMonth,
  maxMonth,
  initialDays,
  picked,
  onChange,
  max,
  takenDays = [],
}: {
  month: string;
  minMonth: string;
  maxMonth: string;
  initialDays: DayView[];
  picked: string[];
  onChange: (days: string[]) => void;
  max: number;
  /** Days that already have one of this client's visits (shown, not pickable). */
  takenDays?: string[];
}) {
  const [m, setM] = useState(month);
  const [cache, setCache] = useState<Record<string, DayView[]>>({ [month]: initialDays });
  const [pending, start] = useTransition();
  const days = cache[m];

  useEffect(() => {
    if (cache[m]) return;
    start(async () => {
      const rows = await fetchMonthDays(m);
      setCache((c) => ({ ...c, [m]: rows }));
    });
  }, [m, cache]);

  const toggle = (key: string) => {
    if (picked.includes(key)) return onChange(picked.filter((k) => k !== key));
    if (max === 1) return onChange([key]);
    if (picked.length >= max) return;
    onChange([...picked, key].sort());
  };

  const lead = days && days.length ? weekdayOf(days[0].key) : 0;
  const taken = new Set(takenDays);

  return (
    <div>
      <div className="pt-cal-head">
        <button type="button" className="pt-btn pt-btn--sm" style={{ width: "auto" }} disabled={m <= minMonth} onClick={() => setM(addMonths(m, -1))} aria-label="Previous month">
          &larr;
        </button>
        <div className="pt-cal-month">{fmtMonth(m)}</div>
        <button type="button" className="pt-btn pt-btn--sm" style={{ width: "auto" }} disabled={m >= maxMonth} onClick={() => setM(addMonths(m, 1))} aria-label="Next month">
          &rarr;
        </button>
      </div>
      <div className="pt-cal-dow">
        {DOW.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      {!days || pending ? (
        <p className="pt-muted" style={{ padding: "30px 0", textAlign: "center" }}>Loading open days...</p>
      ) : (
        <div className="pt-cal">
          {Array.from({ length: lead }).map((_, i) => (
            <div key={`pad${i}`} className="pt-day pt-day--pad" />
          ))}
          {days.map((d) => {
            const isPicked = picked.includes(d.key);
            const isTaken = taken.has(d.key);
            const disabled = !d.bookable || isTaken;
            const cls = [
              "pt-day",
              d.past ? "pt-day--past" : "",
              !d.past && !d.editable ? "pt-day--locked" : "",
              !d.past && d.editable && !d.open ? "pt-day--closed" : "",
              !d.past && d.editable && d.open && d.full ? "pt-day--full" : "",
              d.today ? "pt-day--today" : "",
              isPicked ? "pt-day--picked" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={d.key}
                type="button"
                className={cls}
                style={{ minHeight: 64 }}
                disabled={disabled}
                onClick={() => toggle(d.key)}
                aria-pressed={isPicked}
                aria-label={d.key}
              >
                <span className="pt-day-num">{Number(d.key.slice(-2))}</span>
                {!d.past && !d.editable && <span className="pt-day-lock" aria-hidden="true">&#128274;</span>}
                {isTaken && <span className="pt-chip pt-chip--done">Booked</span>}
                {isPicked && <span className="pt-chip">Picked</span>}
                {!d.past && d.editable && d.open && d.full && !isTaken && <span className="pt-small" style={{ fontSize: 11 }}>Full</span>}
              </button>
            );
          })}
        </div>
      )}
      <div className="pt-legend">
        <span><i /> Open</span>
        <span><i className="closed" /> Not a route day</span>
        <span>&#128274; Inside 3 days</span>
      </div>
    </div>
  );
}
