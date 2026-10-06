"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formAttr } from "@/components/AdTracker";
import { fireConversion, rememberEmail } from "./fire";

/**
 * The one ask on page 1: an email. One glowing box with the send arrow built
 * into it, so it reads as "type here", never as a link to more info.
 *
 * Why it looks like this (10/5/26): the old "Show me how it works" button read
 * like a link. 6 people tapped it, 5 tapped with the box empty, saw an error
 * and left (one tapped 1.3s after the page loaded). Now:
 *   - tapping anywhere on the box, or the arrow with the box empty, opens the
 *     keyboard instead of showing an error
 *   - text is 17px so iPhone does not zoom the page when the box is tapped
 *   - every failed send is logged as a form_error event (empty, invalid,
 *     server, network), so a lost hand-raiser is counted, not invisible
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // same rule as /api/away/optin

function track(label: string) {
  try {
    window.chmTrack?.("form_error", { label: `Opt-in: ${label}` });
  } catch {}
}

export default function OptInForm({ id = "optin" }: { id?: string; dark?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shaking, setShaking] = useState(false);

  const looksGood = EMAIL_RE.test(email.trim().toLowerCase());

  function nudge(msg = "") {
    setError(msg);
    input.current?.focus();
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const clean = email.trim().toLowerCase();
    if (!clean) {
      track("empty");
      return nudge();
    }
    if (!EMAIL_RE.test(clean)) {
      track("invalid");
      return nudge("That email looks off. Check it, then tap the arrow.");
    }
    setError("");
    setBusy(true);
    // One id for the browser pixel AND the server (Conversions API), so Meta
    // counts this opt-in once, not twice.
    let eventId = "";
    try {
      eventId = crypto.randomUUID();
    } catch {
      eventId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    try {
      const res = await fetch("/api/away/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, company, eventId, attr: formAttr() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        track(`server ${res.status}`);
        nudge(data?.error?.message || "That did not go through. Tap the arrow again.");
        return;
      }
      // The server says whether this is a NEW person; a repeat is not a new Lead for Meta.
      if (data?.fire !== false) fireConversion("optin", eventId);
      rememberEmail(clean);
      router.push("/away-on-30a/next");
    } catch {
      track("network");
      nudge("That did not go through. Tap the arrow again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form id={id} onSubmit={submit} noValidate className="mx-auto w-full max-w-[400px] sm:max-w-[520px]">
      <label htmlFor={`${id}-email`} className="aw-optin__label">
        Where should we send it?
      </label>
      <div
        className={`aw-optin ${shaking ? "aw-optin--shake" : ""} ${looksGood ? "aw-optin--ready" : ""}`}
        onClick={() => input.current?.focus()}
        onAnimationEnd={(e) => {
          if (e.animationName === "aw-shake") setShaking(false);
        }}
      >
        <svg className="aw-optin__icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          ref={input}
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder="Your email"
          className="aw-optin__input"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
        />
        <button
          type="submit"
          className="aw-optin__send"
          disabled={busy}
          aria-label="Send"
          data-track="Opt-in: send arrow"
          onClick={(e) => e.stopPropagation()}
        >
          {busy ? (
            <span className="aw-optin__spin" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
      <div aria-hidden="true" className="hidden">
        <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      {error ? (
        <p className="mt-3 text-[14px] text-[var(--ch-ink)]" role="alert">{error}</p>
      ) : null}
    </form>
  );
}
