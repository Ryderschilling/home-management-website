"use client";

import { useState } from "react";
import { bookingConfig } from "@/data/siteData";

const GOOGLE_ADS_ID = "AW-18257719328";
const CONVERSION_LABEL = "JhfKCL2oyskcEKDg-oFE";

function fireLeadEvents() {
  try {
    const w = window as unknown as {
      gtag?: (c: string, a: string, p: Record<string, unknown>) => void;
      posthog?: { capture: (e: string, p?: Record<string, unknown>) => void };
    };
    w.gtag?.("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}` });
    w.gtag?.("event", "generate_lead", { form_location: "/storm-check" });
    w.posthog?.capture("storm_check_signup");
  } catch {}
}

export default function StormCheckForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [onPlan, setOnPlan] = useState<"yes" | "no" | "">("");
  const [company, setCompany] = useState(""); // honeypot, humans never see it
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Add an email so the storm photos have somewhere to go.");
      return;
    }
    if (!address.trim()) {
      setError("Add the property address so the right house gets checked.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/storm-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: address.trim(),
          neighborhood,
          onPlan,
          company,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.error?.message || "That did not go through. Try again, or call.");
        return;
      }
      fireLeadEvents();
      setDone(true);
    } catch {
      setError("That did not go through. Try again, or call.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-8 md:p-10" role="status">
        <p className="ch-label mb-3">You are on the list</p>
        <h3 className="ch-display ch-display--sm mb-4">
          {firstName ? `Got it, ${firstName}.` : "Got it."}
        </h3>
        <p className="text-[15px] leading-[1.75] text-[var(--ch-muted)]">
          When a named storm is headed for 30A, Ryder confirms with you by text or email before
          the prep visit. After it passes, you get photos of your home by email. You do not need
          to be in town for any of it.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-5 border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-6 md:p-10"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="sc-name" className="ch-label mb-3 block">First name</label>
          <input id="sc-name" className="ch-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
        </div>
        <div>
          <label htmlFor="sc-email" className="ch-label mb-3 block">
            Email <span className="text-[var(--ch-teal)]">*</span>
          </label>
          <input id="sc-email" type="email" className="ch-field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
      </div>

      <div>
        <label htmlFor="sc-address" className="ch-label mb-3 block">
          Property address <span className="text-[var(--ch-teal)]">*</span>
        </label>
        <input id="sc-address" className="ch-field" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" required />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="sc-neighborhood" className="ch-label mb-3 block">Neighborhood</label>
          <select id="sc-neighborhood" className="ch-field" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
            <option value="">Select one</option>
            {bookingConfig.neighborhoods.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sc-phone" className="ch-label mb-3 block">Mobile, for storm texts</label>
          <input id="sc-phone" type="tel" className="ch-field" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
      </div>

      <fieldset>
        <legend className="ch-label mb-3 block">Are you on a Coastal Home Management 30A plan?</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ch-chip" aria-pressed={onPlan === "yes"} onClick={() => setOnPlan("yes")}>
            Yes, $50 per storm
          </button>
          <button type="button" className="ch-chip" aria-pressed={onPlan === "no"} onClick={() => setOnPlan("no")}>
            No, $100 per storm
          </button>
        </div>
      </fieldset>

      <div aria-hidden="true" className="hidden">
        <label htmlFor="sc-company">Company</label>
        <input id="sc-company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>

      {error && (
        <p className="border-l-2 border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] px-4 py-3 text-[13px] text-[var(--ch-ink)]">
          {error}
        </p>
      )}

      <button type="submit" className="ch-btn ch-btn--solid w-full justify-center" disabled={submitting}>
        {submitting ? "Sending" : "Add My Home to Storm Check"}
      </button>
      <p className="text-[12px] leading-relaxed text-[var(--ch-soft)]">
        Nothing is charged to sign up. Your details go straight to Ryder.
      </p>
    </form>
  );
}
