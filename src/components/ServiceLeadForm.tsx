"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

function phCapture(event: string, props?: Record<string, unknown>) {
  try {
    const ph = (window as unknown as { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog;
    ph?.capture(event, props);
  } catch {}
}

export default function ServiceLeadForm() {
  const pathname = usePathname();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
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
          phone: phone.trim() || null,
          neighborhood: neighborhood || null,
          sourcePage: pathname,
          consent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data?.error?.message || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      phCapture("chm_lead_submitted", {
        source: "service_page_form",
        page: pathname,
        neighborhood: neighborhood || null,
        has_phone: !!phone.trim(),
      });

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        id="lead-form"
        style={{
          border: "1px solid rgba(0,0,0,0.1)",
          background: "#fafaf8",
          padding: "52px 40px",
          textAlign: "center",
          maxWidth: "560px",
          margin: "0 auto",
        }}
      >
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
        <h3 style={{
          margin: "0 0 12px 0",
          fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
          fontSize: "24px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "#0b0b0b",
        }}>
          {firstName ? `Got it, ${firstName}.` : "Got it."}
        </h3>
        <p style={{
          margin: 0,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          fontSize: "15px",
          lineHeight: 1.65,
          color: "rgba(0,0,0,0.6)",
        }}>
          I&apos;ll be in touch within 24 hours to schedule your free walkthrough.
          Check your inbox — I sent you something useful in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div id="lead-form" style={{ maxWidth: "560px", margin: "0 auto" }}>
      <div style={{
        borderTop: "3px solid #0b0b0b",
        border: "1px solid rgba(0,0,0,0.1)",
        background: "#fafaf8",
        padding: "40px",
      }}>
        <p style={{
          margin: "0 0 8px 0",
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(0,0,0,0.4)",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}>
          Free · No commitment
        </p>
        <h3 style={{
          margin: "0 0 6px 0",
          fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
          fontSize: "clamp(20px, 3.5vw, 26px)",
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "#0b0b0b",
        }}>
          Request a free property walkthrough.
        </h3>
        <p style={{
          margin: "0 0 28px 0",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          fontSize: "14px",
          lineHeight: 1.65,
          color: "rgba(0,0,0,0.55)",
        }}>
          I&apos;ll inspect your home and tell you exactly what it needs — no pressure, no commitment.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: Name + Email */}
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

          {/* Row 2: Phone + Neighborhood */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={inputStyle}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => Object.assign(e.target.style, inputStyle)}
              />
            </div>
            <div>
              <label style={labelStyle}>Neighborhood</label>
              <select
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                style={{
                  ...inputStyle,
                  color: neighborhood ? "#0b0b0b" : "rgba(0,0,0,0.4)",
                  cursor: "pointer",
                }}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => Object.assign(e.target.style, {
                  ...inputStyle,
                  color: neighborhood ? "#0b0b0b" : "rgba(0,0,0,0.4)",
                })}
              >
                <option value="">Select neighborhood</option>
                <option value="Watersound Origins">Watersound Origins</option>
                <option value="Naturewalk">Naturewalk</option>
                <option value="Inlet Beach">Inlet Beach</option>
                <option value="Other 30A">Other 30A Community</option>
              </select>
            </div>
          </div>

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

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              height: "50px",
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
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = "#1a1a1a"; }}
            onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = "#0b0b0b"; }}
          >
            {submitting ? "Sending…" : "Request a Free Walkthrough"}
          </button>

          <p style={{
            margin: "12px 0 0 0",
            fontSize: "11px",
            color: "rgba(0,0,0,0.35)",
            lineHeight: 1.5,
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            textAlign: "center",
          }}>
            By submitting, you agree to receive emails from Coastal Home Management 30A. No spam. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── Shared styles ────────────────────────────────────────────────────────────── */

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
