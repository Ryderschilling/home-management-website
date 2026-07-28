"use client";

import { useEffect, useRef, useState } from "react";
import { bookingConfig, primaryPhoneDisplay, primaryPhone } from "@/data/siteData";

const GOOGLE_ADS_ID = "AW-18257719328";
const CONVERSION_LABEL = "JhfKCL2oyskcEKDg-oFE";

function fireGtagConversion() {
  try {
    const w = window as unknown as {
      gtag?: (c: string, a: string, p: Record<string, unknown>) => void;
    };
    w.gtag?.("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}` });
  } catch {}
}

function phCapture(event: string, props?: Record<string, unknown>) {
  try {
    const ph = (window as unknown as {
      posthog?: { capture: (e: string, p?: Record<string, unknown>) => void };
    }).posthog;
    ph?.capture(event, props);
  } catch {}
}

type Step = 0 | 1 | 2 | 3; // 3 = success

const STEP_LABELS = ["Your property", "When works", "How to reach you"];

export default function BookingModal({
  open,
  source,
  onClose,
}: {
  open: boolean;
  source: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [minDate, setMinDate] = useState("");

  // Step 1
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState("");

  // Step 2
  const [date, setDate] = useState("");
  const [window_, setWindow] = useState("");

  // Step 3
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);

  // Earliest bookable day is tomorrow. Computed on the client so the
  // server and client markup never disagree at hydration.
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setMinDate(d.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!open) return;

    phCapture("booking_open", { source });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, source]);

  if (!open) return null;

  const canAdvance =
    step === 0 ? Boolean(neighborhood) : step === 1 ? Boolean(date && window_) : true;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("We need an email to confirm your walkthrough.");
      return;
    }

    setSubmitting(true);

    const payload = {
      firstName: firstName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      neighborhood,
      address: address.trim(),
      plan,
      date,
      window: window_,
      notes: notes.trim(),
      source,
    };

    try {
      // 1. Existing lead pipeline, puts them in the CRM, starts the drip,
      //    sends the welcome email. Untouched, battle-tested.
      const leadRes = await fetch("/api/marketing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: payload.firstName,
          email: payload.email,
          phone: payload.phone || null,
          neighborhood: payload.neighborhood || null,
          sourcePage: `/booking:${source}`,
          consent: true,
        }),
      });

      const leadData = await leadRes.json().catch(() => ({}));

      if (!leadRes.ok || leadData?.ok === false) {
        setError(leadData?.error?.message || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      // 2. Booking notification, the appointment details Ryder actually
      //    needs, plus a confirmation to the homeowner. Best-effort: if the
      //    email service hiccups we still keep the lead rather than telling
      //    someone their request failed when it didn't.
      await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      phCapture("booking_submitted", { source, neighborhood, plan, window: window_ });
      fireGtagConversion();

      // Somebody who just booked should never then be asked for their email
      // by the lead popup. Same key the popup checks.
      try {
        sessionStorage.setItem("chm_lead_popup_dismissed", "1");
      } catch {}

      setStep(3);
    } catch {
      setError("Something went wrong. Please try again, or just call.");
    } finally {
      setSubmitting(false);
    }
  }

  const windowLabel = bookingConfig.windows.find((w) => w.id === window_);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Book a free walkthrough"
    >
      <button
        type="button"
        aria-label="Close booking"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(10,10,10,0.7)] backdrop-blur-[3px]"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-white outline-none"
      >
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--ch-hairline)] bg-white px-6 py-5 sm:px-8">
          <div>
            <p className="ch-label">
              {step === 3 ? "Confirmed" : `Step ${step + 1} of 3 · ${STEP_LABELS[step]}`}
            </p>
            <p className="mt-2 font-serif text-lg tracking-tight text-[var(--ch-ink)]">
              {step === 3 ? "You're on the calendar list" : "Book a free walkthrough"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center border border-[var(--ch-hairline-2)] text-[var(--ch-muted)] transition hover:border-[var(--ch-ink)] hover:text-[var(--ch-ink)]"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M1 1L12 12M12 1L1 12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        {/* progress */}
        {step < 3 && (
          <div className="flex h-[3px] w-full bg-[var(--ch-paper-alt)]">
            <div
              className="h-full bg-[var(--ch-teal)] transition-[width] duration-700"
              style={{ transitionTimingFunction: "var(--ch-ease)", width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
        )}

        <form onSubmit={submit} className="px-6 py-7 sm:px-8 sm:py-8">
          {/* ── Step 1: the property ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-7">
              <div>
                <label className="ch-label mb-3 block">Which neighborhood?</label>
                <div className="flex flex-wrap gap-2">
                  {bookingConfig.neighborhoods.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="ch-chip"
                      aria-pressed={neighborhood === n}
                      onClick={() => setNeighborhood(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="bk-address" className="ch-label mb-3 block">
                  Street address <span className="normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  id="bk-address"
                  className="ch-field"
                  placeholder="123 Origins Main St"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                />
              </div>

              <div>
                <label className="ch-label mb-3 block">Which plan are you thinking?</label>
                <div className="flex flex-wrap gap-2">
                  {bookingConfig.plans.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="ch-chip"
                      aria-pressed={plan === p}
                      onClick={() => setPlan(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: timing ───────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-7">
              <div>
                <label htmlFor="bk-date" className="ch-label mb-3 block">
                  Preferred day
                </label>
                <input
                  id="bk-date"
                  type="date"
                  className="ch-field"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="ch-label mb-3 block">Arrival window</label>
                <div className="grid grid-cols-2 gap-2">
                  {bookingConfig.windows.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      className="ch-chip !flex-col !items-start !py-3 !px-4"
                      aria-pressed={window_ === w.id}
                      onClick={() => setWindow(w.id)}
                    >
                      <span className="text-[13px]">{w.label}</span>
                      <span className="mt-0.5 text-[11px] opacity-60">{w.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[13px] leading-relaxed text-[var(--ch-muted)]">
                This is a request, not a locked slot. Ryder confirms by text or email,
                usually the same day.
              </p>
            </div>
          )}

          {/* ── Step 3: contact ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="bk-name" className="ch-label mb-3 block">
                  First name
                </label>
                <input
                  id="bk-name"
                  className="ch-field"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>

              <div>
                <label htmlFor="bk-email" className="ch-label mb-3 block">
                  Email <span className="text-[var(--ch-teal)]">*</span>
                </label>
                <input
                  id="bk-email"
                  type="email"
                  className="ch-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="bk-phone" className="ch-label mb-3 block">
                  Phone <span className="normal-case tracking-normal">(fastest way to confirm)</span>
                </label>
                <input
                  id="bk-phone"
                  type="tel"
                  className="ch-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              <div>
                <label htmlFor="bk-notes" className="ch-label mb-3 block">
                  Anything I should know?
                </label>
                <textarea
                  id="bk-notes"
                  rows={3}
                  className="ch-field"
                  placeholder="Gate code, dog, a leak you're worried about..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <p className="border-l-2 border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] px-4 py-3 text-[13px] text-[var(--ch-ink)]">
                  {error}
                </p>
              )}

              <p className="text-[12px] leading-relaxed text-[var(--ch-soft)]">
                No spam, no call center. Your details go straight to Ryder.
              </p>
            </div>
          )}

          {/* ── Success ──────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 py-4">
              <div className="flex h-12 w-12 items-center justify-center bg-[var(--ch-teal)]">
                <svg width="20" height="15" viewBox="0 0 20 15" fill="none" aria-hidden="true">
                  <path d="M1 7L7 13L19 1" stroke="#fff" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="ch-display ch-display--sm">Got it. Talk soon.</h3>
              <p className="ch-lede">
                Your walkthrough request is in
                {date ? (
                  <>
                    {" "}
                    for <strong className="text-[var(--ch-ink)]">{date}</strong>
                    {windowLabel ? `, ${windowLabel.label.toLowerCase()} (${windowLabel.detail})` : ""}
                  </>
                ) : null}
                . Ryder confirms personally, usually the same day. Check your email for
                a copy.
              </p>
              <div className="border-t border-[var(--ch-hairline)] pt-6">
                <p className="ch-label mb-3">Need it sooner?</p>
                <a href={`tel:${primaryPhone()}`} className="ch-link">
                  Call {primaryPhoneDisplay()}
                </a>
              </div>
            </div>
          )}

          {/* ── Footer actions ───────────────────────────────────── */}
          {step < 3 && (
            <div className="mt-8 flex items-center gap-3">
              {step > 0 && (
                <button
                  type="button"
                  className="ch-btn ch-btn--sm"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                >
                  Back
                </button>
              )}

              {step < 2 ? (
                <button
                  type="button"
                  className="ch-btn ch-btn--teal flex-1"
                  disabled={!canAdvance}
                  style={!canAdvance ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                  onClick={() => canAdvance && setStep((s) => (s + 1) as Step)}
                >
                  Continue
                </button>
              ) : (
                <button type="submit" className="ch-btn ch-btn--teal flex-1" disabled={submitting}>
                  {submitting ? "Sending…" : "Request my walkthrough"}
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <button type="button" className="ch-btn ch-btn--solid mt-8 w-full" onClick={onClose}>
              Done
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
