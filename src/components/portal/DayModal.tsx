"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PortalModal from "./PortalModal";
import DayPicker from "./DayPicker";
import { moveVisit, cancelVisit, addPlanVisit } from "@/app/portal/actions/orders";
import { fmtLong } from "@/lib/portal/dates";
import type { CalendarData, CatalogItem, DayView, JobView } from "./types";

const money = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;

export default function DayModal({
  day,
  info,
  data,
  onClose,
  onPickService,
}: {
  day: string;
  info: DayView;
  data: CalendarData;
  onClose: () => void;
  onPickService: (svc: CatalogItem) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState<JobView | null>(null);
  const [moveTo, setMoveTo] = useState<string[]>([]);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const mine = data.jobs.filter((j) => j.day === day && j.status !== "CANCELED");
  const subWithRoom = data.subs.find((s) => s.left > 0 && day.slice(0, 7) === data.month);
  const canAdd = info.bookable;

  const doMove = () => {
    if (!moving || moveTo.length !== 1) return setError("Pick the new day.");
    start(async () => {
      const r = await moveVisit(moving.id, moveTo[0]);
      if (!r.ok) return setError(r.error);
      router.refresh();
      onClose();
    });
  };
  const doCancel = (id: string) => {
    start(async () => {
      const r = await cancelVisit(id);
      if (!r.ok) return setError(r.error);
      router.refresh();
      onClose();
    });
  };
  const usePlanVisit = () => {
    if (!subWithRoom) return;
    start(async () => {
      const r = await addPlanVisit(subWithRoom.id, day);
      if (!r.ok) return setError(r.error);
      router.refresh();
      onClose();
    });
  };

  if (moving) {
    return (
      <PortalModal title={`Move ${moving.name}`} step={`From ${fmtLong(day)}`} onClose={() => setMoving(null)}>
        <div className="pt-stack">
          {error && <div className="pt-alert pt-alert--error">{error}</div>}
          <p className="pt-lede" style={{ marginBottom: 0 }}>Pick the new day.</p>
          <DayPicker month={data.month} minMonth={data.minMonth} maxMonth={data.maxMonth} initialDays={data.days} picked={moveTo} onChange={setMoveTo} max={1} takenDays={data.jobs.filter((j) => j.status === "SCHEDULED" && j.id !== moving.id).map((j) => j.day)} />
          <div className="pt-btn-row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="pt-btn pt-btn--ghost" onClick={() => setMoving(null)}>Back</button>
            <button type="button" className="pt-btn pt-btn--primary" onClick={doMove} disabled={pending || moveTo.length !== 1}>
              {pending ? <><span className="pt-spinner" /> Moving</> : `Move to ${moveTo[0] ? fmtLong(moveTo[0]) : "..."}`}
            </button>
          </div>
        </div>
      </PortalModal>
    );
  }

  return (
    <PortalModal title={fmtLong(day)} step={info.today ? "Today" : info.open ? "Open route day" : "Not a route day"} onClose={onClose}>
      <div className="pt-stack">
        {error && <div className="pt-alert pt-alert--error">{error}</div>}

        {mine.length > 0 && (
          <div className="pt-card pt-card--tight">
            <h3 className="pt-h3">Your visits this day</h3>
            <div className="pt-list">
              {mine.map((j) => (
                <div key={j.id} className="pt-row" style={{ flexWrap: "wrap" }}>
                  <div className="pt-row-main">
                    <div className="pt-row-title">{j.name}</div>
                    <div className="pt-row-sub">
                      {j.status === "DONE" ? "Done" : j.planVisit ? "Included in your plan" : j.paid ? "Paid" : "Scheduled"}
                      {!j.portal && j.status === "SCHEDULED" ? " · set up by Coastal Home Management" : ""}
                    </div>
                  </div>
                  <div className="pt-btn-row">
                    {j.reportId && (
                      <Link href={`/portal/reports/${j.reportId}`} className="pt-btn pt-btn--sm pt-btn--primary" style={{ width: "auto" }}>View report</Link>
                    )}
                    {j.status === "SCHEDULED" && j.portal && info.editable && confirmCancel !== j.id && (
                      <>
                        <button type="button" className="pt-btn pt-btn--sm" style={{ width: "auto" }} onClick={() => { setMoveTo([]); setMoving(j); }}>Move</button>
                        <button type="button" className="pt-btn pt-btn--sm pt-btn--danger" style={{ width: "auto" }} onClick={() => setConfirmCancel(j.id)}>Cancel</button>
                      </>
                    )}
                    {confirmCancel === j.id && (
                      <div className="pt-alert pt-alert--note" style={{ width: "100%" }}>
                        <p style={{ margin: "0 0 10px" }}>
                          {j.paid ? "Cancel this visit and refund it to your card?" : j.planVisit ? "Cancel this visit? It goes back to your monthly allowance and you can book another day." : "Cancel this request?"}
                        </p>
                        <div className="pt-btn-row">
                          <button type="button" className="pt-btn pt-btn--sm pt-btn--danger" style={{ width: "auto" }} onClick={() => doCancel(j.id)} disabled={pending}>Yes, cancel it</button>
                          <button type="button" className="pt-btn pt-btn--sm pt-btn--ghost" style={{ width: "auto" }} onClick={() => setConfirmCancel(null)}>Keep it</button>
                        </div>
                      </div>
                    )}
                    {j.status === "SCHEDULED" && !info.editable && (
                      <span className="pt-small">Inside 3 days. Text Ryder to change it.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {info.past ? (
          <p className="pt-muted">This day has passed.</p>
        ) : !info.editable ? (
          <div className="pt-alert pt-alert--note">This day is inside the 3-day window, so nothing can be booked or changed here online. Text Ryder at (309) 415-8793 and we will do our best.</div>
        ) : !info.open ? (
          <div className="pt-alert pt-alert--note">We are not on this route on this day. Pick a day shown in white.</div>
        ) : info.full ? (
          <div className="pt-alert pt-alert--note">This day is full. Pick another open day.</div>
        ) : (
          <div className="pt-stack">
            {subWithRoom && !mine.some((j) => j.planVisit) && (
              <button type="button" className="pt-btn pt-btn--primary pt-btn--block" onClick={usePlanVisit} disabled={pending}>
                {pending ? <><span className="pt-spinner" /> Booking</> : `Book a ${subWithRoom.serviceName} visit here (${subWithRoom.left} left this month)`}
              </button>
            )}
            {canAdd && (
              <div>
                <h3 className="pt-h3">Add a service on this day</h3>
                <div className="pt-choice-grid">
                  {data.catalog
                    .filter((c) => c.kind !== "PLAN" && c.unit !== "EACH" && (!c.requiresPlan || data.onPlan))
                    .map((c) => {
                      const price = c.kind === "REQUEST" ? "Quote" : money(c.planPrice != null && data.onPlan ? c.planPrice : c.price);
                      return (
                        <button key={c.code} type="button" className="pt-choice" onClick={() => onPickService(c)}>
                          <div className="pt-choice-title">{c.name}</div>
                          <div className="pt-choice-sub">{price}{c.unit === "DAY" ? " a day" : ""}</div>
                        </button>
                      );
                    })}
                  {!data.onPlan && data.catalog.filter((c) => c.kind === "PLAN").map((c) => (
                    <button key={c.code} type="button" className="pt-choice" onClick={() => onPickService(c)}>
                      <div className="pt-choice-title">Start the {c.name} plan</div>
                      <div className="pt-choice-sub">{money(c.price)} a month</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PortalModal>
  );
}
