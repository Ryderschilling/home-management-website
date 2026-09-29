"use client";

import { useState, useCallback } from "react";
import posthog from "posthog-js";
import { siteData, trustStats } from "@/data/siteData";
import { pricingStyles } from "./pricingStyles";

/**
 * The three plan cards, the billing-term toggle and the inquiry modal, moved
 * out of /pricing on 9/29/26 so page 2 of Away on 30A can show the exact same
 * cards. /pricing imports everything from here.
 */

const GOOGLE_ADS_ID = "AW-18257719328";
const CONVERSION_LABEL = "JhfKCL2oyskcEKDg-oFE";

function fireGtagConversion() {
  try {
    const w = window as unknown as {
      gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
    };
    w.gtag?.("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}` });
    // GA4 lead event (added 9/11/26). Before this, no lead ever reached GA4, only
    // Google Ads and PostHog. Mark generate_lead as a key event in GA4 admin.
    w.gtag?.("event", "generate_lead", { form_location: window.location.pathname });
  } catch {}
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tier = "bronze" | "silver" | "gold";

export type BillingTerm = "monthly" | "6mo" | "12mo";

export interface Plan {
  tier: Tier;
  name: string;
  tagline: string;
  prices: Record<BillingTerm, number>;
  priceNote: string;
  badge: string;
  sections: { label: string; items: { text: string; tag?: string }[] }[];
  cta: string;
}

export const termMeta: Record<BillingTerm, { label: string; save: string | null; note: string }> = {
  monthly: { label: "Monthly", save: null, note: "" },
  "6mo": { label: "6 Months", save: "Save 5%", note: "billed monthly · 6-month rate lock" },
  "12mo": { label: "12 Months", save: "Save 10%", note: "billed monthly · 12-month rate lock" },
};

// ─── Plan Data ────────────────────────────────────────────────────────────────

export const plans: Plan[] = [
  {
    tier: "bronze",
    name: "Essential",
    tagline: "Simple, reliable home checks while you're away. Nothing missed.",
    prices: { monthly: 200, "6mo": 190, "12mo": 180 },
    priceNote: "month-to-month · no contracts",
    badge: "Bronze",
    cta: "Get Started",
    sections: [
      {
        label: "What's Included",
        items: [
          { text: "<strong>Bi-weekly walkthrough</strong>, interior & exterior, every other week" },
          { text: "<strong>Photo documentation</strong> and a written report after every visit" },
          { text: "<strong>Issue alerts</strong> sent immediately if anything needs attention" },
          { text: "<strong>Mail pickup</strong> every visit" },
          { text: "<strong>Trash out & return</strong> on request" },
          { text: "<strong>Secure key holding</strong> & access coordination" },
        ],
      },
    ],
  },
  {
    tier: "silver",
    name: "Home Watch",
    tagline: "Everything in Essential, every week, plus hands-on system checks.",
    prices: { monthly: 300, "6mo": 285, "12mo": 270 },
    priceNote: "month-to-month · no contracts",
    badge: "Silver",
    cta: "Get Started",
    sections: [
      {
        label: "What's Included",
        items: [
          { text: "<strong>Everything in Essential</strong>, plus:" },
          { text: "<strong>Weekly walkthrough</strong>, twice the visits of Essential" },
          { text: "<strong>Appliance & piping checks</strong> each visit" },
          { text: "<strong>Irrigation filter cleaning</strong>" },
          { text: "<strong>Photos and a written report</strong>, what was checked, what was found" },
        ],
      },
    ],
  },
  {
    tier: "gold",
    name: "Coastal Elite",
    tagline: "Full-service home management. Your property runs itself while you're gone.",
    prices: { monthly: 600, "6mo": 570, "12mo": 540 },
    priceNote: "Founding rate. Limited spots available.",
    badge: "Gold, Elite",
    cta: "Claim a Founding Spot",
    sections: [
      {
        label: "Full Watch + Reports",
        items: [
          { text: "<strong>Everything in Home Watch</strong>, plus:" },
          { text: "<strong>Storm & freeze checks</strong>, extra visits when weather moves in" },
          { text: "<strong>HVAC filter changes</strong>, every unit, every time", tag: "Free" },
        ],
      },
      {
        label: "Arrival Ready",
        items: [
          { text: "<strong>Pre-arrival walkthrough</strong>, home ready before you land" },
          { text: "<strong>A/C pre-set</strong> to your preference" },
          { text: "<strong>Post-departure secure check</strong> after you leave" },
        ],
      },
      {
        label: "Contractor & On-Call",
        items: [
          { text: "<strong>Contractor coordination</strong>, Ryder is your on-the-ground point of contact" },
          { text: "<strong>Priority response</strong>, you're first in line, always" },
        ],
      },
      {
        label: "Claim Protection",
        items: [
          { text: "<strong>Water Shutoff Protection</strong>, alerts come to us and we go to the house when it trips", tag: "Included" },
          { text: "<strong>Annual Coverage Record</strong>, a dated PDF of every visit for the year", tag: "$195 value" },
        ],
      },
    ],
  },
];

// Most people who land on a pricing page have not decided yet. Without this they
// read three numbers and leave. Reuses the existing InquiryModal so the lead
// still hits /api/pricing/inquire and still fires the Google Ads conversion.
export const notSurePlan: Plan = {
  tier: "silver",
  name: "Not Sure Yet",
  tagline: "Tell me about the property and I'll tell you what it actually needs.",
  prices: { monthly: 0, "6mo": 0, "12mo": 0 },
  priceNote: "",
  badge: "",
  cta: "Send It",
  sections: [],
};

// ─── Check SVG ────────────────────────────────────────────────────────────────

export function Check({ tier }: { tier: Tier }) {
  return (
    <span className={`fi-check fi-check-${tier}`}>
      <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1.5,5 4,7.5 8.5,2.5" />
      </svg>
    </span>
  );
}

// ─── Inquiry Modal ────────────────────────────────────────────────────────────

interface ModalProps {
  plan: Plan;
  term: BillingTerm;
  onClose: () => void;
}

type SubmitState = "idle" | "loading" | "success" | "error";

export function InquiryModal({ plan, term, onClose }: ModalProps) {
  const price = plan.prices[term];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/pricing/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.name,
          tier: plan.tier,
          price,
          term: term === "monthly" ? "Month-to-month" : `${termMeta[term].label} rate lock`,
          name,
          email,
          phone,
          address,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Something went wrong");
      }

      posthog.capture("pricing_inquiry_submitted", {
        plan: plan.name,
        tier: plan.tier,
        price,
        term,
      });
      fireGtagConversion();
      setState("success");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Submission failed");
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-card modal-card-${plan.tier}`}>
        {/* Close */}
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>

        {state === "success" ? (
          <div className="modal-success">
            <div className={`success-icon success-icon-${plan.tier}`}>✓</div>
            <h3>You&apos;re all set.</h3>
            <p>
              {price > 0 ? (
                <>
                  We received your inquiry for the <strong>{plan.name}</strong> plan.
                </>
              ) : (
                <>
                  Got it. Ryder will walk your home this week and email you photos and a written
                  condition report within 48 hours.
                </>
              )}{" "}
              Ryder will be
              in touch within 24 hours.
            </p>
            <button className={`modal-submit modal-submit-${plan.tier}`} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className={`modal-plan-badge modal-plan-badge-${plan.tier}`}>
              {price > 0
                ? `${plan.badge} · $${price}/mo${term !== "monthly" ? ` · ${termMeta[term].label} lock` : ""}`
                : "Free home check · no commitment"}
            </div>
            <h2 className="modal-title">
              {price > 0 ? `Get Started with ${plan.name}` : "Get My Free Home Check"}
            </h2>
            <p className="modal-sub">
              Fill this out and Ryder will personally reach out within 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <label className="form-label" htmlFor="inq-name">
                  Full Name <span className="req">*</span>
                </label>
                <input
                  id="inq-name"
                  className={`form-input form-input-${plan.tier}`}
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="inq-email">
                  Email <span className="req">*</span>
                </label>
                <input
                  id="inq-email"
                  className={`form-input form-input-${plan.tier}`}
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="inq-phone">
                  Phone <span className="req">*</span>
                </label>
                <input
                  id="inq-phone"
                  className={`form-input form-input-${plan.tier}`}
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="inq-address">
                  Property Address <span className="opt">(optional)</span>
                </label>
                <input
                  id="inq-address"
                  className={`form-input form-input-${plan.tier}`}
                  type="text"
                  placeholder="123 Watersound Blvd, Inlet Beach FL"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="inq-message">
                  Anything else? <span className="opt">(optional)</span>
                </label>
                <textarea
                  id="inq-message"
                  className={`form-input form-textarea form-input-${plan.tier}`}
                  placeholder="Tell Ryder anything that would help, specific needs, timing, concerns..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {state === "error" && (
                <div className="form-error">{errorMsg || "Something went wrong. Please try again."}</div>
              )}

              <button
                type="submit"
                className={`modal-submit modal-submit-${plan.tier}`}
                disabled={state === "loading"}
              >
                {state === "loading" ? "Sending..." : "Send Inquiry"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

export function PlanCard({ plan, term, onSelect }: { plan: Plan; term: BillingTerm; onSelect: (p: Plan) => void }) {
  const isGold = plan.tier === "gold";
  // Mobile only: the feature list starts folded so all three plans fit in a
  // couple of thumbs of scrolling. Desktop always shows everything (CSS).
  const [open, setOpen] = useState(false);
  const count = plan.sections.reduce((n, s) => n + s.items.length, 0);
  const price = plan.prices[term];
  const monthlySavings = plan.prices.monthly - price;

  return (
    <div className={`card card-${plan.tier}`}>
      {isGold && <div className="gold-pulse" />}
      {isGold && <div className="hot-tag">Most Complete</div>}

      <div className={`badge badge-${plan.tier}`}>
        <span className="badge-dot" />
        {plan.badge}
      </div>

      <div className="plan-name">{plan.name}</div>
      <div className="plan-sub">{plan.tagline}</div>

      <div className="price-row">
        <span className="price-sym">$</span>
        <span className="price-num">{price}</span>
        {monthlySavings > 0 && <span className="price-was">${plan.prices.monthly}</span>}
      </div>
      <div className="price-period">
        per month
        {monthlySavings > 0 && (
          <span className={`save-pill save-pill-${plan.tier}`}>Save ${monthlySavings}/mo</span>
        )}
      </div>
      <div className={`price-note ${isGold && term === "monthly" ? "price-note-gold" : ""}`}>
        {term === "monthly" ? (
          isGold ? (
            <strong>Founding rate. Limited spots available.</strong>
          ) : (
            plan.priceNote
          )
        ) : (
          termMeta[term].note
        )}
      </div>

      <button className={`cta cta-${plan.tier} cta-mobile`} onClick={() => { posthog.capture("pricing_cta_clicked", { plan: plan.name, tier: plan.tier, price, term, where: "mobile-top" }); onSelect(plan); }}>
        {plan.cta}
      </button>
      <button type="button" className="features-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide what's included" : `See what's included (${count})`}
        <span aria-hidden="true" className={`features-caret ${open ? "features-caret-open" : ""}`}>›</span>
      </button>

      <div className={`features-wrap ${open ? "features-open" : ""}`}>
      <div className={`divider divider-${plan.tier}`} />

      {plan.sections.map((section) => (
        <div key={section.label}>
          <div className="section-lbl">{section.label}</div>
          <ul className="features">
            {section.items.map((item, i) => (
              <li key={i} className="fi">
                <Check tier={plan.tier} />
                <span>
                  <span dangerouslySetInnerHTML={{ __html: item.text }} />
                  {item.tag && <span className={`tag tag-${plan.tier}`}>{item.tag}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      </div>

      <button className={`cta cta-${plan.tier} cta-desktop`} onClick={() => { posthog.capture("pricing_cta_clicked", { plan: plan.name, tier: plan.tier, price, term }); onSelect(plan); }}>
        {plan.cta}
      </button>
    </div>
  );
}

// ─── Cards block (toggle + grid + modal) ─────────────────────────────────────

export function PlanCards({ showStyles = true }: { showStyles?: boolean }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [term, setTerm] = useState<BillingTerm>("monthly");
  const handleSelect = useCallback((plan: Plan) => setSelectedPlan(plan), []);
  return (
    <section className="plans-section">
      <div className="term-toggle" role="group" aria-label="Billing term">
        {(Object.keys(termMeta) as BillingTerm[]).map((t) => (
          <button key={t} type="button" className={`term-btn ${term === t ? "term-btn-active" : ""}`} aria-pressed={term === t} onClick={() => { setTerm(t); posthog.capture("pricing_term_selected", { term: t }); }}>
            {termMeta[t].label}
            {termMeta[t].save && <span className={`term-save ${term === t ? "term-save-active" : ""}`}>{termMeta[t].save}</span>}
          </button>
        ))}
      </div>
      <p className="term-note">
        {term === "monthly" ? "Month-to-month. Cancel anytime. Or lock a rate and save." : `Rate locked for ${term === "6mo" ? "6" : "12"} months. Still billed monthly, nothing upfront.`}
      </p>
      <div className="plans-grid">
        {plans.map((plan) => (
          <PlanCard key={plan.tier} plan={plan} term={term} onSelect={handleSelect} />
        ))}
      </div>
      {selectedPlan && <InquiryModal plan={selectedPlan} term={term} onClose={() => setSelectedPlan(null)} />}
      {showStyles && <style jsx global>{pricingStyles}</style>}
    </section>
  );
}
