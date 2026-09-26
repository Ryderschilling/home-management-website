"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCard } from "@/app/portal/actions/account";
import { useSquareCard, type SquareConfig } from "./useSquareCard";

export type BillingView = {
  /** Card on file, from Square. null = none saved (or Square not on). */
  card: { brand: string; last4: string; exp: string } | null;
  /** Next autopay, 12-month plans only. */
  nextCharge: { date: string; amount: number } | null;
  /** Month-to-month: paid through this date. */
  paidThrough: string | null;
  /** Open invoices from CHM Ops. */
  due: Array<{ id: string; amount: number; dueDate: string | null; description: string; invoiceNumber: string | null }>;
  /** Recent settled payments. */
  recent: Array<{ id: string; amount: number; date: string; description: string; status: "PAID" | "DUE" | "UPCOMING" }>;
  /** Client had a failed autopay that has not cleared. */
  failedOn: string | null;
  squareOn: boolean;
  square: SquareConfig;
};

const money = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;

export default function BillingCard({ b }: { b: BillingView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { ready, loadError, tokenize } = useSquareCard(b.square, "pt-card-update", editing && b.squareOn);

  const dueTotal = b.due.reduce((a, d) => a + d.amount, 0);

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const token = await tokenize();
        const r = await updateCard({ token });
        if (!r.ok) return setError(r.error);
        setMsg(`Saved. ${r.brand} ending in ${r.last4} is now your card on file.`);
        setEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Please check your card details.");
      }
    });
  };

  return (
    <div className="pt-card">
      {b.failedOn && (
        <div className="pt-alert pt-alert--error" style={{ marginBottom: 14 }}>
          Your payment on {b.failedOn} did not go through. Update your card below and we retry it, or text Ryder.
        </div>
      )}
      {msg && <div className="pt-alert pt-alert--ok" style={{ marginBottom: 14 }}>{msg}</div>}
      {(error || loadError) && <div className="pt-alert pt-alert--error" role="alert" style={{ marginBottom: 14 }}>{error ?? loadError}</div>}

      <div className="pt-list">
        <div className="pt-row">
          <div className="pt-row-main">
            <div className="pt-row-title">Card on file</div>
            <div className="pt-row-sub">
              {b.card ? `${b.card.brand} ending in ${b.card.last4}, expires ${b.card.exp}. Stored with Square, never on our servers.` : b.squareOn ? "No card saved yet. You add one the first time you pay." : "Ryder emails invoices from Square. Pay from that email, or text him to set up autopay."}
            </div>
          </div>
          {b.squareOn && (
            <button type="button" className="pt-btn pt-btn--ghost pt-btn--sm" style={{ width: "auto" }} onClick={() => { setEditing((v) => !v); setError(null); setMsg(null); }}>
              {editing ? "Cancel" : b.card ? "Update card" : "Add a card"}
            </button>
          )}
        </div>

        {editing && b.squareOn && (
          <div style={{ padding: "12px 0 16px" }}>
            <label className="pt-label">New card</label>
            <div id="pt-card-update" className="pt-square-card" />
            {!ready && !loadError && <p className="pt-help">Loading the secure card form...</p>}
            <p className="pt-help">Your plan moves to this card right away. The old one is removed.</p>
            <button type="button" className="pt-btn pt-btn--primary" style={{ width: "auto", marginTop: 10 }} onClick={save} disabled={pending || !ready}>
              {pending ? <><span className="pt-spinner" /> Saving</> : "Save card"}
            </button>
          </div>
        )}

        {b.nextCharge && (
          <div className="pt-row">
            <div className="pt-row-main">
              <div className="pt-row-title">Next charge</div>
              <div className="pt-row-sub">{b.nextCharge.date}, billed automatically to your card on file.</div>
            </div>
            <span className="pt-row-amt">{money(b.nextCharge.amount)}</span>
          </div>
        )}
        {b.paidThrough && !b.nextCharge && (
          <div className="pt-row">
            <div className="pt-row-main">
              <div className="pt-row-title">Paid through</div>
              <div className="pt-row-sub">{b.paidThrough}. Renew from your calendar to keep the visits coming.</div>
            </div>
            <Link href="/portal?renew=1" className="pt-btn pt-btn--sm" style={{ width: "auto" }}>Renew</Link>
          </div>
        )}

        <div className="pt-row">
          <div className="pt-row-main">
            <div className="pt-row-title">Balance due</div>
            <div className="pt-row-sub">
              {b.due.length === 0
                ? "Nothing owed. You are all paid up."
                : `${b.due.length} open invoice${b.due.length === 1 ? "" : "s"}. Pay from the Square email, or text Ryder for the link.`}
            </div>
          </div>
          <span className={`pt-badge ${dueTotal > 0 ? "pt-badge--warn" : "pt-badge--teal"}`}>{dueTotal > 0 ? money(dueTotal) : "$0"}</span>
        </div>
        {b.due.map((d) => (
          <div key={d.id} className="pt-row" style={{ paddingLeft: 14 }}>
            <div className="pt-row-main">
              <div className="pt-row-title" style={{ fontWeight: 500 }}>{d.description}</div>
              <div className="pt-row-sub">{d.dueDate ? `Due ${d.dueDate}` : "Due on receipt"}{d.invoiceNumber ? ` · Invoice ${d.invoiceNumber}` : ""}</div>
            </div>
            <span className="pt-row-amt">{money(d.amount)}</span>
          </div>
        ))}
      </div>

      {b.recent.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <p className="pt-eyebrow" style={{ marginBottom: 6 }}>Recent payments</p>
          <div className="pt-list">
            {b.recent.map((p) => (
              <div key={p.id} className="pt-row" style={{ padding: "8px 0" }}>
                <div className="pt-row-main">
                  <div className="pt-row-title" style={{ fontWeight: 500 }}>{p.description}</div>
                  <div className="pt-row-sub">{p.date}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className={`pt-badge ${p.status === "PAID" ? "pt-badge--teal" : p.status === "DUE" ? "pt-badge--warn" : "pt-badge--mut"}`}>
                    {p.status === "PAID" ? "Paid" : p.status === "DUE" ? "Due" : "Scheduled"}
                  </span>
                  <span className="pt-row-amt">{money(p.amount)}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/portal/history?tab=payments" className="pt-small" style={{ display: "inline-block", marginTop: 8, color: "var(--ch-teal)", fontWeight: 600 }}>
            All payments &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
