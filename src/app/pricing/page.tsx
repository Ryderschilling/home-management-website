"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { siteData } from "@/data/siteData";

const GOOGLE_ADS_ID = "AW-18257719328";
const CONVERSION_LABEL = "JhfKCL2oyskcEKDg-oFE";

function fireGtagConversion() {
  try {
    const w = window as unknown as {
      gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
    };
    w.gtag?.("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}` });
  } catch {}
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = "bronze" | "silver" | "gold";

interface Plan {
  tier: Tier;
  name: string;
  tagline: string;
  price: number;
  priceNote: string;
  badge: string;
  sections: { label: string; items: { text: string; tag?: string }[] }[];
  cta: string;
}

// ─── Plan Data ────────────────────────────────────────────────────────────────

const plans: Plan[] = [
  {
    tier: "bronze",
    name: "Essential",
    tagline: "Simple, reliable home checks while you're away. Nothing missed.",
    price: 150,
    priceNote: "month-to-month · no contracts",
    badge: "Bronze",
    cta: "Get Started",
    sections: [
      {
        label: "What's Included",
        items: [
          { text: "<strong>Weekly walkthrough</strong> — interior & exterior" },
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
    tagline: "Everything in Essential plus photo reports and hands-on property care.",
    price: 300,
    priceNote: "month-to-month · no contracts",
    badge: "Silver",
    cta: "Get Started",
    sections: [
      {
        label: "What's Included",
        items: [
          { text: "<strong>Everything in Essential</strong>, plus:" },
          { text: "<strong>Photo documentation</strong> sent after every visit" },
          { text: "<strong>Written visit report</strong> — what was checked, what was found" },
          { text: "<strong>Appliance & piping checks</strong> each visit" },
          { text: "<strong>Irrigation filter cleaning</strong>" },
        ],
      },
    ],
  },
  {
    tier: "gold",
    name: "Coastal Elite",
    tagline: "Full-service home management. Your property runs itself while you're gone.",
    price: 600,
    priceNote: "Founding rate — limited spots available.",
    badge: "Gold — Elite",
    cta: "Claim a Founding Spot",
    sections: [
      {
        label: "Full Watch + Reports",
        items: [
          { text: "<strong>Everything in Home Watch</strong>, plus:" },
          { text: "<strong>Storm & freeze monitoring</strong> — active checks when weather moves in" },
          { text: "<strong>HVAC filter changes</strong> — every unit, every time", tag: "Free" },
        ],
      },
      {
        label: "Arrival Ready",
        items: [
          { text: "<strong>Pre-arrival walkthrough</strong> — home ready before you land" },
          { text: "<strong>A/C pre-set</strong> to your preference" },
          { text: "<strong>Post-departure secure check</strong> after you leave" },
        ],
      },
      {
        label: "Contractor & On-Call",
        items: [
          { text: "<strong>Contractor coordination</strong> — Ryder is your on-the-ground point of contact" },
          { text: "<strong>Priority response</strong> — you're first in line, always" },
        ],
      },
    ],
  },
];

const addons = [
  {
    name: "Extra On-Call Service",
    desc: "One task, one visit — beyond included services on any plan.",
    price: "$75 + $45/hr",
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
    name: "Day-Rate Mail & Trash",
    desc: "Short trips or one-offs without a monthly retainer.",
    price: "$35/day",
  },
];

// ─── Check SVG ────────────────────────────────────────────────────────────────

function Check({ tier }: { tier: Tier }) {
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
  onClose: () => void;
}

type SubmitState = "idle" | "loading" | "success" | "error";

function InquiryModal({ plan, onClose }: ModalProps) {
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
          price: plan.price,
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
        price: plan.price,
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
            <h3>You're all set.</h3>
            <p>
              We received your inquiry for the <strong>{plan.name}</strong> plan. Ryder will be
              in touch within 24 hours.
            </p>
            <button className={`modal-submit modal-submit-${plan.tier}`} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className={`modal-plan-badge modal-plan-badge-${plan.tier}`}>
              {plan.badge} — ${plan.price}/mo
            </div>
            <h2 className="modal-title">Get Started with {plan.name}</h2>
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
                  placeholder="Tell Ryder anything that would help — specific needs, timing, concerns..."
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

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: (p: Plan) => void }) {
  const isGold = plan.tier === "gold";

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
        <span className="price-num">{plan.price}</span>
      </div>
      <div className="price-period">per month</div>
      <div className={`price-note ${isGold ? "price-note-gold" : ""}`}>
        {isGold ? (
          <>
            <strong>Founding rate — limited spots available.</strong>
          </>
        ) : (
          plan.priceNote
        )}
      </div>

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

      <button className={`cta cta-${plan.tier}`} onClick={() => { posthog.capture("pricing_cta_clicked", { plan: plan.name, tier: plan.tier, price: plan.price }); onSelect(plan); }}>
        {plan.cta}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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
          Your 30A home, watched over like it&apos;s our own.
          <br />
          All plans are month-to-month. No contracts. No cancellation fees.
        </p>
      </header>

      {/* Plans Grid */}
      <section className="plans-section">
        <div className="plans-grid">
          {plans.map((plan) => (
            <PlanCard key={plan.tier} plan={plan} onSelect={handleSelect} />
          ))}
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
              Coastal Home Management 30A — Service Plan Comparison
            </caption>
            <thead>
              <tr>
                <th scope="col" className="compare-th compare-th-feature">Feature</th>
                <th scope="col" className="compare-th compare-th-tier compare-th-bronze">
                  Essential<br />
                  <span className="compare-price">$150/mo</span>
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
                <td className="compare-td compare-td-feature">Weekly walkthrough — interior &amp; exterior</td>
                <td className="compare-td compare-td-check compare-td-bronze">✓</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
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
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">Written visit report</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Appliance &amp; piping checks each visit</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">Irrigation filter cleaning</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-check compare-td-silver">✓</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Storm &amp; freeze monitoring</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">HVAC filter changes — every unit</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-label compare-td-gold">Free</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Pre-arrival walkthrough &amp; A/C pre-set</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature">Post-departure secure check</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr className="compare-row-alt">
                <td className="compare-td compare-td-feature">Contractor coordination &amp; on-call access</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-none">—</td>
                <td className="compare-td compare-td-check compare-td-gold">✓</td>
              </tr>
              <tr>
                <td className="compare-td compare-td-feature compare-td-price-row">Monthly price</td>
                <td className="compare-td compare-td-price compare-td-bronze">$150</td>
                <td className="compare-td compare-td-price compare-td-silver">$300</td>
                <td className="compare-td compare-td-price compare-td-gold">$600</td>
              </tr>
            </tbody>
          </table>
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

      {/* Footer note */}
      <p className="footer-note">
        Questions? Call or text Ryder directly:{" "}
        <a href="tel:3094158793">(309) 415-8793</a>
        {" · "}
        <a href={`mailto:${siteData.contactEmail}`}>{siteData.contactEmail}</a>
      </p>

      {/* Modal */}
      {selectedPlan && <InquiryModal plan={selectedPlan} onClose={handleClose} />}

      <style jsx global>{`
        /* ── Reset / base ─────────────────────────────── */
        .pricing-page {
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
          background: #f0f6ff;
          color: #0f172a;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* ── Header ─────────────────────────────────────── */
        .pricing-header {
          text-align: center;
          padding: 120px 24px 56px;
          animation: fadeDown 0.7s ease both;
          background: linear-gradient(180deg, #e8f0fe 0%, #f0f6ff 100%);
          border-bottom: 1px solid #d0e2ff;
        }
        .header-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.25);
          border-radius: 100px;
          padding: 7px 18px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #1d4ed8;
          margin-bottom: 20px;
        }
        .trust-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2563eb;
          flex-shrink: 0;
          opacity: 0.7;
        }
        .header-h1 {
          font-size: clamp(28px, 5vw, 46px);
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #0f172a;
          margin: 0 0 12px;
        }
        .header-accent { color: #2563eb; }
        .header-sub {
          font-size: 15px;
          color: #64748b;
          line-height: 1.7;
          max-width: 440px;
          margin: 0 auto;
        }

        /* ── Plans ──────────────────────────────────────── */
        .plans-section {
          padding: 0 20px;
          max-width: 1160px;
          margin: 0 auto;
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
          .card-gold   { order: 1; }
          .card-silver { order: 2; }
          .card-bronze { order: 3; }
        }

        /* ── Card ───────────────────────────────────────── */
        .card {
          background: #ffffff;
          border-radius: 20px;
          padding: 36px 28px 40px;
          position: relative;
          overflow: hidden;
          border: 1px solid #d0e2ff;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          animation: fadeUp 0.7s ease both;
        }
        .card:nth-child(1) { animation-delay: 0.15s; }
        .card:nth-child(2) { animation-delay: 0.28s; }
        .card:nth-child(3) { animation-delay: 0.42s; }
        .card:hover { transform: translateY(-6px); }

        /* top accent edge */
        .card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }
        /* shimmer sweep */
        .card::after {
          content: "";
          position: absolute;
          top: 0; left: -120%;
          width: 60%; height: 100%;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%);
          transition: left 0.55s ease;
          pointer-events: none;
        }
        .card:hover::after { left: 160%; }

        /* Sky / Essential */
        .card-bronze { border-color: #bae0fd; }
        .card-bronze::before { background: linear-gradient(90deg, transparent, #38bdf8, transparent); }
        .card-bronze:hover { box-shadow: 0 20px 60px rgba(56,189,248,0.18), 0 0 0 1px #7dd3fc; }

        /* Ocean / Home Watch */
        .card-silver { border-color: #bfdbfe; }
        .card-silver::before { background: linear-gradient(90deg, transparent, #3b82f6, transparent); }
        .card-silver:hover { box-shadow: 0 20px 60px rgba(59,130,246,0.16), 0 0 0 1px #93c5fd; }

        /* Navy / Coastal Elite */
        .card-gold { background: linear-gradient(160deg, #eff6ff 0%, #ffffff 100%); border-color: #93c5fd; }
        .card-gold::before { background: linear-gradient(90deg, transparent, #1d4ed8, transparent); }
        .card-gold:hover { box-shadow: 0 24px 80px rgba(29,78,216,0.18), 0 0 0 1px #60a5fa; }

        /* Elite pulse glow */
        .gold-pulse {
          position: absolute;
          top: -40%; left: 50%;
          transform: translateX(-50%);
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%);
          animation: pulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        /* Most Complete tag */
        .hot-tag {
          position: absolute;
          top: -1px; right: 28px;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 5px 14px 4px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 4px 12px rgba(29,78,216,0.35);
        }

        /* ── Badge ──────────────────────────────────────── */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 13px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 18px;
          position: relative;
          overflow: hidden;
        }
        .badge::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
          animation: shimmerBadge 2.5s ease-in-out infinite;
        }
        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }
        .badge-bronze { background: #e0f2fe; border: 1px solid #7dd3fc; color: #0284c7; }
        .badge-silver { background: #dbeafe; border: 1px solid #93c5fd; color: #1d4ed8; }
        .badge-gold   { background: #eff6ff; border: 1px solid #60a5fa; color: #1e40af; }

        /* ── Plan text ──────────────────────────────────── */
        .plan-name { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; margin-bottom: 5px; }
        .plan-sub  { font-size: 13px; color: #64748b; margin-bottom: 26px; line-height: 1.55; }

        /* ── Price ──────────────────────────────────────── */
        .price-row { display: flex; align-items: flex-end; gap: 4px; margin-bottom: 4px; }
        .price-sym { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .price-num { font-size: 56px; font-weight: 900; letter-spacing: -0.05em; line-height: 1; }
        .price-period { font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
        .price-note { font-size: 11.5px; color: #94a3b8; margin-bottom: 30px; min-height: 18px; }
        .price-note-gold strong { color: #1d4ed8; }

        .card-bronze .price-num,.card-bronze .price-sym { background: linear-gradient(135deg,#38bdf8,#0ea5e9); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .card-silver .price-num,.card-silver .price-sym { background: linear-gradient(135deg,#3b82f6,#2563eb); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .card-gold   .price-num,.card-gold   .price-sym { background: linear-gradient(135deg,#1d4ed8,#1e40af); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        /* ── Divider ────────────────────────────────────── */
        .divider { height: 1px; margin-bottom: 22px; }
        .divider-bronze { background: linear-gradient(90deg,transparent,#7dd3fc,transparent); }
        .divider-silver { background: linear-gradient(90deg,transparent,#93c5fd,transparent); }
        .divider-gold   { background: linear-gradient(90deg,transparent,#60a5fa,transparent); }

        /* ── Section label ──────────────────────────────── */
        .section-lbl { font-size: 9.5px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 12px; }
        .card-bronze .section-lbl { color: #0284c7; }
        .card-silver .section-lbl { color: #2563eb; }
        .card-gold   .section-lbl { color: #1e40af; }

        /* ── Features ───────────────────────────────────── */
        .features { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 11px; margin-bottom: 22px; }
        .fi { display: flex; align-items: flex-start; gap: 11px; font-size: 13.5px; color: #475569; line-height: 1.5; }
        .fi strong { color: #0f172a; font-weight: 600; }

        .fi-check {
          flex-shrink: 0;
          width: 18px; height: 18px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px;
        }
        .fi-check svg { width: 9px; height: 9px; }

        .fi-check-bronze { background: rgba(14,165,233,0.1);  border: 1px solid #7dd3fc; color: #0ea5e9; }
        .fi-check-silver { background: rgba(59,130,246,0.1);  border: 1px solid #93c5fd; color: #3b82f6; }
        .fi-check-gold   { background: rgba(29,78,216,0.1);   border: 1px solid #60a5fa; color: #1d4ed8; }

        /* ── Tag chips ──────────────────────────────────── */
        .tag {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          margin-left: 6px;
          vertical-align: middle;
        }
        .tag-bronze { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; }
        .tag-silver { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
        .tag-gold   { background: #eff6ff; color: #1e40af; border: 1px solid #60a5fa; }

        /* ── CTA ────────────────────────────────────────── */
        .cta {
          display: block;
          width: 100%;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-align: center;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          margin-top: 28px;
          font-family: inherit;
        }
        .cta-bronze { background: #e0f2fe; border: 1px solid #7dd3fc; color: #0284c7; }
        .cta-bronze:hover { background: #bae6fd; border-color: #38bdf8; box-shadow: 0 4px 16px rgba(14,165,233,0.2); }
        .cta-silver { background: #dbeafe; border: 1px solid #93c5fd; color: #1d4ed8; }
        .cta-silver:hover { background: #bfdbfe; border-color: #60a5fa; box-shadow: 0 4px 16px rgba(59,130,246,0.2); }
        .cta-gold   { background: linear-gradient(135deg,#1d4ed8,#3b82f6); color: #fff; border: none; }
        .cta-gold:hover { background: linear-gradient(135deg,#1e40af,#2563eb); transform: translateY(-2px); box-shadow: 0 10px 32px rgba(29,78,216,0.35); }

        /* ── Add-ons ─────────────────────────────────────── */
        .addons-section { max-width: 1160px; margin: 64px auto 0; padding: 0 20px; }
        .addons-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; text-align: center; margin-bottom: 18px; }
        .addons-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        @media (max-width: 700px) { .addons-grid { grid-template-columns: repeat(2,1fr); } }
        .addon { background: #ffffff; border: 1px solid #d0e2ff; border-radius: 12px; padding: 18px 20px; transition: border-color 0.2s, box-shadow 0.2s; }
        .addon:hover { border-color: #93c5fd; box-shadow: 0 4px 20px rgba(59,130,246,0.1); }
        .addon-name  { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .addon-desc  { font-size: 12px; color: #64748b; line-height: 1.5; }
        .addon-price { font-size: 15px; font-weight: 800; margin-top: 10px; color: #1d4ed8; }

        /* ── Related Services ────────────────────────────── */
        .related-section { max-width: 1160px; margin: 56px auto 0; padding: 0 20px; border-top: 1px solid #dbeafe; padding-top: 40px; }
        .related-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; }
        .related-links { display: flex; flex-wrap: wrap; gap: 10px; }
        .related-link { border: 1px solid #bfdbfe; padding: 8px 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #3b82f6; text-decoration: none; border-radius: 4px; transition: border-color 0.2s, background 0.2s, color 0.2s; }
        .related-link:hover { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }

        /* ── Footer note ─────────────────────────────────── */
        .footer-note { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 56px; line-height: 1.8; padding: 0 16px; }
        .footer-note a { color: #3b82f6; text-decoration: none; }
        .footer-note a:hover { color: #1d4ed8; text-decoration: underline; }

        /* ── Modal ───────────────────────────────────────── */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease both;
        }
        .modal-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 40px 36px;
          max-width: 500px;
          width: 100%;
          position: relative;
          border: 1px solid #d0e2ff;
          animation: slideUp 0.3s cubic-bezier(0.18,0.82,0.16,1) both;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-card-bronze { border-color: #7dd3fc; box-shadow: 0 0 60px rgba(14,165,233,0.12); }
        .modal-card-silver { border-color: #93c5fd; box-shadow: 0 0 60px rgba(59,130,246,0.12); }
        .modal-card-gold   { border-color: #60a5fa; box-shadow: 0 0 80px rgba(29,78,216,0.15); }

        .modal-close {
          position: absolute;
          top: 16px; right: 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 6px;
          display: flex;
          transition: color 0.15s;
        }
        .modal-close svg { width: 14px; height: 14px; }
        .modal-close:hover { color: #475569; }

        .modal-plan-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .modal-plan-badge-bronze { background: #e0f2fe; border: 1px solid #7dd3fc; color: #0284c7; }
        .modal-plan-badge-silver { background: #dbeafe; border: 1px solid #93c5fd; color: #1d4ed8; }
        .modal-plan-badge-gold   { background: #eff6ff; border: 1px solid #60a5fa; color: #1e40af; }

        .modal-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; margin: 0 0 6px; }
        .modal-sub   { font-size: 13px; color: #64748b; margin: 0 0 28px; line-height: 1.5; }

        /* ── Form ───────────────────────────────────────── */
        .modal-form { display: flex; flex-direction: column; gap: 18px; }
        .form-row { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
        .req { color: #dc2626; margin-left: 2px; }
        .opt { color: #94a3b8; font-weight: 400; text-transform: none; letter-spacing: 0; }

        .form-input {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 11px 14px;
          font-size: 14px;
          color: #0f172a;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .form-input::placeholder { color: #cbd5e1; }
        .form-textarea { resize: vertical; min-height: 80px; }

        .form-input-bronze:focus { border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(14,165,233,0.12); }
        .form-input-silver:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.12); }
        .form-input-gold:focus   { border-color: #1d4ed8; box-shadow: 0 0 0 2px rgba(29,78,216,0.12); }

        .form-error { font-size: 13px; color: #dc2626; padding: 10px 14px; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.2); border-radius: 8px; }

        .modal-submit {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.03em;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: all 0.2s ease;
          margin-top: 4px;
        }
        .modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-submit-bronze { background: #0ea5e9; color: #fff; }
        .modal-submit-bronze:hover:not(:disabled) { background: #0284c7; box-shadow: 0 4px 16px rgba(14,165,233,0.3); }
        .modal-submit-silver { background: #3b82f6; color: #fff; }
        .modal-submit-silver:hover:not(:disabled) { background: #2563eb; box-shadow: 0 4px 16px rgba(59,130,246,0.3); }
        .modal-submit-gold   { background: linear-gradient(135deg,#1d4ed8,#3b82f6); color: #fff; }
        .modal-submit-gold:hover:not(:disabled) { background: linear-gradient(135deg,#1e40af,#1d4ed8); box-shadow: 0 6px 24px rgba(29,78,216,0.3); }

        /* ── Success ────────────────────────────────────── */
        .modal-success { text-align: center; padding: 20px 0; }
        .success-icon {
          width: 56px; height: 56px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 20px;
        }
        .success-icon-bronze { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; }
        .success-icon-silver { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
        .success-icon-gold   { background: #eff6ff; color: #1e40af; border: 1px solid #60a5fa; }
        .modal-success h3 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 10px; }
        .modal-success p  { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 28px; }
        .modal-success strong { color: #1d4ed8; }

        /* ── Animations ─────────────────────────────────── */
        @keyframes fadeDown  { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp   { from { opacity:0; transform:translateY(32px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes pulse     { 0%,100% { opacity:0.6; transform:translateX(-50%) scale(1); } 50% { opacity:1; transform:translateX(-50%) scale(1.15); } }
        @keyframes shimmerBadge { 0% { transform:translateX(-100%); } 100% { transform:translateX(200%); } }

        /* ── Compare Table ───────────────────────────────────── */
        .compare-section {
          max-width: 1160px;
          margin: 56px auto 0;
          padding: 0 20px;
          overflow-x: auto;
        }
        .compare-lbl {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #94a3b8;
          text-align: center;
          margin-bottom: 20px;
        }
        .compare-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 16px;
          overflow: hidden;
        }
        .compare-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 600px;
        }
        .compare-caption {
          font-size: 0;
          position: absolute;
          overflow: hidden;
          clip: rect(0 0 0 0);
          height: 1px;
          width: 1px;
          margin: -1px;
          padding: 0;
          border: 0;
        }
        .compare-th {
          padding: 14px 16px;
          text-align: center;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-bottom: 1px solid #dbeafe;
          vertical-align: bottom;
          line-height: 1.4;
          background: #f0f6ff;
        }
        .compare-th-feature {
          text-align: left;
          color: #64748b;
          width: 44%;
        }
        .compare-th-tier {
          width: 18%;
          color: #94a3b8;
        }
        .compare-th-bronze { color: #0284c7; }
        .compare-th-silver { color: #2563eb; }
        .compare-th-gold   { color: #1e40af; }

        .compare-price {
          display: block;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.03em;
          margin-top: 4px;
          text-transform: none;
        }

        .compare-td {
          padding: 11px 16px;
          border-bottom: 1px solid #f0f6ff;
          vertical-align: middle;
        }
        .compare-td-feature {
          color: #475569;
          text-align: left;
          font-size: 12.5px;
        }
        .compare-td-price-row .compare-td-feature {
          color: #0f172a;
          font-weight: 700;
        }
        .compare-row-alt td {
          background: #f8fbff;
        }
        .compare-td-check,
        .compare-td-label,
        .compare-td-none,
        .compare-td-price {
          text-align: center;
          font-weight: 700;
        }
        .compare-td-none { color: #cbd5e1; font-size: 15px; }

        .compare-td-check.compare-td-bronze { color: #0ea5e9; }
        .compare-td-check.compare-td-silver { color: #3b82f6; }
        .compare-td-check.compare-td-gold   { color: #1d4ed8; }

        .compare-td-label.compare-td-bronze { color: #0284c7; font-size: 11.5px; }
        .compare-td-label.compare-td-silver { color: #1d4ed8; font-size: 11.5px; }
        .compare-td-label.compare-td-gold   { color: #1e40af; font-size: 11.5px; }

        .compare-td-price {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }
        .compare-td-price.compare-td-bronze { color: #0ea5e9; }
        .compare-td-price.compare-td-silver { color: #2563eb; }
        .compare-td-price.compare-td-gold   { color: #1d4ed8; }
      `}</style>
    </main>
  );
}
