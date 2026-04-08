"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { siteData } from "@/data/siteData";

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
    name: "Essential Watch",
    tagline: "Mail, packages & peace of mind while you're away.",
    price: 199,
    priceNote: "1 on-call service included · month-to-month",
    badge: "Bronze",
    cta: "Get Started",
    sections: [
      {
        label: "What's Included",
        items: [
          { text: "<strong>Weekly mail pickup</strong> & package collection" },
          { text: "<strong>Trash out & in</strong> every visit while you're gone" },
          {
            text: "<strong>Exterior property walk</strong> — anything unusual flagged immediately",
          },
          { text: "<strong>1 on-call service/mo</strong> included", tag: "Included" },
          { text: "<strong>Secure key holding</strong> & access management" },
          { text: "<strong>Issue alerts</strong> — you hear about it immediately" },
        ],
      },
    ],
  },
  {
    tier: "silver",
    name: "Home Watch",
    tagline: "Full weekly inspections, photo reports & 2 on-calls monthly.",
    price: 299,
    priceNote: "2 on-call services included · month-to-month",
    badge: "Silver",
    cta: "Get Started",
    sections: [
      {
        label: "What's Included",
        items: [
          { text: "<strong>Everything in Essential Watch</strong>, plus:" },
          { text: "<strong>Full interior & exterior inspection</strong> every week" },
          { text: "<strong>Photo report</strong> sent after every visit (4–6 photos)" },
          { text: "<strong>Storm & weather monitoring</strong> with prep visits" },
          { text: "<strong>2 on-call services/mo</strong> included", tag: "Included" },
          { text: "<strong>Contractor coordination</strong> — meet & greet any trade" },
          { text: "<strong>Plant & exterior upkeep</strong> monitoring" },
        ],
      },
    ],
  },
  {
    tier: "gold",
    name: "Coastal Elite",
    tagline: "Full home operations, priority access & arrival-ready service 2×/year.",
    price: 699,
    priceNote: "Founding rate — locks when spots fill. Limited to 8–10 members.",
    badge: "Gold — Elite",
    cta: "Claim a Founding Spot",
    sections: [
      {
        label: "Inspections & Visits",
        items: [
          { text: "<strong>Everything in Home Watch</strong>, plus:" },
          {
            text: "<strong>Extra unscheduled checks</strong> as needed — no charge, no questions",
          },
          {
            text: "<strong>Quarterly Property Condition Report</strong> — written, all systems",
          },
        ],
      },
      {
        label: "HVAC & Protection",
        items: [
          {
            text: "<strong>All HVAC filter changes</strong> — every unit, every time",
            tag: "Free",
          },
          {
            text: "<strong>Freeze protection protocol</strong> — pipe checks, monitoring & prep when temps drop",
          },
        ],
      },
      {
        label: "Priority & On-Call",
        items: [
          {
            text: "<strong>3 on-call services/mo</strong> — up to 3 hrs, no charge",
            tag: "Free",
          },
          { text: "<strong>24/7 emergency reach</strong> — Ryder's direct line" },
          {
            text: "<strong>Contractor liaison</strong> — your local point of contact for every trade",
          },
        ],
      },
      {
        label: "Arrival Ready — 2×/Year",
        items: [
          {
            text: "<strong>A/C pre-set</strong> to your preference 24 hrs before you arrive",
          },
          { text: "<strong>Fridge stocked</strong> with your basics — walk in, feel at home" },
          {
            text: "<strong>Full pre-arrival walk-through</strong> — home ready, nothing to worry about",
          },
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
            <strong>Founding rate — locks when spots fill.</strong> Limited to 8–10 members.
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
      {/* Nav */}
      <nav className="pricing-nav">
        <Link href="/" className="nav-logo-link">
          <img src="/logo.png" alt="CHM" className="nav-logo" />
          <span className="nav-brand">{siteData.businessName}</span>
        </Link>
        <div className="nav-links">
          <Link href="/#services" className="nav-link">Services</Link>
          <Link href="/pricing" className="nav-link nav-link-active">Pricing</Link>
          <Link href="/#contact" className="nav-link">Contact</Link>
        </div>
      </nav>

      {/* Header */}
      <header className="pricing-header">
        <img src="/logo.png" alt="CHM" className="header-logo" />
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
          background: #000;
          color: #f2f2f2;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* ── Nav ───────────────────────────────────────── */
        .pricing-nav {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 50;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #141414;
          padding: 10px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-logo-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .nav-logo {
          height: 36px;
          width: auto;
        }
        .nav-brand {
          font-family: ui-serif, Georgia, serif;
          font-size: 14px;
          color: #f2f2f2;
          display: none;
        }
        @media (min-width: 640px) {
          .nav-brand { display: inline; }
        }
        .nav-links {
          display: flex;
          gap: 24px;
        }
        .nav-link {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #666;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #f2f2f2; }
        .nav-link-active { color: #c0a060; }

        /* ── Header ─────────────────────────────────────── */
        .pricing-header {
          text-align: center;
          padding: 120px 24px 56px;
          animation: fadeDown 0.7s ease both;
        }
        .header-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .header-h1 {
          font-size: clamp(28px, 5vw, 46px);
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #fff;
          margin: 0 0 12px;
        }
        .header-accent { color: #c0a060; }
        .header-sub {
          font-size: 15px;
          color: #666;
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
          background: #0a0a0a;
          border-radius: 20px;
          padding: 36px 28px 40px;
          position: relative;
          overflow: hidden;
          border: 1px solid #1a1a1a;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          animation: fadeUp 0.7s ease both;
        }
        .card:nth-child(1) { animation-delay: 0.15s; }
        .card:nth-child(2) { animation-delay: 0.28s; }
        .card:nth-child(3) { animation-delay: 0.42s; }
        .card:hover { transform: translateY(-6px); }

        /* metallic top edge */
        .card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }
        /* shimmer sweep */
        .card::after {
          content: "";
          position: absolute;
          top: 0; left: -120%;
          width: 60%; height: 100%;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%);
          transition: left 0.55s ease;
          pointer-events: none;
        }
        .card:hover::after { left: 160%; }

        /* Bronze */
        .card-bronze { border-color: #7a4a18; }
        .card-bronze::before { background: linear-gradient(90deg, transparent, #cd7f32, transparent); }
        .card-bronze:hover { box-shadow: 0 20px 60px rgba(205,127,50,0.18), 0 0 0 1px #7a4a18; }

        /* Silver */
        .card-silver { border-color: #2a2a2a; }
        .card-silver::before { background: linear-gradient(90deg, transparent, #c0c0c0, transparent); }
        .card-silver:hover { box-shadow: 0 20px 60px rgba(192,192,192,0.12), 0 0 0 1px #444; }

        /* Gold */
        .card-gold { background: linear-gradient(160deg, #0d0b00 0%, #0a0a0a 100%); border-color: #7a6010; }
        .card-gold::before { background: linear-gradient(90deg, transparent, #d4af37, transparent); }
        .card-gold:hover { box-shadow: 0 24px 80px rgba(212,175,55,0.22), 0 0 0 1px #7a6010; }

        /* Gold pulse */
        .gold-pulse {
          position: absolute;
          top: -40%; left: 50%;
          transform: translateX(-50%);
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%);
          animation: pulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        /* Hot tag */
        .hot-tag {
          position: absolute;
          top: -1px; right: 28px;
          background: linear-gradient(135deg, #d4af37, #ffe066);
          color: #000;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 5px 14px 4px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 4px 12px rgba(212,175,55,0.4);
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
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
          animation: shimmerBadge 2.5s ease-in-out infinite;
        }
        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }
        .badge-bronze { background: linear-gradient(135deg,#3a1e08,#5a3015); border: 1px solid #7a4a18; color: #e8a96a; }
        .badge-silver { background: linear-gradient(135deg,#1a1a1a,#2a2a2a); border: 1px solid #3a3a3a; color: #f0f0f0; }
        .badge-gold   { background: linear-gradient(135deg,#2a1e00,#3d2e00); border: 1px solid #7a6010; color: #ffe066; }

        /* ── Plan text ──────────────────────────────────── */
        .plan-name { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #fff; margin-bottom: 5px; }
        .plan-sub  { font-size: 13px; color: #777; margin-bottom: 26px; line-height: 1.55; }

        /* ── Price ──────────────────────────────────────── */
        .price-row { display: flex; align-items: flex-end; gap: 4px; margin-bottom: 4px; }
        .price-sym { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .price-num { font-size: 56px; font-weight: 900; letter-spacing: -0.05em; line-height: 1; }
        .price-period { font-size: 13px; color: #666; margin-bottom: 8px; }
        .price-note { font-size: 11.5px; color: #333; margin-bottom: 30px; min-height: 18px; }
        .price-note-gold strong { color: #d4af37; }

        .card-bronze .price-num,.card-bronze .price-sym { background: linear-gradient(135deg,#e8a96a,#cd7f32); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .card-silver .price-num,.card-silver .price-sym { background: linear-gradient(135deg,#f0f0f0,#c0c0c0); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .card-gold   .price-num,.card-gold   .price-sym { background: linear-gradient(135deg,#ffe066,#d4af37); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        /* ── Divider ────────────────────────────────────── */
        .divider { height: 1px; margin-bottom: 22px; }
        .divider-bronze { background: linear-gradient(90deg,transparent,#7a4a18,transparent); }
        .divider-silver { background: linear-gradient(90deg,transparent,#2a2a2a,transparent); }
        .divider-gold   { background: linear-gradient(90deg,transparent,#7a6010,transparent); }

        /* ── Section label ──────────────────────────────── */
        .section-lbl { font-size: 9.5px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 12px; }
        .card-bronze .section-lbl { color: #7a4a18; }
        .card-silver .section-lbl { color: #555; }
        .card-gold   .section-lbl { color: #7a6010; }

        /* ── Features ───────────────────────────────────── */
        .features { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 11px; margin-bottom: 22px; }
        .fi { display: flex; align-items: flex-start; gap: 11px; font-size: 13.5px; color: #888; line-height: 1.5; }
        .fi strong { color: #ddd; font-weight: 600; }

        .fi-check {
          flex-shrink: 0;
          width: 18px; height: 18px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px;
        }
        .fi-check svg { width: 9px; height: 9px; }

        .fi-check-bronze { background: rgba(205,127,50,0.1); border: 1px solid #7a4a18; color: #cd7f32; }
        .fi-check-silver { background: rgba(192,192,192,0.07); border: 1px solid #2a2a2a; color: #c0c0c0; }
        .fi-check-gold   { background: rgba(212,175,55,0.1);  border: 1px solid #7a6010; color: #d4af37; }

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
        .tag-bronze { background: rgba(205,127,50,0.12); color: #e8a96a; border: 1px solid #7a4a18; }
        .tag-silver { background: rgba(192,192,192,0.07); color: #c0c0c0; border: 1px solid #2a2a2a; }
        .tag-gold   { background: rgba(212,175,55,0.12);  color: #ffe066; border: 1px solid #7a6010; }

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
        .cta-bronze { background: transparent; border: 1px solid #7a4a18; color: #e8a96a; }
        .cta-bronze:hover { background: rgba(205,127,50,0.08); border-color: #cd7f32; box-shadow: 0 0 20px rgba(205,127,50,0.18); }
        .cta-silver { background: transparent; border: 1px solid #2a2a2a; color: #f0f0f0; }
        .cta-silver:hover { background: rgba(192,192,192,0.06); border-color: #555; box-shadow: 0 0 20px rgba(192,192,192,0.12); }
        .cta-gold   { background: linear-gradient(135deg,#d4af37,#ffe066); color: #000; }
        .cta-gold:hover { background: linear-gradient(135deg,#ffe066,#fff0a0); transform: translateY(-2px); box-shadow: 0 10px 32px rgba(212,175,55,0.45); }

        /* ── Add-ons ─────────────────────────────────────── */
        .addons-section { max-width: 1160px; margin: 64px auto 0; padding: 0 20px; }
        .addons-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #333; text-align: center; margin-bottom: 18px; }
        .addons-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        @media (max-width: 700px) { .addons-grid { grid-template-columns: repeat(2,1fr); } }
        .addon { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 18px 20px; transition: border-color 0.2s; }
        .addon:hover { border-color: #2a2a2a; }
        .addon-name  { font-size: 13px; font-weight: 700; color: #ccc; margin-bottom: 4px; }
        .addon-desc  { font-size: 12px; color: #555; line-height: 1.5; }
        .addon-price { font-size: 15px; font-weight: 800; margin-top: 10px; color: #c0c0c0; }

        /* ── Footer note ─────────────────────────────────── */
        .footer-note { text-align: center; font-size: 12px; color: #333; margin-top: 56px; line-height: 1.8; padding: 0 16px; }
        .footer-note a { color: #555; text-decoration: none; }
        .footer-note a:hover { color: #c0c0c0; }

        /* ── Modal ───────────────────────────────────────── */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease both;
        }
        .modal-card {
          background: #0d0d0d;
          border-radius: 20px;
          padding: 40px 36px;
          max-width: 500px;
          width: 100%;
          position: relative;
          border: 1px solid #1a1a1a;
          animation: slideUp 0.3s cubic-bezier(0.18,0.82,0.16,1) both;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-card-bronze { border-color: #7a4a18; box-shadow: 0 0 60px rgba(205,127,50,0.12); }
        .modal-card-silver { border-color: #2a2a2a; box-shadow: 0 0 60px rgba(192,192,192,0.06); }
        .modal-card-gold   { border-color: #7a6010; box-shadow: 0 0 80px rgba(212,175,55,0.15); }

        .modal-close {
          position: absolute;
          top: 16px; right: 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #444;
          padding: 6px;
          display: flex;
          transition: color 0.15s;
        }
        .modal-close svg { width: 14px; height: 14px; }
        .modal-close:hover { color: #888; }

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
        .modal-plan-badge-bronze { background: rgba(205,127,50,0.1); border: 1px solid #7a4a18; color: #e8a96a; }
        .modal-plan-badge-silver { background: rgba(192,192,192,0.06); border: 1px solid #2a2a2a; color: #c0c0c0; }
        .modal-plan-badge-gold   { background: rgba(212,175,55,0.1);  border: 1px solid #7a6010; color: #ffe066; }

        .modal-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #fff; margin: 0 0 6px; }
        .modal-sub   { font-size: 13px; color: #666; margin: 0 0 28px; line-height: 1.5; }

        /* ── Form ───────────────────────────────────────── */
        .modal-form { display: flex; flex-direction: column; gap: 18px; }
        .form-row { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #555; }
        .req { color: #c04040; margin-left: 2px; }
        .opt { color: #333; font-weight: 400; text-transform: none; letter-spacing: 0; }

        .form-input {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          padding: 11px 14px;
          font-size: 14px;
          color: #f2f2f2;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .form-input::placeholder { color: #333; }
        .form-textarea { resize: vertical; min-height: 80px; }

        .form-input-bronze:focus { border-color: #7a4a18; box-shadow: 0 0 0 2px rgba(205,127,50,0.1); }
        .form-input-silver:focus { border-color: #333;    box-shadow: 0 0 0 2px rgba(192,192,192,0.06); }
        .form-input-gold:focus   { border-color: #7a6010; box-shadow: 0 0 0 2px rgba(212,175,55,0.1); }

        .form-error { font-size: 13px; color: #c04040; padding: 10px 14px; background: rgba(192,64,64,0.08); border: 1px solid rgba(192,64,64,0.2); border-radius: 8px; }

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
        .modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .modal-submit-bronze { background: rgba(205,127,50,0.12); border: 1px solid #7a4a18; color: #e8a96a; }
        .modal-submit-bronze:hover:not(:disabled) { background: rgba(205,127,50,0.2); }
        .modal-submit-silver { background: rgba(192,192,192,0.08); border: 1px solid #333; color: #f0f0f0; }
        .modal-submit-silver:hover:not(:disabled) { background: rgba(192,192,192,0.14); }
        .modal-submit-gold   { background: linear-gradient(135deg,#d4af37,#ffe066); color: #000; }
        .modal-submit-gold:hover:not(:disabled) { background: linear-gradient(135deg,#ffe066,#fff0a0); box-shadow: 0 6px 24px rgba(212,175,55,0.35); }

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
        .success-icon-bronze { background: rgba(205,127,50,0.12); color: #e8a96a; border: 1px solid #7a4a18; }
        .success-icon-silver { background: rgba(192,192,192,0.08); color: #c0c0c0; border: 1px solid #2a2a2a; }
        .success-icon-gold   { background: rgba(212,175,55,0.12);  color: #ffe066; border: 1px solid #7a6010; }
        .modal-success h3 { font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 10px; }
        .modal-success p  { font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 28px; }
        .modal-success strong { color: #c0a060; }

        /* ── Animations ─────────────────────────────────── */
        @keyframes fadeDown  { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp   { from { opacity:0; transform:translateY(32px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes pulse     { 0%,100% { opacity:0.6; transform:translateX(-50%) scale(1); } 50% { opacity:1; transform:translateX(-50%) scale(1.15); } }
        @keyframes shimmerBadge { 0% { transform:translateX(-100%); } 100% { transform:translateX(200%); } }
      `}</style>
    </main>
  );
}
