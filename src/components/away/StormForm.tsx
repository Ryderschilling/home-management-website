"use client";

import { useState } from "react";
import { formAttr } from "@/components/AdTracker";

// After-storm check request (Hurricane Isaias ad, 10/8/26). Posts to
// /api/away/storm. Fires the Meta Lead with the same event id the server sends
// through the Conversions API, and only when the server says it is a new person.

const AREAS = [
  "Watersound Origins",
  "Inlet Beach",
  "Rosemary Beach",
  "Alys Beach",
  "Seacrest / Watersound Beach",
  "Naturewalk",
  "Seagrove / Seaside / WaterColor",
  "Somewhere else on 30A",
];

const NEEDS = [
  "Walk the house inside and out, send photos",
  "Check for water or leaks",
  "Check AC and power",
  "Put outdoor furniture back",
  "Open storm shutters",
  "Clear yard debris",
];

type W = {
  fbq?: (a: string, e: string, p?: Record<string, unknown>, o?: { eventID: string }) => void;
  gtag?: (c: string, a: string, p: Record<string, unknown>) => void;
  posthog?: { capture: (e: string) => void };
  pulse?: (e: string, p?: Record<string, unknown>) => void;
};

const input =
  "w-full border border-[var(--ch-hairline-2)] bg-white px-4 py-3.5 text-[16px] text-[var(--ch-ink)] outline-none focus:border-[var(--ch-ink)]";

export default function StormForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", address: "", area: "", notes: "", company: "" });
  const [needs, setNeeds] = useState<string[]>([NEEDS[0]]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.name.trim()) return setErr("Add your name.");
    if (!f.email.trim()) return setErr("Add your email so the photos have somewhere to go.");
    if (!f.address.trim()) return setErr("Add the home's address.");
    setBusy(true);
    let eventId = "";
    try {
      eventId = crypto.randomUUID();
    } catch {
      eventId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    try {
      const res = await fetch("/api/away/storm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, needs, eventId, attr: formAttr() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setErr(data?.error?.message || "That did not go through. Try again, or text 309-415-8793.");
        return;
      }
      try {
        const w = window as unknown as W;
        if (data?.fire !== false) w.fbq?.("track", "Lead", { content_name: "After-storm check" }, { eventID: eventId });
        w.gtag?.("event", "generate_lead", { form_location: "/away-on-30a/after-the-storm" });
        w.posthog?.capture("storm_after_request");
        w.pulse?.("form", { label: "After-storm check" });
      } catch {}
      setDone(true);
    } catch {
      setErr("That did not go through. Try again, or text 309-415-8793.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="border border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] p-8 text-center" role="status">
        <p className="ch-label mb-3">Got it</p>
        <p className="text-[22px] leading-[1.35] text-[var(--ch-ink)]">Thanks{f.name ? `, ${f.name.split(" ")[0]}` : ""}. Ryder will reach out to confirm.</p>
        <p className="mt-3 text-[15px] text-[var(--ch-muted)]">Once roads are safe, your home gets checked and the photos come to your email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left" noValidate>
      <input type="text" name="company" value={f.company} onChange={set("company")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-[var(--ch-muted)]">Name</span>
          <input className={input} value={f.name} onChange={set("name")} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-[var(--ch-muted)]">Mobile</span>
          <input className={input} type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[13px] text-[var(--ch-muted)]">Email</span>
        <input className={input} type="email" value={f.email} onChange={set("email")} autoComplete="email" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] text-[var(--ch-muted)]">Home address</span>
        <input className={input} value={f.address} onChange={set("address")} autoComplete="street-address" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] text-[var(--ch-muted)]">Where is it?</span>
        <select className={input} value={f.area} onChange={set("area")}>
          <option value="">Pick one</option>
          {AREAS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="mb-2 block text-[13px] text-[var(--ch-muted)]">What do you need done?</legend>
        <div className="grid gap-2 md:grid-cols-2">
          {NEEDS.map((n) => {
            const on = needs.includes(n);
            return (
              <label key={n} className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-[15px] text-[var(--ch-ink)] ${on ? "border-[var(--ch-ink)] bg-[var(--ch-paper-alt)]" : "border-[var(--ch-hairline-2)]"}`}>
                <input type="checkbox" checked={on} onChange={() => setNeeds((p) => (on ? p.filter((x) => x !== n) : [...p, n]))} className="h-4 w-4 accent-[var(--ch-ink)]" />
                {n}
              </label>
            );
          })}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-1.5 block text-[13px] text-[var(--ch-muted)]">Anything else? (gate code process, where the key is, what you are worried about)</span>
        <textarea className={`${input} min-h-[96px]`} value={f.notes} onChange={set("notes")} />
      </label>
      {err && <p className="text-[14px] text-[#b42318]" role="alert">{err}</p>}
      <button type="submit" disabled={busy} className="ch-btn ch-btn--solid w-full justify-center disabled:opacity-60">
        {busy ? "Sending..." : "Check my home after the storm"}
      </button>
      <p className="text-center text-[13px] text-[var(--ch-muted)]">Nothing is charged now. Ryder confirms with you before the visit.</p>
    </form>
  );
}
