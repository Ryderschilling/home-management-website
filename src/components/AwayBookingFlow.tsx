"use client";

import { useEffect, useMemo, useState } from "react";
import { bookingConfig } from "@/data/siteData";

/**
 * Three-step free walkthrough booking for /away-on-30a (Meta ads, 9/21/26).
 * Step 1 the home, step 2 the day, step 3 contact. Short steps convert better
 * than one long form, and the address comes first because it is the question
 * an owner is most eager to answer.
 *
 * Days are Tuesdays and Thursdays only (Ryder's walkthrough days). Ryder
 * confirms the exact time by text, so there is no live calendar to go stale.
 */

const GOOGLE_ADS_ID = "AW-18257719328";
const CONVERSION_LABEL = "JhfKCL2oyskcEKDg-oFE";

const WINDOWS = [
  { id: "morning", label: "Morning", detail: "8am to 12pm" },
  { id: "afternoon", label: "Afternoon", detail: "12pm to 5pm" },
];
const MODES = [
  { id: "solo", label: "I won't be there", detail: "Walk it and send me the report" },
  { id: "facetime", label: "FaceTime", detail: "Walk it with me on video" },
  { id: "person", label: "In person", detail: "Meet me at the house" },
];

type Slot = { iso: string; dow: string; md: string };

function upcomingSlots(count = 6): Slot[] {
  // Today's date in Central time, then walk forward to Tuesdays and Thursdays.
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [y, m, d] = parts.split("-").map(Number);
  const cur = new Date(Date.UTC(y, m - 1, d, 12));
  const out: Slot[] = [];
  cur.setUTCDate(cur.getUTCDate() + 1); // earliest is tomorrow
  while (out.length < count) {
    const dow = cur.getUTCDay();
    if (dow === 2 || dow === 4) {
      out.push({
        iso: cur.toISOString().slice(0, 10),
        dow: cur.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
        md: cur.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      });
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function fireLeadEvents() {
  try {
    const w = window as unknown as {
      gtag?: (c: string, a: string, p: Record<string, unknown>) => void;
      posthog?: { capture: (e: string, p?: Record<string, unknown>) => void };
      fbq?: (a: string, e: string, p?: Record<string, unknown>) => void;
      pulse?: (e: string, p?: Record<string, unknown>) => void;
    };
    w.gtag?.("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}` });
    w.gtag?.("event", "generate_lead", { form_location: "/away-on-30a" });
    w.posthog?.capture("away_walkthrough_booked");
    w.fbq?.("track", "Lead", { content_name: "Away on 30A walkthrough" });
    w.pulse?.("form", { label: "Away on 30A walkthrough" });
  } catch {}
}

export default function AwayBookingFlow() {
  const slots = useMemo(() => upcomingSlots(6), []);
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [date, setDate] = useState("");
  const [windowId, setWindowId] = useState("");
  const [mode, setMode] = useState("solo");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [away, setAway] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [utm, setUtm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const bits = ["utm_source", "utm_campaign", "utm_content"].map((k) => p.get(k)).filter(Boolean);
      if (bits.length) setUtm(bits.join(" / "));
    } catch {}
  }, []);

  function next() {
    setError("");
    if (step === 1 && !address.trim()) return setError("Add the address of your 30A home.");
    if (step === 2 && (!date || !windowId)) return setError("Pick a day and a time window.");
    setStep((s) => s + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) return next();
    setError("");
    if (!firstName.trim()) return setError("Add your first name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Add a valid email so the report has somewhere to go.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Add a mobile number so Ryder can confirm the time.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/away", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, neighborhood, date, window: windowId, mode, firstName, email: email.trim().toLowerCase(), phone, away, company, utm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.error?.message || "That did not go through. Try again, or call (309) 415-8793.");
        return;
      }
      fireLeadEvents();
      setDone(true);
    } catch {
      setError("That did not go through. Try again, or call (309) 415-8793.");
    } finally {
      setSubmitting(false);
    }
  }

  const picked = slots.find((s) => s.iso === date);

  if (done) {
    return (
      <div className="border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-7 md:p-10" role="status">
        <p className="ch-label mb-3">You are booked</p>
        <h3 className="ch-display ch-display--sm mb-4">{firstName ? `Thanks, ${firstName}.` : "Thanks."}</h3>
        <p className="text-[15px] leading-[1.75] text-[var(--ch-muted)]">
          {picked ? `${picked.dow} ${picked.md}, ${windowId}. ` : ""}
          Ryder will text you to lock in the exact time. A quick email is in your inbox now with
          three questions so he shows up ready. No charge, and the photo report is yours to keep
          either way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-6 md:p-9">
      <div className="mb-7 flex items-center justify-between">
        <p className="ch-label">Free walkthrough · Step {step} of 3</p>
        <div className="flex gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-[3px] w-7 ${n <= step ? "bg-[var(--ch-teal)]" : "bg-[var(--ch-hairline-2)]"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <h3 className="text-[22px] leading-[1.25] text-[var(--ch-ink)]">Where is your 30A home?</h3>
          <div>
            <label htmlFor="aw-address" className="ch-label mb-3 block">Property address</label>
            <input id="aw-address" className="ch-field" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" placeholder="123 Main St" autoFocus />
          </div>
          <div>
            <label htmlFor="aw-hood" className="ch-label mb-3 block">Neighborhood</label>
            <select id="aw-hood" className="ch-field" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
              <option value="">Select one</option>
              {bookingConfig.neighborhoods.map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-[22px] leading-[1.25] text-[var(--ch-ink)]">Pick a day for the walkthrough</h3>
          <fieldset>
            <legend className="ch-label mb-3 block">Tuesdays and Thursdays</legend>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <button key={s.iso} type="button" className="ch-chip !flex !flex-col !items-start !py-3" aria-pressed={date === s.iso} onClick={() => setDate(s.iso)}>
                  <span className="text-[11px] uppercase tracking-[0.14em] opacity-70">{s.dow}</span>
                  <span className="text-[15px]">{s.md}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="ch-label mb-3 block">Time window</legend>
            <div className="grid grid-cols-2 gap-2">
              {WINDOWS.map((w) => (
                <button key={w.id} type="button" className="ch-chip !flex !flex-col !items-start !py-3" aria-pressed={windowId === w.id} onClick={() => setWindowId(w.id)}>
                  <span className="text-[15px]">{w.label}</span>
                  <span className="text-[12px] opacity-70">{w.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="ch-label mb-3 block">How do you want to do it?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODES.map((m) => (
                <button key={m.id} type="button" className="ch-chip !flex !flex-col !items-start !py-3 text-left" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
                  <span className="text-[15px]">{m.label}</span>
                  <span className="text-[12px] opacity-70">{m.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h3 className="text-[22px] leading-[1.25] text-[var(--ch-ink)]">Where should the report go?</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="aw-name" className="ch-label mb-3 block">First name</label>
              <input id="aw-name" className="ch-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" autoFocus />
            </div>
            <div>
              <label htmlFor="aw-phone" className="ch-label mb-3 block">Mobile</label>
              <input id="aw-phone" type="tel" className="ch-field" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
          </div>
          <div>
            <label htmlFor="aw-email" className="ch-label mb-3 block">Email</label>
            <input id="aw-email" type="email" className="ch-field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="aw-away" className="ch-label mb-3 block">When are you usually not there? (optional)</label>
            <input id="aw-away" className="ch-field" value={away} onChange={(e) => setAway(e.target.value)} placeholder="Most of the fall and winter" />
          </div>
          <div aria-hidden="true" className="hidden">
            <label htmlFor="aw-company">Company</label>
            <input id="aw-company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-5 border-l-2 border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] px-4 py-3 text-[13px] text-[var(--ch-ink)]" role="alert">{error}</p>
      )}

      <div className="mt-7 flex items-center gap-3">
        {step > 1 && (
          <button type="button" className="ch-btn" onClick={() => { setError(""); setStep((s) => s - 1); }}>Back</button>
        )}
        <button type="submit" className="ch-btn ch-btn--solid flex-1 justify-center" disabled={submitting}>
          {step < 3 ? "Continue" : submitting ? "Booking" : "Book My Free Walkthrough"}
        </button>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-[var(--ch-soft)]">
        No charge, no commitment. You do not need to be in town. Your details go straight to Ryder.
      </p>
    </form>
  );
}
