"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "chm_lead_popup_dismissed";

export default function LeadCapturePopup() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"idle" | "form" | "success">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  useEffect(() => {
    // Don't show if already dismissed this session
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
      setStep("form");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
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
      setStep("success");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
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

          {step === "form" ? (
            <div style={{ padding: "36px 40px 40px" }}>
              {/* Eyebrow */}
              <p style={{
                margin: "0 0 22px 0",
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.45)",
                fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
              }}>
                Watersound Origins · Naturewalk · 30A
              </p>

              {/* Headline */}
              <h2 style={{
                margin: "0 0 10px 0",
                fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
                fontWeight: 600,
                fontSize: "clamp(22px, 4.5vw, 30px)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: "#0b0b0b",
              }}>
                Your 30A home is sitting empty right now.
              </h2>

              <p style={{
                margin: "0 0 8px 0",
                fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
                fontWeight: 400,
                fontSize: "clamp(17px, 3vw, 21px)",
                lineHeight: 1.3,
                color: "rgba(0,0,0,0.65)",
              }}>
                Who's watching it?
              </p>

              {/* Divider */}
              <div style={{
                width: "40px",
                height: "1px",
                background: "rgba(0,0,0,0.2)",
                margin: "20px 0",
              }} />

              <p style={{
                margin: "0 0 28px 0",
                fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                fontSize: "14px",
                lineHeight: 1.65,
                color: "rgba(0,0,0,0.6)",
              }}>
                Get a free property walkthrough. I'll inspect your home and tell you
                exactly what you need — no pressure, no commitment.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                {/* Name + Email row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={labelStyle}>First name</label>
                    <input
                      type="text"
                      placeholder="Ryder"
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

                {/* Neighborhood */}
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

                {/* Error */}
                {error && (
                  <p style={{
                    margin: "0 0 16px 0",
                    fontSize: "13px",
                    color: "#b91c1c",
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  }}>
                    {error}
                  </p>
                )}

                {/* Submit */}
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

                {/* Consent / privacy note */}
                <p style={{
                  margin: "14px 0 0 0",
                  fontSize: "11px",
                  color: "rgba(0,0,0,0.38)",
                  lineHeight: 1.5,
                  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                  textAlign: "center",
                }}>
                  By submitting, you agree to receive emails from Coastal Home Management 30A.
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            </div>
          ) : (
            /* Success state */
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
                I'll be in touch within 24 hours to schedule your walkthrough.
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

/* Shared inline style objects */
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
