"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { formAttr } from "./AdTracker";

/**
 * Email list signup (added 10/10/26). Two looks, one endpoint (/api/subscribe):
 *  - "storm": light card on the storm pages, storm and freeze alerts.
 *  - "news":  compact row inside the dark footer, every page.
 * Not a lead form: it fires GA4 `sign_up`, never `generate_lead`, so the
 * lead and ad numbers stay clean.
 */

type Variant = "storm" | "news";

const COPY: Record<Variant, { label: string; heading: string; body: string; button: string; done: string }> = {
  storm: {
    label: "30A storm alerts",
    heading: "Get the heads up before the next one.",
    body: "When a storm or a freeze is headed for 30A, Ryder emails what's coming, what to do with your home, and what he's seeing on the ground. Short, local, only when it matters.",
    button: "Send me alerts",
    done: "You're on the list. Check your inbox for a note from Ryder.",
  },
  news: {
    label: "Homeowner news",
    heading: "Get the latest for 30A homeowners.",
    body: "A short note now and then, plus a heads up when a storm or a freeze is on the way.",
    button: "Sign up",
    done: "You're on the list. Check your inbox for a note from Ryder.",
  },
};

function fire(list: Variant, path: string) {
  try {
    const w = window as unknown as {
      gtag?: (c: string, a: string, p: Record<string, unknown>) => void;
      posthog?: { capture: (e: string, p?: Record<string, unknown>) => void };
    };
    w.gtag?.("event", "sign_up", { method: `email_${list}`, form_location: path });
    w.posthog?.capture("email_list_signup", { list, path });
  } catch {}
}

export default function EmailSignup({ variant = "news" }: { variant?: Variant }) {
  const path = usePathname() || "/";
  const c = COPY[variant];
  const dark = variant === "news";
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Add a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), firstName: firstName.trim(), list: variant, path, attr: formAttr(), company }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.error?.message || "That did not go through. Try again in a minute.");
        return;
      }
      fire(variant, path);
      setDone(true);
    } catch {
      setError("That did not go through. Try again in a minute.");
    } finally {
      setBusy(false);
    }
  }

  const honeypot = (
    <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 0, height: 0, overflow: "hidden" }}>
      <label>
        Company
        <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
      </label>
    </div>
  );

  if (dark) {
    return (
      <div className="relative">
        <p className="ch-label !text-white/45">{c.label}</p>
        <p className="mt-4 text-[18px] leading-snug text-white">{c.heading}</p>
        <p className="mt-2 text-[13.5px] leading-[1.7] text-white/62">{c.body}</p>
        {done ? (
          <p className="mt-5 text-[14px] text-[var(--ch-teal-bright)]" role="status">{c.done}</p>
        ) : (
          <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            {honeypot}
            <label htmlFor="news-email" className="sr-only">Email</label>
            <input
              id="news-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full min-w-0 border border-white/20 bg-white/5 px-4 text-[15px] text-white placeholder:text-white/40 focus:border-[var(--ch-teal-bright)] focus:outline-none"
            />
            <button type="submit" disabled={busy} className="ch-btn ch-btn--teal h-12 shrink-0 justify-center disabled:opacity-60">
              {busy ? "Adding you" : c.button}
            </button>
          </form>
        )}
        {error && <p className="mt-2 text-[13px] text-[#ff9c9c]" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-14 md:px-8 md:py-16">
      <div className="relative mx-auto grid max-w-[860px] gap-8 border border-[var(--ch-hairline)] border-l-2 border-l-[var(--ch-teal)] bg-[var(--ch-paper-alt)] p-6 md:grid-cols-[1.1fr_1fr] md:items-end md:p-10">
        <div>
          <p className="ch-label mb-3">{c.label}</p>
          <h2 className="ch-display ch-display--sm mb-4">{c.heading}</h2>
          <p className="text-[15px] leading-[1.75] text-[var(--ch-muted)]">{c.body}</p>
        </div>
        {done ? (
          <p className="text-[16px] leading-[1.6] text-[var(--ch-ink)]" role="status">{c.done}</p>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-3">
            {honeypot}
            <div>
              <label htmlFor="storm-name" className="ch-label mb-2 block">First name</label>
              <input id="storm-name" className="ch-field" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="storm-email" className="ch-label mb-2 block">Email <span className="text-[var(--ch-teal)]">*</span></label>
              <input id="storm-email" type="email" inputMode="email" className="ch-field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={busy} className="ch-btn ch-btn--solid w-full justify-center disabled:opacity-60">
              {busy ? "Adding you" : c.button}
            </button>
            {error && <p className="text-[13px] text-[#b42318]" role="alert">{error}</p>}
            <p className="text-[12px] text-[var(--ch-muted)]">No spam. Unsubscribe anytime.</p>
          </form>
        )}
      </div>
    </section>
  );
}
