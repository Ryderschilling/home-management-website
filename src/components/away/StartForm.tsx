"use client";

import { useEffect, useState } from "react";
import { bookingConfig } from "@/data/siteData";
import { fireConversion, recallEmail } from "./fire";

/**
 * "Start now" on page 2. No card, no charge: it collects what Ryder needs to
 * set up a home and he calls to finish. Codes are never asked for here.
 */
const PLANS = [
  { id: "essential", label: "Essential", detail: "Every two weeks · $200/mo" },
  { id: "weekly", label: "Home Watch", detail: "Every week · $300/mo" },
  { id: "unsure", label: "Not sure", detail: "Ryder will tell you straight" },
];
const STARTS = [
  { id: "asap", label: "As soon as possible" },
  { id: "month", label: "Later this month" },
  { id: "next", label: "Next month" },
];
const ACCESS = [
  { id: "lockbox", label: "Lockbox" },
  { id: "keypad", label: "Keypad door code" },
  { id: "key", label: "Key with a neighbor or manager" },
  { id: "meet", label: "I'll meet Ryder with a key" },
  { id: "unsure", label: "Not sure yet" },
];

function Chips({ value, set, options, cols = 3 }: { value: string; set: (v: string) => void; options: { id: string; label: string; detail?: string }[]; cols?: number }) {
  return (
    <div className={`grid gap-2 ${cols === 2 ? "grid-cols-2" : "sm:grid-cols-3"}`}>
      {options.map((o) => (
        <button key={o.id} type="button" className="ch-chip !flex !flex-col !items-start !py-3 text-left" aria-pressed={value === o.id} onClick={() => set(o.id)}>
          <span className="text-[15px]">{o.label}</span>
          {o.detail && <span className="text-[12px] opacity-70">{o.detail}</span>}
        </button>
      ))}
    </div>
  );
}

export default function StartForm() {
  const [f, setF] = useState({
    plan: "essential", start: "asap", name: "", phone: "", email: "", address: "", neighborhood: "",
    pool: "no", irrigation: "no", access: "unsure", away: "", bestTime: "", notes: "", company: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const known = recallEmail();
    if (known) setF((x) => ({ ...x, email: known }));
  }, []);

  function markStart() {
    if (started) return;
    setStarted(true);
    window.chmTrack?.("form_step", { target: "start-1", label: "Start now" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!f.name.trim()) return setError("Add your name.");
    if (f.phone.replace(/\D/g, "").length < 10) return setError("Add a mobile number so Ryder can call you.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError("Add a valid email.");
    if (!f.address.trim()) return setError("Add the address of your 30A home.");
    setBusy(true);
    try {
      const res = await fetch("/api/away/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, email: f.email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) return setError(data?.error?.message || "That did not go through. Try again, or call (309) 415-8793.");
      fireConversion("start");
      setDone(true);
    } catch {
      setError("That did not go through. Try again, or call (309) 415-8793.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-7 md:p-10" role="status">
        <p className="ch-label mb-3">You&apos;re in</p>
        <h3 className="ch-display ch-display--sm mb-4">Thanks{f.name ? `, ${f.name.split(/\s+/)[0]}` : ""}.</h3>
        <p className="text-[15px] leading-[1.75] text-[var(--ch-muted)]">
          Ryder will call you to get your home set up and grab any codes over the phone. Nothing is charged until you&apos;ve
          talked, and if you don&apos;t love your first month, it&apos;s free.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} onFocusCapture={markStart} noValidate className="space-y-7 border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-6 md:p-9">
      <fieldset>
        <legend className="ch-label mb-3 block">Plan</legend>
        <Chips value={f.plan} set={set("plan")} options={PLANS} />
      </fieldset>
      <fieldset>
        <legend className="ch-label mb-3 block">When do you want to start?</legend>
        <Chips value={f.start} set={set("start")} options={STARTS} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="st-name" className="ch-label mb-3 block">Your name</label>
          <input id="st-name" className="ch-field" value={f.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="st-phone" className="ch-label mb-3 block">Mobile</label>
          <input id="st-phone" type="tel" className="ch-field" value={f.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="tel" />
        </div>
      </div>
      <div>
        <label htmlFor="st-email" className="ch-label mb-3 block">Email</label>
        <input id="st-email" type="email" className="ch-field" value={f.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" />
      </div>
      <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <label htmlFor="st-address" className="ch-label mb-3 block">Address of your 30A home</label>
          <input id="st-address" className="ch-field" value={f.address} onChange={(e) => set("address")(e.target.value)} autoComplete="street-address" />
        </div>
        <div>
          <label htmlFor="st-hood" className="ch-label mb-3 block">Neighborhood</label>
          <select id="st-hood" className="ch-field" value={f.neighborhood} onChange={(e) => set("neighborhood")(e.target.value)}>
            <option value="">Select one</option>
            {bookingConfig.neighborhoods.map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset>
          <legend className="ch-label mb-3 block">Pool?</legend>
          <Chips value={f.pool} set={set("pool")} options={[{ id: "yes", label: "Yes" }, { id: "no", label: "No" }]} cols={2} />
        </fieldset>
        <fieldset>
          <legend className="ch-label mb-3 block">Irrigation?</legend>
          <Chips value={f.irrigation} set={set("irrigation")} options={[{ id: "yes", label: "Yes" }, { id: "no", label: "No" }]} cols={2} />
        </fieldset>
      </div>
      <div>
        <label htmlFor="st-access" className="ch-label mb-3 block">How will Ryder get in?</label>
        <select id="st-access" className="ch-field" value={f.access} onChange={(e) => set("access")(e.target.value)}>
          {ACCESS.map((a) => (<option key={a.id} value={a.id}>{a.label}</option>))}
        </select>
        <p className="mt-2 text-[12px] text-[var(--ch-soft)]">Don&apos;t put codes here. Ryder gets those from you on the phone.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="st-away" className="ch-label mb-3 block">When is it usually empty? (optional)</label>
          <input id="st-away" className="ch-field" value={f.away} onChange={(e) => set("away")(e.target.value)} placeholder="Most of fall and winter" />
        </div>
        <div>
          <label htmlFor="st-best" className="ch-label mb-3 block">Best time to call (optional)</label>
          <input id="st-best" className="ch-field" value={f.bestTime} onChange={(e) => set("bestTime")(e.target.value)} placeholder="Weekday evenings" />
        </div>
      </div>
      <div>
        <label htmlFor="st-notes" className="ch-label mb-3 block">Anything Ryder should know? (optional)</label>
        <textarea id="st-notes" className="ch-field" rows={3} value={f.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Past leak, an AC that acts up, mail to collect" />
      </div>
      <div aria-hidden="true" className="hidden">
        <input tabIndex={-1} autoComplete="off" value={f.company} onChange={(e) => set("company")(e.target.value)} />
      </div>

      {error && <p className="border-l-2 border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] px-4 py-3 text-[13px] text-[var(--ch-ink)]" role="alert">{error}</p>}
      <button type="submit" className="ch-btn ch-btn--solid w-full justify-center" disabled={busy} data-track="Start now: submit">
        {busy ? "Sending" : "Start My Home"}
      </button>
      <p className="text-[12px] leading-relaxed text-[var(--ch-soft)]">Nothing is charged today. Ryder calls you to finish setup. Love your first month or it&apos;s free.</p>
    </form>
  );
}
