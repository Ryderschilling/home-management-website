import type { Metadata } from "next";
import Link from "next/link";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import StormCheckForm from "@/components/StormCheckForm";
import { primaryPhone, primaryPhoneDisplay, trustStats } from "@/data/siteData";

// Storm Check, added 9/11/26. Pricing set by Ryder that day: $100 per storm for
// owners not on a plan, $50 per storm for plan clients. Copy rules that apply here:
// no repair work after storms (photos, then a licensed contractor), never call a
// visit an inspection, and no insurance claims beyond what src/data/protection.ts
// allows. This page mentions claims, so it renders <LegalDisclaimer />.

const PAGE_URL = "https://coastalhomemngt30a.com/storm-check";
const SITE = "https://coastalhomemngt30a.com";

export const metadata: Metadata = {
  title: "Storm Check for 30A Second Homes",
  description:
    "Out of town when a storm heads for 30A? Storm prep before landfall and a photo check after, $100 per storm or $50 on a plan. Watersound Origins, Alys, Rosemary and scenic 30A.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Storm Check for 30A Second Homes",
    description:
      "Storm prep before landfall and photos of your home after it passes. You do not need to be in town.",
    url: PAGE_URL,
    images: ["/img.png"],
  },
};

const BEFORE = [
  "Bring in or tie down patio furniture, grills, planters and anything the wind can move",
  "Close storm shutters if the home has them",
  "Confirm doors, windows and the garage are shut and latched",
  "Photograph the outside of the home, so you have a dated before picture",
];

const AFTER = [
  "Walk the home inside and out once roads are open and it is safe to go",
  "Photograph every side of the house, the roof line from the ground, and any water inside",
  "Email you the photos with a short written note on what was found",
  "If something needs fixing, point you to a licensed contractor. We do not do repairs",
];

const FAQ = [
  {
    q: "What does Storm Check cost?",
    a: "$100 per storm for homeowners who are not on a Coastal Home Management 30A plan, and $50 per storm for plan clients. Nothing is charged to sign up.",
  },
  {
    q: "Do I need to be in town?",
    a: "No. Storm Check is built for owners who are somewhere else when a storm is coming. Everything is confirmed by text or email and the photos come to your inbox.",
  },
  {
    q: "When do you go out?",
    a: "When a named storm is headed for 30A, Ryder confirms with each owner on the list by text or email before the prep visit. The photo check happens after the storm passes, once roads are open and it is safe to be out.",
  },
  {
    q: "Will you fix storm damage?",
    a: "No. Storm Check is prep before and photos after. If something is damaged, you get the photos and the name of a licensed contractor, and you decide what happens next.",
  },
  {
    q: "Can the photos help with an insurance claim?",
    a: "They give you a dated record of what the home looked like before and after the storm, which you can share with your agent or adjuster. We are not insurance agents or adjusters and cannot tell you what your policy covers.",
  },
  {
    q: "Which areas does Storm Check cover?",
    a: "Watersound Origins, Alys Beach, Rosemary Beach, Inlet Beach, Naturewalk, Seacrest and the rest of scenic 30A, the same area as our home watch plans.",
  },
];

export default function StormCheckPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Storm preparation and post-storm photo check",
    name: "Storm Check",
    url: PAGE_URL,
    description:
      "Storm prep before landfall and a photo check of the home after the storm passes, for second-home owners on Scenic 30A who are out of town.",
    provider: {
      "@type": "LocalBusiness",
      "@id": "https://coastalhomemngt30a.com/#business",
      name: "Coastal Home Management 30A",
      url: SITE,
      hasMap: "https://www.google.com/maps?cid=1620304355006096316",
    },
    areaServed: ["Watersound Origins", "Alys Beach", "Rosemary Beach", "Inlet Beach", "Naturewalk", "Seacrest Beach", "Scenic 30A"],
    offers: [
      { "@type": "Offer", name: "Storm Check, not on a plan", price: "100", priceCurrency: "USD" },
      { "@type": "Offer", name: "Storm Check, plan clients", price: "50", priceCurrency: "USD" },
    ],
  };

  return (
    <main className="bg-[var(--ch-paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="fade-section bg-[var(--ch-paper)] px-4 pt-28 pb-16 md:px-8 md:pt-36 md:pb-20">
        <div className="mx-auto max-w-[1240px]">
          <p className="ch-eyebrow reveal-item">Storm Check · 2026 season</p>
          <h1 className="ch-display mb-8 max-w-[18ch]">
            <span className="ch-mask"><span>A storm is coming.</span></span>
            <span className="ch-mask"><span>You are not in town.</span></span>
          </h1>
          <span className="ch-draw mb-9 block h-px w-24 bg-[var(--ch-teal)]" />
          <p className="ch-label reveal-item mb-6 !text-[var(--ch-soft)]">
            Insured Florida LLC · Watersound Origins · Alys · Rosemary · Scenic 30A
          </p>
          <p className="ch-lede reveal-item max-w-[60ch]">
            Put your home on the Storm Check list once. Before a named storm reaches 30A, Ryder
            preps the outside of your house. After it passes, you get photos of the home by email.
            $100 per storm, or $50 if you are on a plan.
          </p>
          <div className="reveal-item mt-10 flex flex-wrap items-center gap-4">
            <a href="#sign-up" className="ch-btn ch-btn--solid">Add My Home</a>
            <a href={`tel:${primaryPhone()}`} className="ch-btn">{primaryPhoneDisplay()}</a>
          </div>
        </div>
      </section>

      {/* ── Before and after ─────────────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-[1240px] gap-12 md:grid-cols-2">
          <div>
            <p className="ch-label mb-4">Before landfall</p>
            <h2 className="ch-display ch-display--sm mb-8">Storm prep</h2>
            <ul className="space-y-0">
              {BEFORE.map((t) => (
                <li key={t} className="border-t border-[var(--ch-hairline)] py-4 text-[15px] leading-[1.7] text-[var(--ch-muted)]">{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="ch-label mb-4">After it passes</p>
            <h2 className="ch-display ch-display--sm mb-8">Photo check</h2>
            <ul className="space-y-0">
              {AFTER.map((t) => (
                <li key={t} className="border-t border-[var(--ch-hairline)] py-4 text-[15px] leading-[1.7] text-[var(--ch-muted)]">{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Price ────────────────────────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-10 md:grid-cols-3">
          <div>
            <p className="ch-label mb-3">Not on a plan</p>
            <p className="text-[46px] leading-none tracking-[-0.03em] text-[var(--ch-ink)]" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 112, 'wght' 620" }}>$100</p>
            <p className="mt-3 text-[14px] text-[var(--ch-muted)]">per storm, prep and photo check</p>
          </div>
          <div>
            <p className="ch-label mb-3">On a plan</p>
            <p className="text-[46px] leading-none tracking-[-0.03em] text-[var(--ch-ink)]" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 112, 'wght' 620" }}>$50</p>
            <p className="mt-3 text-[14px] text-[var(--ch-muted)]">
              per storm for Essential, Home Watch and Coastal Elite clients.{" "}
              <Link href="/pricing" className="underline underline-offset-4">See the plans</Link>
            </p>
          </div>
          <div>
            <p className="ch-label mb-3">To sign up</p>
            <p className="text-[46px] leading-none tracking-[-0.03em] text-[var(--ch-ink)]" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 112, 'wght' 620" }}>$0</p>
            <p className="mt-3 text-[14px] text-[var(--ch-muted)]">
              {trustStats.ratingValue} on Google across {trustStats.reviewCount} reviews
            </p>
          </div>
        </div>
      </section>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <section id="sign-up" className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-[1240px] gap-12 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="ch-eyebrow reveal-item">Sign up once</p>
            <h2 className="ch-display ch-display--sm mb-6">Put your home on the list.</h2>
            <p className="ch-lede max-w-[46ch]">
              Two minutes now means nobody is scrambling for a gate code when the cone turns
              toward the Panhandle. Not on a plan yet? The first home check is free, and the photo
              report is yours to keep. <Link href="/pricing" className="underline underline-offset-4">Plans start at $200 a month.</Link>
            </p>
          </div>
          <StormCheckForm />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[860px]">
          <p className="ch-eyebrow reveal-item">Questions</p>
          <h2 className="ch-display ch-display--sm mb-10">Storm Check, plainly.</h2>
          <div>
            {FAQ.map(({ q, a }) => (
              <div key={q} className="border-t border-[var(--ch-hairline)] py-7">
                <h3 className="mb-3 text-[17px] leading-[1.4] text-[var(--ch-ink)]">{q}</h3>
                <p className="text-[14.5px] leading-[1.75] text-[var(--ch-muted)]">{a}</p>
              </div>
            ))}
          </div>
          <LegalDisclaimer variant="inline" />
        </div>
      </section>
    </main>
  );
}
