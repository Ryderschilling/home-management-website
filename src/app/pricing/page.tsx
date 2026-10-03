"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { siteData, trustStats } from "@/data/siteData";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { PRICING_FAQS } from "@/data/pricingFaqs";
import { pricingStyles } from "@/components/pricing/pricingStyles";
import { InquiryModal, PlanCard, plans, termMeta, notSurePlan, type Plan, type BillingTerm } from "@/components/pricing/PlanCards";

const addons = [
  {
    name: "On-Call Visit",
    desc: "One task, one visit. A contractor meetup, an extra walkthrough, an errand at the house. One flat price.",
    price: "$100 flat",
  },
  {
    name: "On-Call Delivery",
    desc: "Furniture, appliance or package delivery. We let the crew in, wait on the window, and lock up after. Billed for the full delivery window, 2-hour minimum, capped at $200 per delivery.",
    price: "$50/hour of the window",
  },
  {
    name: "Artificial Rock Install",
    desc: "Custom decorative rock over exposed backflow / water pipes.",
    price: "$350/rock installed",
  },
  {
    name: "Arrival Prep (Add-On)",
    desc: "Pre-arrival setup for Essential or Home Watch clients.",
    price: "From $150/visit",
  },
  {
    name: "Storm Check",
    desc: "Storm prep before landfall and a photo check of your home after it passes. Sign up once for the season.",
    price: "$100/storm · $50 on a plan",
    href: "/storm-check",
  },
  {
    name: "Day-Rate Mail & Trash",
    desc: "Scheduled mail pickups, minimum 3 days.",
    price: "$35/day",
  },
  {
    name: "Water Shutoff Protection",
    desc: "Smart automatic shutoff valve on your main line, installed by a licensed plumber. Alerts route to us. Included on Coastal Elite.",
    price: "$1,295 installed + $35/mo",
  },
  {
    name: "Annual Coverage Record",
    desc: "Every visit for the year in one dated PDF with photos, built to hand to your insurance agent. Included on Coastal Elite.",
    price: "$195/year",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [term, setTerm] = useState<BillingTerm>("monthly");

  const handleSelect = useCallback((plan: Plan) => {
    setSelectedPlan(plan);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedPlan(null);
  }, []);

  return (
    <main className="pricing-page">
      {/* Header */}
      <header className="pricing-header">
        <img src="/logo.png" alt="CHM" className="header-logo" />
        <div className="trust-badge">
          <span className="trust-dot" />
          Your premium local &amp; insured home management company.
          <span className="trust-dot" />
        </div>
        <h1 className="header-h1">
          Service Plans <span className="header-accent">&amp; Pricing</span>
        </h1>
        <p className="header-sub">
          Your 30A home, watched over like it&apos;s our own.{" "}
          <br />
          Month-to-month by default, no contracts. Lock in 6 or 12 months and save.
        </p>
      </header>

      {/* Plans Grid */}
      <section className="plans-section">
        <div className="term-toggle" role="group" aria-label="Billing term">
          {(Object.keys(termMeta) as BillingTerm[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`term-btn ${term === t ? "term-btn-active" : ""}`}
              aria-pressed={term === t}
              onClick={() => {
                setTerm(t);
                posthog.capture("pricing_term_selected", { term: t });
              }}
            >
              {termMeta[t].label}
              {termMeta[t].save && (
                <span className={`term-save ${term === t ? "term-save-active" : ""}`}>
                  {termMeta[t].save}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="term-note">
          {term === "monthly"
            ? "Month-to-month. Cancel anytime. Or lock a rate and save."
            : `Rate locked for ${term === "6mo" ? "6" : "12"} months. Still billed monthly, nothing upfront.`}
        </p>
        <div className="plans-grid">
          {plans.map((plan) => (
            <PlanCard key={plan.tier} plan={plan} term={term} onSelect={handleSelect} />
          ))}
        </div>
      </section>

      {/* Undecided leads. The biggest drop-off on a pricing page is the person
          who wants a price but cannot pick a tier. Catch them here, not at the bottom. */}
      <section className="notsure-section">
        <div className="notsure-card">
          <p className="notsure-lbl">Not sure which plan?</p>
          <h2 className="notsure-h2">
            Send me your address and I&apos;ll tell you what your house actually needs.
          </h2>
          <p className="notsure-body">
            The first walkthrough is free and you do not need to be in Florida for it. I&apos;ll
            walk the property this week, email you photos and a written condition report within
            48 hours, and tell you straight which plan fits. Often it is less than people expect.
            The report is yours to keep either way.
          </p>
          <button
            type="button"
            className="notsure-btn"
            onClick={() => {
              posthog.capture("pricing_notsure_opened");
              setSelectedPlan(notSurePlan);
            }}
          >
            Get My Free Home Check
          </button>
          <p className="notsure-proof">
            {trustStats.ratingValue} on Google across {trustStats.reviewCount} reviews · Fully
            insured Florida LLC · Owner lives in Watersound Origins
          </p>
        </div>
      </section>

      {/* Add-ons */}
      <section className="addons-section">
        <div className="addons-lbl">À La Carte Add-Ons</div>
        <div className="addons-grid">
          {addons.map((a) => (
            <div key={a.name} className="addon">
              <div className="addon-name">{a.name}</div>
              <div className="addon-desc">{a.desc}</div>
              <div className="addon-price">{a.price}</div>
              {a.href ? (
                <Link href={a.href} className="addon-desc underline underline-offset-4">
                  Sign up for Storm Check
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Item 1: Pricing Comparison Table (Google Featured Snippet) ─── */}
      <section className="compare-section">
        <div className="compare-lbl">Plan Comparison</div>
        <div className="compare-wrap">
          <table className="compare-table">
            <caption className="compare-caption">
              Coastal Home Management 30A Service Plan Comparison
            </caption>
            <thead>
              <tr>
                <th scope="col" className="compare-th compare-th-feature">Feature</th>
                <th scope="col" className="compare-th compare-th-tier compare-th-bronze">
                  Essential<br />
                  <span className="compare-price">$200/mo</span>
                </th>
                <th scope="col" className="compare-th compare-th-tier compare-th-silver">
                  Home Watch<br />
                  <span className="compare-price">$300/mo</span>
                </th>
                <th scope="col" className="compare-th compare-th-tier compare-th-gold">
                  Coastal Elite<br />
                  <span className="compare-price">$600/mo</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="compare-td compare-td-feature">Walkthrough, interior &amp; exterior</td>
                <td className="compare-td compare-td-label compare-td-bronze">Bi-weekly</td>
                <td className="compare-td compare-td-label compare-td-silver">Weekly</td>
                <td className="compare-td compare-td-label compare-td-gold">Weekly</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Issue alerts sent immediately</td>
                <td className="compare-td compare-td-check compare-td-bronze">✓</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">Mail pickup every visit</td>
                <td className="compare-td compare-td-check compare-td-bronze">✓</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Trash out &amp; return (on request)</td>
                <td className="compare-td compare-td-check compare-td-bronze">✓</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">Secure key holding &amp; access coordination</td>
                <td className="compare-td compare-td-check compare-td-bronze">✓</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Photo documentation after every visit</td>
                <td className="compare-td compare-td-check compare-td-bronze">✓</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">Written visit report</td>
                <td className="compare-td compare-td-check compare-td-bronze">✓</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Appliance &amp; piping checks each visit</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">Irrigation filter cleaning</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Storm &amp; freeze checks</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">HVAC filter changes, every unit</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-label compare-td-gold">Free</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Pre-arrival walkthrough &amp; A/C pre-set</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">Post-departure secure check</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Contractor coordination &amp; on-call access</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-none" aria-label="Not included">·</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">Water Shutoff Protection, alert response</td>
                <td className="compare-td compare-td-label">Add-on</td>
                <td className="compare-td compare-td-label">Add-on</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Annual Coverage Record (dated PDF)</td>
                <td className="compare-td compare-td-label">$195/yr</td>
                <td className="compare-td compare-td-label">$195/yr</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature compare-td-price-row">Monthly price</td>
                <td className="compare-td compare-td-price compare-td-bronze">$200</td>
                <td className="compare-td compare-td-price compare-td-silver">$300</td>
                <td className="compare-td compare-td-price compare-td-gold">$600</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature compare-td-price-row">6-month rate lock (billed monthly)</td>
                <td className="compare-td compare-td-price compare-td-bronze">$190</td>
                <td className="compare-td compare-td-price compare-td-silver">$285</td>
                <td className="compare-td compare-td-price compare-td-gold">$570</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature compare-td-price-row">12-month rate lock (billed monthly)</td>
                <td className="compare-td compare-td-price compare-td-bronze">$180</td>
                <td className="compare-td compare-td-price compare-td-silver">$270</td>
                <td className="compare-td compare-td-price compare-td-gold">$540</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ. Rendered as real content AND as FAQPage schema in layout.tsx. */}
      <section className="faq-section">
        <div className="faq-lbl">Before You Decide</div>
        <div className="faq-list">
          {PRICING_FAQS.map((f) => (
            <div key={f.q} className="faq-item">
              <h3 className="faq-q">{f.q}</h3>
              <p className="faq-a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Services */}
      <section className="related-section">
        <div className="related-lbl">Also See</div>
        <div className="related-links">
          <Link href="/second-home-management-inlet-beach" className="related-link">Second Home Management</Link>
          <Link href="/concierge-services-inlet-beach" className="related-link">Concierge Services</Link>
          <Link href="/mail-package-handling-inlet-beach" className="related-link">Mail &amp; Package Handling</Link>
          <Link href="/home-check-services-30a" className="related-link">Home Check Services</Link>
          <Link href="/" className="related-link">Home</Link>
        </div>
      </section>

      {/* Legal. Read src/data/protection.ts before touching insurance copy. */}
      <section className="legal-strip">
        <LegalDisclaimer variant="inline" />
      </section>

      {/* Footer note */}
      <p className="footer-note">
        Questions? Call or text Ryder directly:{" "}
        <a href="tel:3094158793">(309) 415-8793</a>
        {" · "}
        <a href={`mailto:${siteData.contactEmail}`}>{siteData.contactEmail}</a>
      </p>

      {/* Modal */}
      {selectedPlan && <InquiryModal plan={selectedPlan} term={term} onClose={handleClose} />}

      <style jsx global>{pricingStyles}</style>
    </main>
  );
}
