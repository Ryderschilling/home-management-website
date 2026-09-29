"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fireConversion, rememberEmail } from "./fire";

/**
 * The one ask on page 1: an email, to learn more. One field, one
 * button. Everything else waits for page 2, because every extra field here
 * costs opt-ins.
 */
export default function OptInForm({ id = "optin", dark = false }: { id?: string; dark?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setError("Add a real email so Ryder can reach you.");
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
        body: JSON.stringify({ email: clean, company, eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.error?.message || "That did not go through. Try again.");
        return;
      }
      // The server says whether this is a NEW person; a repeat is not a new Lead for Meta.
      if (data?.fire !== false) fireConversion("optin", eventId);
      rememberEmail(clean);
      router.push("/away-on-30a/next");
    } catch {
      setError("That did not go through. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form id={id} onSubmit={submit} noValidate className="w-full max-w-[560px]">
      <div className={`flex flex-col gap-2 sm:flex-row ${dark ? "" : ""}`}>
        <label htmlFor={`${id}-email`} className="sr-only">Email</label>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Your email"
          className="ch-field w-full !h-[58px] !text-[17px] sm:flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className={`ch-btn ${dark ? "ch-btn--teal" : "ch-btn--solid"} !h-[58px] justify-center whitespace-nowrap sm:px-7`} disabled={busy} data-track="Opt-in: show me how it works">
          {busy ? "Sending" : "Show me how it works"}
        </button>
      </div>
      <div aria-hidden="true" className="hidden">
        <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      {error ? (
        <p className={`mt-3 text-[13px] ${dark ? "text-white" : "text-[var(--ch-ink)]"}`} role="alert">{error}</p>
      ) : (
        <p className={`mt-3 text-[12.5px] ${dark ? "text-white/60" : "text-[var(--ch-soft)]"}`}>
          Free, no commitment. No spam.
        </p>
      )}
    </form>
  );
}
