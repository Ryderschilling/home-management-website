"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "@/app/portal/actions/orders";
import { fmtLong } from "@/lib/portal/dates";
import { useSquareCard, type SquareConfig } from "./useSquareCard";

export type CheckoutView = {
  orderId: string;
  clientName: string;
  address: string | null;
  plan: { name: string; rate: number; term: "MONTHLY" | "LOCK12" } | null;
  lines: Array<{ id: string; name: string; day: string | null; amount: number; kind: string; planVisit: boolean }>;
  chargeToday: number;
  requestOnly: boolean;
  needsCard: boolean;
  invoiceLater: boolean;
  agreement: { version: string; title: string; body: string } | null;
  square: SquareConfig;
};

const money = (n: number) => `$${n.toFixed(2)}`;
const TIP_PCTS = [0, 10, 15, 20];

export default function CheckoutForm({ view }: { view: CheckoutView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tipPct, setTipPct] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>("");
  const [useCustom, setUseCustom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [typedName, setTypedName] = useState("");

  // The month-to-month plan is already inside chargeToday (it is a one-month
  // purchase). The 12-month plan bills through its subscription, so its first
  // month shows as its own row.
  const lock12First = view.plan?.term === "LOCK12" ? view.plan.rate : 0;
  const tipBase = view.chargeToday + lock12First;
  const oneTime = view.chargeToday - (view.plan?.term === "MONTHLY" ? view.plan.rate : 0);
  const pctTip = (p: number) => Math.round(tipBase * p) / 100;
  const tipAmount = useCustom ? Math.max(0, Number(customTip) || 0) : pctTip(tipPct);
  const total = tipBase + tipAmount;

  const misconfigured = view.needsCard && (!view.square.appId || !view.square.locationId);
  const { ready: cardReady, loadError, tokenize } = useSquareCard(view.square, "pt-card-container", view.needsCard && !misconfigured);

  const submit = () => {
    setError(null);
    if (!view.agreement) return setError("The service agreement is not set up yet. Text Ryder.");
    if (!agreed) return setError("Please tick the box to agree to the service agreement.");
    if (typedName.trim().length < 3) return setError("Type your full name to sign.");
    start(async () => {
      let token: string | undefined;
      if (view.needsCard) {
        try {
          token = await tokenize();
        } catch (e) {
          return setError(e instanceof Error ? e.message : "Please check your card details.");
        }
      }
      const res = await checkout({
        orderId: view.orderId,
        tipCents: Math.round(tipAmount * 100),
        agreementVersion: view.agreement!.version,
        agreed,
        typedName,
        token,
      });
      if (!res.ok) return setError(res.error);
      router.push(`/portal/orders/${res.orderId}?new=1`);
    });
  };

  const paras = (view.agreement?.body ?? "").split(/\n\n+/);

  return (
    <div className="pt-stack" style={{ gap: 24 }}>
      <div>
        <Link href="/portal" className="pt-btn pt-btn--ghost pt-btn--sm" style={{ width: "auto", paddingLeft: 0 }}>&larr; Back to the calendar</Link>
        <p className="pt-eyebrow" style={{ marginTop: 10 }}>Checkout</p>
        <h1 className="pt-h1">{view.requestOnly ? "Send your request" : "Confirm and pay"}</h1>
        <p className="pt-lede" style={{ marginBottom: 0 }}>Three quick things: check the order, add a tip if you like, agree and pay.</p>
      </div>

      {misconfigured && <div className="pt-alert pt-alert--error" role="alert">Card payments are not fully set up (missing Square app id). Text Ryder and he will invoice you.</div>}
      {(error || loadError) && <div className="pt-alert pt-alert--error" role="alert">{error ?? loadError}</div>}

      {/* 1. Order */}
      <section className="pt-card">
        <p className="pt-step">1 of 3</p>
        <h2 className="pt-h2">Your order</h2>
        {view.address && <p className="pt-small" style={{ marginBottom: 12 }}>For {view.address}</p>}
        <div className="pt-list">
          {view.plan && (
            <div className="pt-row">
              <div className="pt-row-main">
                <div className="pt-row-title">{view.plan.name}</div>
                <div className="pt-row-sub">
                  {view.plan.term === "LOCK12"
                    ? `${money(view.plan.rate)} a month, rate locked for 12 months. First payment today, then the same day each month. $150 to end early.`
                    : `${money(view.plan.rate)} for the month, charged today. No contract. We email you before it ends so you can pick next month's days.`}
                </div>
              </div>
              <span className="pt-row-amt">{money(view.plan.rate)}{view.plan.term === "LOCK12" ? "/mo" : ""}</span>
            </div>
          )}
          {view.lines.map((l) => (
            <div key={l.id} className="pt-row">
              <div className="pt-row-main">
                <div className="pt-row-title">{l.name}</div>
                {l.day && <div className="pt-row-sub">{fmtLong(l.day)}</div>}
              </div>
              <span className="pt-row-amt">{l.planVisit ? "Included" : l.kind === "REQUEST" ? "Quote" : money(l.amount)}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          {view.plan && <div className="pt-total"><span>{view.plan.term === "LOCK12" ? "First month of your plan" : "Your plan this month"}</span><span>{money(view.plan.rate)}</span></div>}
          {oneTime > 0 && <div className="pt-total"><span>One-time services</span><span>{money(oneTime)}</span></div>}
          {tipAmount > 0 && <div className="pt-total"><span>Tip</span><span>{money(tipAmount)}</span></div>}
          <div className="pt-total pt-total--grand">
            <span>{view.requestOnly ? "Due today" : view.invoiceLater ? "To be invoiced" : "Charged today"}</span>
            <span>{money(total)}</span>
          </div>
          {view.plan?.term === "LOCK12" && !view.invoiceLater && <p className="pt-small" style={{ marginTop: 8 }}>Your plan then bills {money(view.plan.rate)} on this day each month for 12 months.</p>}
        </div>
      </section>

      {/* 2. Tip */}
      {!view.requestOnly && (
        <section className="pt-card">
          <p className="pt-step">2 of 3</p>
          <h2 className="pt-h2">A tip is appreciated</h2>
          <p className="pt-muted" style={{ marginBottom: 14 }}>It goes to the team that is out protecting your home. Never expected, always noticed.</p>
          <div className="pt-choice-grid pt-choice-grid--5">
            {TIP_PCTS.map((p) => (
              <button key={p} type="button" className={`pt-choice pt-choice--center ${!useCustom && tipPct === p ? "pt-choice--on" : ""}`} onClick={() => { setUseCustom(false); setTipPct(p); }}>
                <div className="pt-choice-title">{p === 0 ? "No tip" : `${p}%`}</div>
                {p > 0 && <div className="pt-choice-sub">{money(pctTip(p))}</div>}
              </button>
            ))}
            <button type="button" className={`pt-choice pt-choice--center ${useCustom ? "pt-choice--on" : ""}`} onClick={() => setUseCustom(true)}>
              <div className="pt-choice-title">Other</div>
            </button>
          </div>
          {useCustom && (
            <div style={{ marginTop: 12, maxWidth: 220 }}>
              <label className="pt-label">Tip amount</label>
              <input className="pt-field" inputMode="decimal" placeholder="$" value={customTip} onChange={(e) => setCustomTip(e.target.value.replace(/[^\d.]/g, ""))} />
            </div>
          )}
        </section>
      )}

      {/* 3. Agreement + card */}
      <section className="pt-card">
        <p className="pt-step">{view.requestOnly ? "2 of 2" : "3 of 3"}</p>
        <h2 className="pt-h2">{view.agreement?.title ?? "Service agreement"}</h2>
        <p className="pt-muted" style={{ marginBottom: 12 }}>Plain English, eleven short sections. Scroll through it, then tick the box and type your name.</p>
        <div className="pt-alert pt-alert--note" style={{ marginBottom: 14 }}>
          <strong>The short version</strong>
          <ul style={{ margin: "8px 0 0 18px", padding: 0, display: "grid", gap: 4 }}>
            <li>Book, move or cancel any visit up to 3 days before. Inside 3 days, text Ryder.</li>
            {view.plan?.term === "LOCK12" && <li>Your 12-month plan bills {money(view.plan.rate)} monthly to the card on file. Ending it early charges a $150 fee to that card.</li>}
            {view.plan?.term === "MONTHLY" && <li>Your plan covers this month only. It ends at month end unless you renew. We email you a reminder before then.</li>}
            <li>Cancel a paid one-time service 3 or more days out and it is refunded in full.</li>
            <li>Access codes are stored encrypted and seen only by Ryder and the crew member on your visit.</li>
          </ul>
        </div>
        <div className="pt-agreement" tabIndex={0}>
          {paras.map((p, i) => {
            const m = p.match(/^(\d+\. [^\n]+)\n([\s\S]*)$/);
            return m ? (
              <p key={i}><strong>{m[1]}</strong>{m[2]}</p>
            ) : (
              <p key={i}>{p}</p>
            );
          })}
        </div>
        <div className="pt-stack" style={{ marginTop: 18 }}>
          <label className="pt-check">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I have read and agree to the Coastal Home Management service agreement{view.agreement ? ` (version ${view.agreement.version})` : ""}.</span>
          </label>
          <div>
            <label className="pt-label">Type your full name to sign</label>
            <input className="pt-field" value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder={view.clientName} autoComplete="name" />
          </div>

          {view.needsCard && (
            <div>
              <label className="pt-label">Card</label>
              <div id="pt-card-container" className="pt-square-card" />
              {!cardReady && !loadError && <p className="pt-help">Loading the secure card form...</p>}
              <p className="pt-help">
                {view.plan?.term === "LOCK12" ? "Saved securely with Square for your monthly billing. " : ""}
                Card numbers go straight to Square and never touch our servers.
              </p>
            </div>
          )}
          {view.invoiceLater && (
            <div className="pt-alert pt-alert--note">Card payments are being set up. Your booking goes through now and Ryder emails the invoice. Nothing is charged today.</div>
          )}

          <button type="button" className="pt-btn pt-btn--primary pt-btn--block" style={{ minHeight: 64, fontSize: 18 }} onClick={submit} disabled={pending || misconfigured || (view.needsCard && !cardReady)}>
            {pending ? (
              <><span className="pt-spinner" /> {view.requestOnly ? "Sending" : "Processing"}</>
            ) : view.requestOnly ? (
              "Send my request"
            ) : view.invoiceLater ? (
              "Place my order"
            ) : (
              `Pay ${money(total)} and book`
            )}
          </button>
          <p className="pt-small" style={{ textAlign: "center" }}>You can move or cancel any visit up to 3 days before its date.</p>
        </div>
      </section>
    </div>
  );
}
