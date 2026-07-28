"use client";

import { useEffect, useState } from "react";
import { bookingConfig } from "@/data/siteData";
import { useBooking } from "./BookingProvider";

const STORAGE_KEY = "chm_lead_popup_dismissed";

const GOOGLE_ADS_ID = "AW-18257719328";
const CONVERSION_LABEL = "JhfKCL2oyskcEKDg-oFE";

function fireGtagConversion() {
  try {
    const w = window as unknown as {
      gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
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

type QualAnswers = {
  owns_property: string;
  property_type: string;
  visit_frequency: string;
  currently_watched: string;
};

const QUESTIONS: Array<{ key: keyof QualAnswers; label: string; options: Array<[string, string]> }> = [
  {
    key: "owns_property",
    label: "Do you own a 30A property?",
    options: [
      ["yes", "Yes, I own one"],
      ["looking", "Still looking"],
    ],
  },
  {
    key: "property_type",
    label: "What type of property?",
    options: [
      ["single_family", "Single-family home"],
      ["condo_townhome", "Condo or townhome"],
      ["other", "Other"],
    ],
  },
  {
    key: "visit_frequency",
    label: "How often are you here?",
    options: [
      ["monthly", "Monthly or more"],
      ["few_times", "A few times a year"],
      ["rarely", "Once a year or less"],
    ],
  },
  {
    key: "currently_watched",
    label: "Is anyone checking on the house now?",
    options: [
      ["no", "No, that's the problem"],
      ["yes", "Yes, I have someone"],
    ],
  },
];

/**
 * Email capture for visitors who are interested but not ready to pick a date.
 *
 * Rebuilt to be the same object as the booking modal: same shell, same
 * header, same progress bar, same chips and fields. Two different-looking
 * modals on one site reads as two different companies.
 *
 * Timing: fires at 20 seconds OR once the visitor is 45% down the page,
 * whichever comes first. The old 3-second trigger interrupted people before
 * they had read a single section, which is how a popup teaches someone to
 * dismiss it on reflex. It also never appears while the booking modal is
 * open, and books suppress it entirely.
 */
export default function LeadCapturePopup() {
  const { open: openBooking, isOpen: bookingOpen } = useBooking();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"form" | "qualify" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [qualSubmitting, setQualSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  const [answers, setAnswers] = useState<QualAnswers>({
    owns_property: "",
    property_type: "",
    visit_frequency: "",
    currently_watched: "",
  });

  /* ── Trigger ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let fired = false;

    const fire = () => {
      if (fired || sessionStorage.getItem(STORAGE_KEY)) return;
      fired = true;
      setVisible(true);
      phCapture("lead_form_view", { source: "popup", page: window.location.pathname });
      window.removeEventListener("scroll", onScroll);
    };

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable > 0.45) fire();
    }

    const timer = setTimeout(fire, 20000);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* ── Escape + scroll lock ────────────────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  }

  function setAnswer(key: keyof QualAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/marketing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim().toLowerCase(),
          neighborhood: neighborhood || null,
          sourcePage: "/popup",
          consent: true,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        setError(data?.error?.message || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}

      phCapture("chm_lead_submitted", { source: "popup", neighborhood: neighborhood || null });
      fireGtagConversion();
      setStep("qualify");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQualSubmit() {
    setQualSubmitting(true);
    try {
      await fetch("/api/marketing/lead/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), answers }),
      });
      phCapture("chm_lead_qualified", { source: "popup", ...answers });
    } catch {
      // Non-blocking. Never hold up the success state for an analytics write.
    } finally {
      setQualSubmitting(false);
      setStep("success");
    }
  }

  // Never stack on top of the booking modal.
  if (!visible || bookingOpen) return null;

  const answered = Object.values(answers).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Get a free property walkthrough"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-[rgba(10,10,10,0.7)] backdrop-blur-[3px]"
      />

      <div className="relative max-h-[92vh] w-full overflow-y-auto bg-white sm:max-w-[560px]">
        {/* header, identical shell to the booking modal */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--ch-hairline)] bg-white px-6 py-5 sm:px-8">
          <div>
            <p className="ch-label">
              {step === "form"
                ? "Watersound Origins · Naturewalk · 30A"
                : step === "qualify"
                  ? "One quick thing"
                  : "You're on the list"}
            </p>
            <p className="mt-2 font-serif text-lg tracking-tight text-[var(--ch-ink)]">
              {step === "form"
                ? "Free property walkthrough"
                : step === "qualify"
                  ? "Tell me about the house"
                  : "Talk soon"}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center border border-[var(--ch-hairline-2)] text-[var(--ch-muted)] transition hover:border-[var(--ch-ink)] hover:text-[var(--ch-ink)]"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M1 1L12 12M12 1L1 12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        {/* progress */}
        <div className="flex h-[3px] w-full bg-[var(--ch-paper-alt)]">
          <div
            className="h-full bg-[var(--ch-teal)] transition-[width] duration-700"
            style={{
              transitionTimingFunction: "var(--ch-ease)",
              width: step === "form" ? "33%" : step === "qualify" ? "66%" : "100%",
            }}
          />
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          {/* ── Step 1: contact ──────────────────────────────────── */}
          {step === "form" && (
            <form onSubmit={handleSubmit}>
              <h2 className="ch-display ch-display--sm mb-4">
                Your 30A home is empty right now. Who&apos;s watching it?
              </h2>

              <p className="ch-lede mb-7 !text-[14.5px]">
                Leave your email and I&apos;ll send you a free walkthrough of your property:
                what I find, what it actually needs, and what it would cost. No pressure and
                no commitment.
              </p>

              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lp-name" className="ch-label mb-3 block">
                      First name
                    </label>
                    <input
                      id="lp-name"
                      className="ch-field"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lp-email" className="ch-label mb-3 block">
                      Email <span className="text-[var(--ch-teal)]">*</span>
                    </label>
                    <input
                      id="lp-email"
                      type="email"
                      className="ch-field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="ch-label mb-3 block">Which neighborhood?</label>
                  <div className="flex flex-wrap gap-2">
                    {bookingConfig.neighborhoods.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="ch-chip"
                        aria-pressed={neighborhood === n}
                        onClick={() => setNeighborhood(neighborhood === n ? "" : n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="border-l-2 border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] px-4 py-3 text-[13px] text-[var(--ch-ink)]">
                    {error}
                  </p>
                )}
              </div>

              <button type="submit" className="ch-btn ch-btn--teal mt-8 w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send me a free walkthrough"}
              </button>

              <div className="mt-5 flex flex-col items-center gap-3 text-center">
                <button
                  type="button"
                  className="ch-link"
                  onClick={() => {
                    dismiss();
                    openBooking("popup");
                  }}
                >
                  Or pick a date now &rarr;
                </button>
                <p className="text-[11.5px] leading-relaxed text-[var(--ch-soft)]">
                  No spam. Unsubscribe anytime.
                </p>
              </div>
            </form>
          )}

          {/* ── Step 2: qualification ────────────────────────────── */}
          {step === "qualify" && (
            <div>
              <p className="ch-lede mb-7 !text-[14.5px]">
                Four questions, about fifteen seconds. It means the walkthrough I send you
                is about your house rather than a generic one.
              </p>

              <div className="space-y-6">
                {QUESTIONS.map((q) => (
                  <div key={q.key}>
                    <label className="ch-label mb-3 block">{q.label}</label>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className="ch-chip"
                          aria-pressed={answers[q.key] === value}
                          onClick={() => setAnswer(q.key, value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  className="ch-btn ch-btn--sm"
                  onClick={() => setStep("success")}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="ch-btn ch-btn--teal flex-1"
                  onClick={handleQualSubmit}
                  disabled={qualSubmitting}
                >
                  {qualSubmitting ? "Saving…" : answered ? "Submit" : "Continue"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: success ──────────────────────────────────── */}
          {step === "success" && (
            <div className="space-y-6 py-2">
              <div className="flex h-12 w-12 items-center justify-center bg-[var(--ch-teal)]">
                <svg width="20" height="15" viewBox="0 0 20 15" fill="none" aria-hidden="true">
                  <path d="M1 7L7 13L19 1" stroke="#fff" strokeWidth="2" />
                </svg>
              </div>

              <h2 className="ch-display ch-display--sm">
                {firstName ? `Thanks, ${firstName}.` : "Thanks."}
              </h2>

              <p className="ch-lede !text-[14.5px]">
                Check your inbox, I sent you something useful in the meantime. I&apos;ll be in
                touch within 24 hours about your walkthrough.
              </p>

              <div className="border-t border-[var(--ch-hairline)] pt-6">
                <p className="ch-label mb-4">Want it on the calendar now?</p>
                <button
                  type="button"
                  className="ch-btn ch-btn--solid w-full"
                  onClick={() => {
                    dismiss();
                    openBooking("popup-success");
                  }}
                >
                  Book a walkthrough
                </button>
              </div>

              <button type="button" className="ch-link mx-auto block" onClick={dismiss}>
                Keep browsing &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
