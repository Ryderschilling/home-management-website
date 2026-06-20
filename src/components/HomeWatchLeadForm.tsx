"use client";

import { useState } from "react";

/**
 * Google Ads conversion tracking
 * Replace CONVERSION_LABEL below with the label from your conversion action:
 *   ads.google.com → Tools → Measurement → Conversions → [your action] → Tag setup → "Use Google Tag"
 * The label looks like: "AbCdEfGhIj1234"
 */
const GOOGLE_ADS_ID = "AW-18257719328";
const CONVERSION_LABEL = "DaWcCJ-i2sIcEKDg-oFE";

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
    const ph = (window as unknown as { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } })
      .posthog;
    ph?.capture(event, props);
  } catch {}
}

export default function HomeWatchLeadForm({ source = "/home-watch" }: { source?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number so I can reach you.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/home-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          neighborhood,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      // Fire Google Ads conversion + PostHog
      fireGtagConversion();
      phCapture("chm_home_watch_lead", { neighborhood: neighborhood || null, has_email: !!email.trim() });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div id="lead-form" style={card}>
        <div style={check}>
          <span style={{ fontSize: "20px" }}>✓</span>
        </div>
        <h3 style={successHeading}>{name ? `Got it, ${name.split(" ")[0]}.` : "Got it."}</h3>
        <p style={successBody}>
          I&apos;ll reach out personally within 24 hours to set up your free walkthrough. Check your inbox &mdash; I
          just sent you a note.
        </p>
      </div>
    );
  }

  return (
    <div id="lead-form" style={{ maxWidth: "520px", margin: "0 auto", width: "100%" }}>
      <div style={{ borderTop: "3px solid #0b0b0b", border: "1px solid rgba(0,0,0,0.1)", background: "#fafaf8", padding: "32px" }}>
        <p style={eyebrow}>Free &middot; No commitment</p>
        <h3 style={formHeading}>Get your free home check.</h3>
        <p style={formSub}>
          Tell me where your place is and I&apos;ll come take a look &mdash; no pressure, no obligation.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>Name <span style={{ color: "#b91c1c" }}>*</span></label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputStyle)}
            />
          </div>

          {/* Phone (required) + Email (optional) side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>Phone <span style={{ color: "#b91c1c" }}>*</span></label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
            </div>
            <div>
              <label style={labelStyle}>Email <span style={{ color: "rgba(0,0,0,0.3)", fontWeight: 400 }}>(optional)</span></label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
            </div>
          </div>

          {/* Neighborhood */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Where&apos;s your home?</label>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              style={{ ...inputStyle, color: neighborhood ? "#0b0b0b" : "rgba(0,0,0,0.4)", cursor: "pointer" }}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) =>
                Object.assign(e.target.style, { ...inputStyle, color: neighborhood ? "#0b0b0b" : "rgba(0,0,0,0.4)" })
              }
            >
              <option value="">Select neighborhood</option>
              <option value="Watersound Origins">Watersound Origins</option>
              <option value="Naturewalk">Naturewalk</option>
              <option value="Inlet Beach">Inlet Beach</option>
              <option value="Other 30A">Other 30A Community</option>
            </select>
          </div>

          {error && <p style={errorStyle}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              height: "52px",
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
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = "#1a1a1a";
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.background = "#0b0b0b";
            }}
          >
            {submitting ? "Sending…" : "Get My Free Home Check"}
          </button>

          <p style={fineprint}>
            I&apos;ll get back to you within 24 hours. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────── */
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
const inputFocusStyle: React.CSSProperties = { ...inputStyle, borderColor: "#0b0b0b" };
const eyebrow: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "10px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(0,0,0,0.4)",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
};
const formHeading: React.CSSProperties = {
  margin: "0 0 6px 0",
  fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
  fontSize: "clamp(22px, 3.5vw, 28px)",
  fontWeight: 600,
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  color: "#0b0b0b",
};
const formSub: React.CSSProperties = {
  margin: "0 0 24px 0",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  fontSize: "14px",
  lineHeight: 1.6,
  color: "rgba(0,0,0,0.55)",
};
const errorStyle: React.CSSProperties = {
  margin: "0 0 16px 0",
  fontSize: "13px",
  color: "#b91c1c",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};
const fineprint: React.CSSProperties = {
  margin: "12px 0 0 0",
  fontSize: "11px",
  color: "rgba(0,0,0,0.35)",
  lineHeight: 1.5,
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  textAlign: "center",
};
const card: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.1)",
  background: "#fafaf8",
  padding: "52px 40px",
  textAlign: "center",
  maxWidth: "520px",
  margin: "0 auto",
};
const check: React.CSSProperties = {
  width: "48px",
  height: "48px",
  border: "1.5px solid rgba(0,0,0,0.15)",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 24px",
};
const successHeading: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
  fontSize: "24px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "#0b0b0b",
};
const successBody: React.CSSProperties = {
  margin: 0,
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  fontSize: "15px",
  lineHeight: 1.65,
  color: "rgba(0,0,0,0.6)",
};
