"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import OrderModal from "./OrderModal";
import DayModal from "./DayModal";
import { removeCartGroup } from "@/app/portal/actions/orders";
import { addMonths, fmtMonth, fmtLong, weekdayOf, WEEKDAY_NAMES } from "@/lib/portal/dates";
import type { CalendarData, CatalogItem, DayView } from "./types";

export type { CalendarData } from "./types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const money = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;

type Ordering = { svc: CatalogItem; day: string | null; renew?: { month: string } };

export default function PortalCalendar({ data, openRenew = false }: { data: CalendarData; openRenew?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const renewSvc = data.renew ? data.catalog.find((c) => c.code === data.renew?.serviceCode) ?? null : null;
  const [ordering, setOrdering] = useState<Ordering | null>(
    openRenew && renewSvc && data.renew ? { svc: renewSvc, day: null, renew: { month: data.renew.month } } : null
  );
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const closeOrder = useCallback(() => setOrdering(null), []);
  const closeDay = useCallback(() => setDayOpen(null), []);

  const onAdded = (count: number) => {
    setOrdering(null);
    setDayOpen(null);
    setToast(count > 1 ? `${count} items added to your order.` : "Added to your order.");
    router.refresh();
    setTimeout(() => setToast(null), 5000);
  };

  const removeGroup = (groupId: string) => {
    start(async () => {
      await removeCartGroup(groupId);
      router.refresh();
    });
  };

  const first = data.clientName.split(" ")[0];
  const lead = data.days.length ? weekdayOf(data.days[0].key) : 0;
  const jobsByDay = new Map<string, typeof data.jobs>();
  for (const j of data.jobs) {
    const list = jobsByDay.get(j.day) ?? [];
    list.push(j);
    jobsByDay.set(j.day, list);
  }
  const cartByDay = new Map<string, string[]>();
  for (const g of data.cart.groups) for (const d of g.days) cartByDay.set(d, [...(cartByDay.get(d) ?? []), g.name]);

  const plans = data.catalog.filter((c) => c.kind === "PLAN");
  const addons = data.catalog.filter((c) => c.kind !== "PLAN" && (!c.requiresPlan || data.onPlan));
  const upcoming = data.jobs.filter((j) => j.status === "SCHEDULED" && j.day >= data.days[0]?.key).slice(0, 3);

  return (
    <div className="pt-stack" style={{ gap: 26 }}>
      {toast && (
        <div className="pt-alert pt-alert--ok" role="status" style={{ position: "sticky", top: 78, zIndex: 30, boxShadow: "var(--ch-shadow)" }}>
          {toast} <Link href="/portal/checkout" style={{ color: "inherit", fontWeight: 700 }}>Go to checkout &rarr;</Link>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 14 }}>
        <div>
          <p className="pt-eyebrow">Welcome back</p>
          <h1 className="pt-h1">Hi {first}.</h1>
          <p className="pt-lede" style={{ marginBottom: 0 }}>
            {data.subs.length > 0
              ? `You are on the ${data.subs[0].serviceName} plan. ${data.subs[0].left > 0 ? `${data.subs[0].left} of ${data.subs[0].visitsPerMonth} visits still to book this month. Tap an open day to place one.` : "This month's visits are booked. Tap any day to add something extra."}`
              : data.legacyPlan
                ? `You are on the ${data.legacyPlan.name} at ${money(data.legacyPlan.rate)} a month${data.legacyPlan.lockedUntil ? `, locked through ${data.legacyPlan.lockedUntil}` : ""}. Add a service below or tap a day.`
                : "Pick a plan or a one-time service below, or tap an open day on the calendar."}
          </p>
        </div>
        {upcoming.length > 0 && (
          <div className="pt-card pt-card--tight" style={{ minWidth: 240 }}>
            <p className="pt-eyebrow" style={{ marginBottom: 6 }}>Coming up</p>
            {upcoming.map((j) => (
              <div key={j.id} className="pt-small" style={{ color: "var(--ch-ink)" }}>
                <strong>{fmtLong(j.day).replace(/^(\w{3})\w+, /, "$1 ")}</strong> · {j.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renew prompt */}
      {data.renew && renewSvc && (
        <div className="pt-alert pt-alert--note" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span>
            {data.renew.ended
              ? `Your ${data.renew.serviceName} plan has ended. Renew it for ${fmtMonth(data.renew.month)} and pick your days.`
              : `Your ${data.renew.serviceName} plan ends this month. Pick your days for ${fmtMonth(data.renew.month)} to keep it going.`}
          </span>
          <button type="button" className="pt-btn pt-btn--primary pt-btn--sm" style={{ width: "auto" }} onClick={() => setOrdering({ svc: renewSvc, day: null, renew: { month: data.renew!.month } })}>
            Renew for {fmtMonth(data.renew.month)}
          </button>
        </div>
      )}

      {/* Offer tiles */}
      <section>
        <div className="pt-tiles">
          {data.subs.length > 0 ? (
            <div className="pt-tile pt-tile--plan pt-tile--mine">
              <span className="pt-tile-kind">Your plan</span>
              <span className="pt-tile-name">{data.subs[0].serviceName}</span>
              <span className="pt-tile-price">{money(data.subs[0].rate)}<small> /month</small></span>
              <span className="pt-tile-blurb">
                {data.subs[0].term === "LOCK12" ? `Locked through ${data.subs[0].endDate}.` : `Paid through ${data.subs[0].endDate}. Renew month by month.`}{" "}
                {data.subs[0].term === "LOCK12" && data.subs[0].preferredWeekday != null ? `Visits on ${WEEKDAY_NAMES[data.subs[0].preferredWeekday]}s.` : ""}{" "}
                <Link href="/portal/account" style={{ color: "var(--ch-teal)" }}>Manage</Link>
              </span>
            </div>
          ) : data.legacyPlan ? (
            <div className="pt-tile pt-tile--plan pt-tile--mine">
              <span className="pt-tile-kind">Your plan</span>
              <span className="pt-tile-name">{data.legacyPlan.name}</span>
              <span className="pt-tile-price">{money(data.legacyPlan.rate)}<small> /month</small></span>
              <span className="pt-tile-blurb">{data.legacyPlan.lockedUntil ? `Rate locked through ${data.legacyPlan.lockedUntil}.` : "Billed by invoice."} Your visits show on the calendar.</span>
            </div>
          ) : (
            plans.map((c) => (
              <button key={c.code} type="button" className="pt-tile pt-tile--plan" onClick={() => setOrdering({ svc: c, day: null })}>
                <span className="pt-tile-kind">Monthly plan</span>
                <span className="pt-tile-name">{c.name}</span>
                <span className="pt-tile-price">{money(c.price)}<small> /month{c.lock12Price != null ? `, ${money(c.lock12Price)} locked 12 mo` : ""}</small></span>
                <span className="pt-tile-blurb">{c.visitsPerMonth} visit{c.visitsPerMonth === 1 ? "" : "s"} a month. {c.blurb}</span>
              </button>
            ))
          )}
          {addons.map((c) => {
            const onPlan = c.planPrice != null && data.onPlan;
            const price = c.kind === "REQUEST" ? (c.code === "SHUTOFF_PROTECTION" ? "$1,295 + $35/mo" : `From ${money(c.price)}`) : money(onPlan ? (c.planPrice as number) : c.price);
            return (
              <button key={c.code} type="button" className="pt-tile" onClick={() => setOrdering({ svc: c, day: null })}>
                <span className="pt-tile-kind">{c.kind === "REQUEST" ? "Ask for a quote" : "One-time"}</span>
                <span className="pt-tile-name">{c.name}</span>
                <span className="pt-tile-price">
                  {price}
                  <small>{c.unit === "DAY" ? " /day" : c.unit === "VISIT" && c.kind !== "REQUEST" ? " /visit" : c.unit === "EACH" && c.code === "COVERAGE_RECORD" ? " /year" : ""}</small>
                  {onPlan && <small> plan price</small>}
                </span>
                <span className="pt-tile-blurb">{c.blurb}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Calendar */}
      <section className="pt-card" style={{ padding: 18 }}>
        <div className="pt-cal-head">
          <Link href={`/portal?m=${addMonths(data.month, -1)}`} className={`pt-btn pt-btn--sm ${data.month <= data.minMonth ? "pt-btn--ghost" : ""}`} style={{ width: "auto", visibility: data.month <= data.minMonth ? "hidden" : "visible" }} aria-label="Previous month">
            &larr;
          </Link>
          <div className="pt-cal-month">{fmtMonth(data.month)}</div>
          <Link href={`/portal?m=${addMonths(data.month, 1)}`} className="pt-btn pt-btn--sm" style={{ width: "auto", visibility: data.month >= data.maxMonth ? "hidden" : "visible" }} aria-label="Next month">
            &rarr;
          </Link>
        </div>
        <div className="pt-cal-dow">
          {DOW.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="pt-cal">
          {Array.from({ length: lead }).map((_, i) => (
            <div key={`pad${i}`} className="pt-day pt-day--pad" />
          ))}
          {data.days.map((d) => {
            const jobs = jobsByDay.get(d.key) ?? [];
            const inCart = cartByDay.get(d.key) ?? [];
            const cls = [
              "pt-day",
              d.past ? "pt-day--past" : "",
              !d.past && !d.editable ? "pt-day--locked" : "",
              !d.past && d.editable && !d.open ? "pt-day--closed" : "",
              !d.past && d.editable && d.open && d.full ? "pt-day--full" : "",
              d.today ? "pt-day--today" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button key={d.key} type="button" className={cls} onClick={() => setDayOpen(d.key)} aria-label={fmtLong(d.key)}>
                <span className="pt-day-num">{Number(d.key.slice(-2))}</span>
                {!d.past && !d.editable && !d.today && <span className="pt-day-lock" aria-hidden="true">&#128274;</span>}
                {jobs.slice(0, 2).map((j) => (
                  <span key={j.id} className={`pt-chip ${j.status === "DONE" ? "pt-chip--done" : j.status === "CANCELED" ? "pt-chip--cancel" : !j.portal ? "pt-chip--other" : ""}`} title={j.name}>
                    {j.name}
                  </span>
                ))}
                {jobs.length > 2 && <span className="pt-small" style={{ fontSize: 11 }}>+{jobs.length - 2} more</span>}
                {inCart.slice(0, 1).map((n, i) => (
                  <span key={i} className="pt-chip pt-chip--pick" title={`${n} (in your order)`}>{n}</span>
                ))}
              </button>
            );
          })}
        </div>
        <div className="pt-legend">
          <span><i /> Open route day</span>
          <span><i className="closed" /> Not a route day</span>
          <span><i className="visit" /> Your visit</span>
          <span><i className="pick" /> In your order</span>
          <span>&#128274; Inside 3 days, text Ryder</span>
        </div>
      </section>

      {/* Cart strip */}
      {data.cart.groups.length > 0 && (
        <section className="pt-card" style={{ borderColor: "var(--ch-teal)", position: "sticky", bottom: 12, zIndex: 20, boxShadow: "var(--ch-shadow)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <p className="pt-eyebrow" style={{ marginBottom: 6 }}>Your order</p>
              <div className="pt-list">
                {data.cart.groups.map((g) => (
                  <div key={g.groupId} className="pt-row" style={{ padding: "8px 0" }}>
                    <div className="pt-row-main">
                      <div className="pt-row-title">{g.name}</div>
                      <div className="pt-row-sub">
                        {g.term === "LOCK12" ? "Billed monthly, 12 months" : g.term === "MONTHLY" ? "One month, charged today" : ""}
                        {g.days.length ? `${g.term ? " · " : ""}${g.days.length} day${g.days.length === 1 ? "" : "s"}: ${g.days.map((d) => fmtLong(d).replace(/^\w+, /, "")).join(", ")}` : ""}
                      </div>
                    </div>
                    <div className="pt-btn-row" style={{ gap: 8 }}>
                      <span className="pt-row-amt">{g.kind === "REQUEST" ? "Quote" : g.term === "LOCK12" ? "" : money(g.amount)}</span>
                      <button type="button" className="pt-btn pt-btn--ghost pt-btn--sm" style={{ width: "auto" }} onClick={() => removeGroup(g.groupId)} disabled={pending} aria-label={`Remove ${g.name}`}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {data.cart.total > 0 && <div className="pt-h2" style={{ marginBottom: 8 }}>{money(data.cart.total)} today</div>}
              <Link href="/portal/checkout" className="pt-btn pt-btn--primary" style={{ width: "auto" }}>
                Continue to checkout &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {ordering && (
        <OrderModal
          service={ordering.svc}
          data={data}
          presetDay={ordering.day}
          presetTerm={ordering.renew ? "MONTHLY" : undefined}
          presetMonth={ordering.renew?.month}
          onClose={closeOrder}
          onAdded={onAdded}
        />
      )}
      {dayOpen && !ordering && (
        <DayModal
          day={dayOpen}
          info={data.days.find((d) => d.key === dayOpen) as DayView}
          data={data}
          onClose={closeDay}
          onPickService={(svc) => setOrdering({ svc, day: dayOpen })}
        />
      )}
    </div>
  );
}
