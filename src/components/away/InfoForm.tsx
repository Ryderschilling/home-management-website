"use client";

import { useEffect, useState } from "react";
import { bookingConfig } from "@/data/siteData";
import { recallEmail } from "./fire";

/**
 * Page 2 of Away on 30A: a short, fully optional "tell us about your home"
 * form. It updates the same lead in CHM Ops (matched on email) with name,
 * phone, neighborhood and what they need. Never promises a call. Never asks
 * for codes.
 */
const NEEDS = [
  "Walkthroughs while I'm away",
  "Storm checks",
  "Arrival and departure prep",
  "Mail and packages",
  "Pool or irrigation checks",
  "Letting in contractors",
];
const EMPTY = [
  { id: "most", label: "Most of the year" },
  { id: "half", label: "About half the year" },
  { id: "season", label: "A few months at a time" },
  { id: "rental", label: "It's a rental" },
];

export default function InfoForm() {
  const [f, setF] = useState({ email: "", name: "", phone: "", neighborhood: "", empty: "", notes: "", company: "" });
  const [needs, setNeeds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    const known = recallEmail();
    if (known) setF((x) => ({ ...x, email: known }));
  }, []);

  function markStart() {
    if (started) return;
    setStarted(true);
    window.chmTrack?.("form_step", { target: "info-1", label: "Home info" });
  }

  function toggle(n: string) {
    setNeeds((x) => (x.includes(n) ? x.filter((y) => y !== n) : [...x, n]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError("Add your email so this lands with the right person.");
    setBusy(true);
    try {
      const res = await fetch("/api/away/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, email: f.email.trim().toLowerCase(), needs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) return setError(data?.error?.message || "That did not go through. Try again.");
      window.chmTrack?.("form_step", { target: "info-done", label: "Home info sent" });
      setDone(true);
    } catch {
      setError("That did not go through. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-7 text-center md:p-10" role="status">
        <p className="ch-label mb-3">Got it</p>
        <p className="text-[17px] leading-[1.7] text-[var(--ch-ink)]">Thanks{f.name ? `, ${f.name.split(/\s+/)[0]}` : ""}. Ryder has everything he needs.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} onFocusCapture={markStart} noValidate className="space-y-6 border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-6 text-left md:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="in-name" className="ch-label mb-3 block">Your name</label>
          <input id="in-name" className="ch-field" value={f.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="in-phone" className="ch-label mb-3 block">Mobile</label>
          <input id="in-phone" type="tel" className="ch-field" value={f.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="tel" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="in-email" className="ch-label mb-3 block">Email</label>
          <input id="in-email" type="email" className="ch-field" value={f.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="in-hood" className="ch-label mb-3 block">Where is your home?</label>
          <select id="in-hood" className="ch-field" value={f.neighborhood} onChange={(e) => set("neighborhood")(e.target.value)}>
            <option value="">Select one</option>
            {bookingConfig.neighborhoods.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="ch-label mb-3 block">How often is it empty?</legend>
        <div className="grid grid-cols-2 gap-2">
          {EMPTY.map((o) => (
            <button key={o.id} type="button" className="ch-chip !justify-start !py-3 text-left" aria-pressed={f.empty === o.id} onClick={() => set("empty")(f.empty === o.id ? "" : o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="ch-label mb-3 block">What would help most? Pick any.</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {NEEDS.map((n) => (
            <button key={n} type="button" className="ch-chip !justify-start !py-3 text-left" aria-pressed={needs.includes(n)} onClick={() => toggle(n)}>
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="in-notes" className="ch-label mb-3 block">Anything else about the house?</label>
        <textarea id="in-notes" className="ch-field" rows={3} value={f.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Past leak, an AC that acts up, when you'll be back" />
      </div>
      <div aria-hidden="true" className="hidden">
        <input tabIndex={-1} autoComplete="off" value={f.company} onChange={(e) => set("company")(e.target.value)} />
      </div>

      {error && <p className="border-l-2 border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] px-4 py-3 text-[13px] text-[var(--ch-ink)]" role="alert">{error}</p>}
      <button type="submit" className="ch-btn ch-btn--solid w-full justify-center" disabled={busy} data-track="Page 2: send home info">
        {busy ? "Sending" : "Send to Ryder"}
      </button>
      <p className="text-center text-[12px] text-[var(--ch-soft)]">Every question is optional. Please don&apos;t put door or alarm codes here.</p>
    </form>
  );
}
