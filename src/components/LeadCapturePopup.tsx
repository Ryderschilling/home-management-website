"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "chm_lead_popup_dismissed";

// Safe PostHog capture — no-ops if PostHog isn't loaded yet
function phCapture(event: string, props?: Record<string, unknown>) {
  try {
    const ph = (window as unknown as { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog;
    ph?.capture(event, props);
  } catch {}
}

type QualAnswers = {
  owns_property: string;
  property_type: string;
  visit_frequency: string;
  currently_watched: string;
};

export default function LeadCapturePopup() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"idle" | "form" | "qualify" | "success">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  // Step 2 fields
  const [answers, setAnswers] = useState<QualAnswers>({
    owns_property: "",
    property_type: "",
    visit_frequency: "",
    currently_watched: "",
  });
  const [qualSubmitting, setQualSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
      setStep("form");
      phCapture("lead_form_view", { source: "popup", page: window.location.pathname });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  // ── Step 1: contact info ────────────────────────────────────────────────────
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
          sourcePage: "/",
          consent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data?.error?.message || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      sessionStorage.setItem(STORAGE_KEY, "1");
      phCapture("chm_lead_submitted", { source: "popup", neighborhood: neighborhood || null });

      // Advance to qualification step
      setStep("qualify");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 2: qualification ───────────────────────────────────────────────────
  function setAnswer(key: keyof QualAnswers, value: string) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  async function handleQualSubmit() {
    setQualSubmitting(true);
    try {
      await fetch("/api/marketing/lead/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          answers,
        }),
      });
      phCapture("chm_lead_qualified", { source: "popup", ...answers });
    } catch {
      // Non-blocking — don't block success state if this fails
    } finally {
      setQualSubmitting(false);
      setStep("success");
    }
  }

  function skipQual() {
    setStep("success");
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          animation: "chmBackdropIn 420ms cubic-bezier(0.18,0.82,0.16,1) forwards",
        }}
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Property protection inquiry"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "all",
            background: "#fafaf8",
            color: "#0b0b0b",
            width: "100%",
            maxWidth: "480px",
            boxShadow: "0 40px 100px rgba(0,0,0,0.38), 0 8px 24px rgba(0,0,0,0.18)",
            animation: "chmModalIn 480ms cubic-bezier(0.18,0.82,0.16,1) forwards",
            opacity: 0,
            transform: "translateY(28px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
          <div style={{ height: "3px", background: "#0b0b0b", width: "100%" }} />

          {/* Close button */}
          <button
            onClick={dismiss}
            aria-label="Close"
            style={{
              position: "absolute",
              top: "18px",
              right: "20px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "rgba(0,0,0,0.45)",
              fontSize: "18px",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 200ms ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0b0b0b")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,0,0,0.45)")}
          >
            ✕
          </button>

          {/* ── Step 1: Contact form ─────────────────────────────────────────── */}
          {step === "form" && (
            <div style={{ padding: "36px 40px 40px" }}>
              <p style={eyebrowStyle}>
                Watersound Origins · Naturewalk · 30A
              </p>

              <h2 style={headlineStyle}>
                Your 30A home is sitting empty right now.
              </h2>

              <p style={subheadStyle}>
                Who&apos;s watching it?
              </p>

              <div style={dividerStyle} />

              <p style={bodyStyle}>
                Get a free property walkthrough. I'll inspect your home and tell you
                exactly what you need — no pressure, no commitment.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={labelStyle}>First name</label>
                    <input
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      style={inputStyle}
                      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={e => Object.assign(e.target.style, inputStyle)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email <span style={{ color: "#b91c1c" }}>*</span></label>
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={inputStyle}
                      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={e => Object.assign(e.target.style, inputStyle)}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={labelStyle}>Neighborhood</label>
                  <select
                    value={neighborhood}
                    onChange={e => setNeighborhood(e.target.value)}
                    style={{ ...inputStyle, color: neighborhood ? "#0b0b0b" : "rgba(0,0,0,0.4)", cursor: "pointer" }}
                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={e => Object.assign(e.target.style, { ...inputStyle, color: neighborhood ? "#0b0b0b" : "rgba(0,0,0,0.4)" })}
                  >
                    <option value="">Select your neighborhood</option>
                    <option value="Watersound Origins">Watersound Origins</option>
                    <option value="Naturewalk">Naturewalk</option>
                    <option value="Inlet Beach">Inlet Beach</option>
                    <option value="Other 30A">Other 30A Community</option>
                  </select>
                </div>

                {error && (
                  <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#b91c1c", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    height: "48px",
                    background: submitting ? "rgba(0,0,0,0.5)" : "#0b0b0b",
                    color: "#fafaf8",
                    border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                    fontWeight: 500,
                    transition: "background 200ms ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = "#1a1a1a"; }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = "#0b0b0b"; }}
                >
                  {submitting ? "Sending…" : "Request a Free Walkthrough"}
                </button>

                <p style={{ margin: "14px 0 0 0", fontSize: "11px", color: "rgba(0,0,0,0.38)", lineHeight: 1.5, fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif", textAlign: "center" }}>
                  By submitting, you agree to receive emails from Coastal Home Management 30A.
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            </div>
          )}

          {/* ── Step 2: Qualification ────────────────────────────────────────── */}
          {step === "qualify" && (
            <div style={{ padding: "36px 40px 40px" }}>
              <p style={eyebrowStyle}>
                One quick thing
              </p>

              <h2 style={{ ...headlineStyle, fontSize: "clamp(18px, 3.5vw, 24px)", marginBottom: "8px" }}>
                Help me serve you better.
              </h2>

              <p style={{ ...bodyStyle, marginBottom: "28px" }}>
                Four quick questions — takes 15 seconds.
              </p>

              {/* Q1: Own a property? */}
              <div style={{ marginBottom: "20px" }}>
                <p style={questionStyle}>Do you own a 30A property?</p>
                <div style={optionRowStyle}>
                  {[
                    { value: "yes", label: "Yes, I own one" },
                    { value: "looking", label: "Still looking" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswer("owns_property", opt.value)}
                      style={optionBtnStyle(answers.owns_property === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: Property type */}
              <div style={{ marginBottom: "20px" }}>
                <p style={questionStyle}>What type of property?</p>
                <div style={optionRowStyle}>
                  {[
                    { value: "single_family", label: "Single-family home" },
                    { value: "condo_townhome", label: "Condo / Townhome" },
                    { value: "other", label: "Other" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswer("property_type", opt.value)}
                      style={optionBtnStyle(answers.property_type === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3: Visit frequency */}
              <div style={{ marginBottom: "20px" }}>
                <p style={questionStyle}>How often do you visit?</p>
                <div style={optionRowStyle}>
                  {[
                    { value: "monthly", label: "Monthly+" },
                    { value: "few_times", label: "Few times/year" },
                    { value: "rarely", label: "Once a year or less" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswer("visit_frequency", opt.value)}
                      style={optionBtnStyle(answers.visit_frequency === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q4: Currently watched */}
              <div style={{ marginBottom: "28px" }}>
                <p style={questionStyle}>Is anyone watching your home right now?</p>
                <div style={optionRowStyle}>
                  {[
                    { value: "no", label: "No — that's the problem" },
                    { value: "yes", label: "Yes, I have someone" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswer("currently_watched", opt.value)}
                      style={optionBtnStyle(answers.currently_watched === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleQualSubmit}
                  disabled={qualSubmitting}
                  style={{
                    flex: 1,
                    height: "46px",
                    background: qualSubmitting ? "rgba(0,0,0,0.5)" : "#0b0b0b",
                    color: "#fafaf8",
                    border: "none",
                    cursor: qualSubmitting ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                    fontWeight: 500,
                    transition: "background 200ms ease",
                  }}
                  onMouseEnter={e => { if (!qualSubmitting) e.currentTarget.style.background = "#1a1a1a"; }}
                  onMouseLeave={e => { if (!qualSubmitting) e.currentTarget.style.background = "#0b0b0b"; }}
                >
                  {qualSubmitting ? "Saving…" : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={skipQual}
                  style={{
                    height: "46px",
                    padding: "0 20px",
                    background: "none",
                    border: "1px solid rgba(0,0,0,0.2)",
                    cursor: "pointer",
                    fontSize: "11px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                    color: "rgba(0,0,0,0.5)",
                    transition: "border-color 200ms ease, color 200ms ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.5)"; e.currentTarget.style.color = "#0b0b0b"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)"; e.currentTarget.style.color = "rgba(0,0,0,0.5)"; }}
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ──────────────────────────────────────────────── */}
          {step === "success" && (
            <div style={{ padding: "48px 40px 44px", textAlign: "center" }}>
              <div style={{
                width: "48px",
                height: "48px",
                border: "1.5px solid rgba(0,0,0,0.15)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <span style={{ fontSize: "20px" }}>✓</span>
              </div>
              <h2 style={{
                margin: "0 0 12px 0",
                fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
                fontWeight: 600,
                fontSize: "clamp(20px, 4vw, 26px)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}>
                {firstName ? `Got it, ${firstName}.` : "Got it."}
              </h2>
              <p style={{
                margin: "0 0 28px 0",
                fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                fontSize: "15px",
                lineHeight: 1.65,
                color: "rgba(0,0,0,0.6)",
                maxWidth: "32ch",
                marginLeft: "auto",
                marginRight: "auto",
              }}>
                I&apos;ll be in touch within 24 hours to schedule your walkthrough.
                Check your inbox — I sent you something useful in the meantime.
              </p>
              <button
                onClick={dismiss}
                style={{
                  background: "none",
                  border: "1px solid rgba(0,0,0,0.25)",
                  padding: "0 24px",
                  height: "40px",
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                  color: "#0b0b0b",
                  transition: "border-color 200ms ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#0b0b0b")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.25)")}
              >
                Continue browsing
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes chmBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes chmModalIn {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 520px) {
          [aria-label="Property protection inquiry"] > div {
            max-width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}

/* ── Shared style objects ───────────────────────────────────────────────────── */

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 22px 0",
  fontSize: "10px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(0,0,0,0.45)",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
};

const headlineStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
  fontWeight: 600,
  fontSize: "clamp(22px, 4.5vw, 30px)",
  lineHeight: 1.08,
  letterSpacing: "-0.02em",
  color: "#0b0b0b",
};

const subheadStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
  fontWeight: 400,
  fontSize: "clamp(17px, 3vw, 21px)",
  lineHeight: 1.3,
  color: "rgba(0,0,0,0.65)",
};

const dividerStyle: React.CSSProperties = {
  width: "40px",
  height: "1px",
  background: "rgba(0,0,0,0.2)",
  margin: "20px 0",
};

const bodyStyle: React.CSSProperties = {
  margin: "0 0 28px 0",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  fontSize: "14px",
  lineHeight: 1.65,
  color: "rgba(0,0,0,0.6)",
};

const questionStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: "#0b0b0b",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
};

const optionRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
};

function optionBtnStyle(selected: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    fontSize: "12px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    border: selected ? "1.5px solid #0b0b0b" : "1px solid rgba(0,0,0,0.22)",
    background: selected ? "#0b0b0b" : "#fff",
    color: selected ? "#fafaf8" : "rgba(0,0,0,0.7)",
    cursor: "pointer",
    borderRadius: 0,
    lineHeight: 1.4,
    transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
  };
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "10px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(0,0,0,0.5)",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "44px",
  padding: "0 12px",
  border: "1px solid rgba(0,0,0,0.18)",
  background: "#fff",
  fontSize: "14px",
  color: "#0b0b0b",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 180ms ease",
  borderRadius: 0,
  appearance: "none",
  WebkitAppearance: "none",
};

const inputFocusStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: "#0b0b0b",
};
