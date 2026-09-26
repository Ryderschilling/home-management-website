"use client";

import { useActionState, useState } from "react";
import { cancelPlan, setPreferredWeekday } from "@/app/portal/actions/orders";
import type { ActionState } from "@/app/portal/actions/auth";
import { SubmitButton, FormMessage } from "@/components/portal/FormBits";
import { WEEKDAY_NAMES } from "@/lib/portal/dates";

export type PlanView = {
  id: string;
  serviceName: string;
  term: "MONTHLY" | "LOCK12";
  rate: number;
  visitsPerMonth: number;
  preferredWeekday: number | null;
  weekOrdinals: number[];
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELED";
  address: string | null;
  onSquare: boolean;
  lastPaymentFailedAt: string | null;
};

const ORD = ["", "1st", "2nd", "3rd", "4th", "5th"];

export default function PlanCard({ sub }: { sub: PlanView }) {
  const [state, action] = useActionState<ActionState, FormData>(cancelPlan, {});
  const [wdState, wdAction] = useActionState<ActionState, FormData>(setPreferredWeekday, {});
  const [confirm, setConfirm] = useState(false);
  const [ordinals, setOrdinals] = useState<string>(sub.weekOrdinals.length ? sub.weekOrdinals.join(",") : "");
  const isLock = sub.term === "LOCK12";
  const everyWeek = sub.visitsPerMonth >= 4;

  const usual =
    sub.preferredWeekday == null
      ? null
      : everyWeek || !sub.weekOrdinals.length
        ? `every ${WEEKDAY_NAMES[sub.preferredWeekday]}`
        : `the ${sub.weekOrdinals.map((o) => ORD[o]).join(" and ")} ${WEEKDAY_NAMES[sub.preferredWeekday]}`;

  return (
    <div className="pt-card">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <p className="pt-eyebrow" style={{ marginBottom: 4 }}>{isLock ? "12-month locked rate" : "Month to month"}</p>
          <h3 className="pt-h2" style={{ marginBottom: 4 }}>{sub.serviceName}</h3>
          <p className="pt-muted">
            ${sub.rate.toFixed(0)} {isLock ? "a month" : "for the month"}, {sub.visitsPerMonth} visit{sub.visitsPerMonth === 1 ? "" : "s"}
            {sub.address ? ` at ${sub.address}` : ""}.
          </p>
          <p className="pt-small" style={{ marginTop: 4 }}>
            {isLock ? (
              <>
                Started {sub.startDate}{sub.endDate ? `, locked through ${sub.endDate}` : ""}.
                {usual ? ` We come ${usual}.` : ""}
                {sub.onSquare ? " Bills automatically to your saved card." : " Billed by invoice from Coastal Home Management."}
              </>
            ) : (
              <>
                Paid through {sub.endDate ?? "the end of the month"}. It ends then unless you renew. We email you a reminder before that, and you pick next month&apos;s days when you renew.
              </>
            )}
          </p>
        </div>
        <span className={`pt-badge ${sub.status === "ACTIVE" ? "pt-badge--teal" : "pt-badge--warn"}`}>
          {sub.status === "ACTIVE" ? "Active" : "Paused"}
        </span>
      </div>

      {sub.lastPaymentFailedAt && (
        <div className="pt-alert pt-alert--error" style={{ marginTop: 14 }}>
          Your last payment on {sub.lastPaymentFailedAt} did not go through. Update your card below or text Ryder and we will sort it out.
        </div>
      )}

      {isLock && (
        <form action={wdAction} className="pt-form" style={{ marginTop: 18 }}>
          <input type="hidden" name="subscriptionId" value={sub.id} />
          <FormMessage state={wdState} />
          <div>
            <label className="pt-label">Your usual visit day</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <select name="weekday" defaultValue={sub.preferredWeekday ?? ""} className="pt-field" style={{ maxWidth: 220 }}>
                <option value="">Not set</option>
                {WEEKDAY_NAMES.map((n, i) => (
                  <option key={n} value={i}>{n}s</option>
                ))}
              </select>
              {!everyWeek && (
                <select name="ordinals" value={ordinals} onChange={(e) => setOrdinals(e.target.value)} className="pt-field" style={{ maxWidth: 220 }}>
                  <option value="1,3">1st and 3rd</option>
                  <option value="2,4">2nd and 4th</option>
                  <option value="">Spread out</option>
                </select>
              )}
              <SubmitButton variant="plain" className="pt-btn--sm" pending="Saving">Save</SubmitButton>
            </div>
            <p className="pt-help">On the 1st of each month we place next month&apos;s visits on this pattern and email you the dates. Move any of them up to 3 days before.</p>
          </div>
        </form>
      )}

      <div style={{ marginTop: 20, borderTop: "1px solid var(--ch-hairline)", paddingTop: 16 }}>
        <FormMessage state={state} />
        {!confirm ? (
          <button type="button" className="pt-btn pt-btn--ghost pt-btn--sm" onClick={() => setConfirm(true)}>
            {isLock ? "Cancel this plan" : "Do not renew"}
          </button>
        ) : (
          <form action={action} className="pt-form">
            <input type="hidden" name="subscriptionId" value={sub.id} />
            <div className="pt-alert pt-alert--note">
              {isLock
                ? `Your locked rate came with a 12-month commitment. Ending early charges a one-time $150 cancellation fee to your card on file right now, as in your agreement. Visits already booked 3 or more days out are canceled.`
                : "Your plan runs through the end of the month you already paid for, then stops. No fee. You can come back any time."}
            </div>
            <div className="pt-btn-row">
              <SubmitButton variant="danger" pending="Working">{isLock ? "Yes, cancel and pay $150" : "Yes, do not renew"}</SubmitButton>
              <button type="button" className="pt-btn pt-btn--ghost" onClick={() => setConfirm(false)}>
                Keep my plan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
