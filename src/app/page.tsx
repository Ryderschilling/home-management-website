import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { siteData } from "@/data/siteData";
import TestimonialsSection from "@/components/TestimonialsSection";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import FadeInObserver from "@/components/FadeInObserver";
import ServiceAreaMapWrapper from "@/components/ServiceAreaMapWrapper";

export const metadata: Metadata = {
  description:
    "Second home management and property care in Watersound Origins & Inlet Beach, 30A. Weekly check-ins, photo reports, and peace of mind. Request a walkthrough.",
};

export default function HomePage() {

  return (
    <main className="min-h-screen font-sans bg-black text-black">
      <FadeInObserver />
      <LeadCapturePopup />
      {/* Hero */}
      <section className="hero relative h-screen overflow-hidden text-white">
        {/* Background image — Next.js Image for automatic WebP + responsive sizing */}
        <Image
          src="/img.png"
          alt="Coastal Home Management 30A — pool maintenance and home care services in Watersound Origins, Florida"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="hero-bg object-cover object-top"
        />

        {/* Cinematic overlay (delayed dim + vignette) */}
        <div className="hero-overlay absolute inset-0" />

        {/* Hero content */}
        <div className="hero-content relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <h1 className="hero-title">COASTAL HOME MANAGEMENT 30A</h1>

          <div className="hero-divider" aria-hidden="true" />

          <p className="hero-sub">INLET BEACH, 30A FLORIDA</p>

          <a href="#contact" className="hero-cta">
            Contact
          </a>
        </div>

        {/* Bottom row */}
        <div className="hero-bottom relative z-10">
        <div className="hero-bottom-inner">
  <span>WATERSOUND ORIGINS</span>
  <span className="pipe">|</span>
  <span>NATUREWALK</span>
  <span className="pipe">|</span>
  <span>INLET BEACH</span>
  <span className="pipe">|</span>
  <span>INSURED</span>
</div>
        </div>

        {/* Scroll cue (bottom-center, subtle, looping) */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          aria-hidden="true"
        >
          <div className="scroll-cue">
            <span className="scroll-cue-line" />
          </div>
        </div>
      </section>

      {/* Testimonials (below hero, above services) */}
      <div className="fade-section">
        <TestimonialsSection />
      </div>

      {/* Trust signal bar — stats for humans and LLM crawlers */}
      <div className="bg-black border-t border-white/10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-6 md:gap-10 flex-wrap">

          {/* Stat 1 — portfolio */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-xl md:text-2xl font-serif tracking-tight">$8M+</span>
            <span className="text-white/40 text-[10px] uppercase tracking-widest">in properties managed</span>
          </div>

          <span className="text-white/10 text-lg hidden md:inline">|</span>

          {/* Stat 2 — active homes */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-xl md:text-2xl font-serif tracking-tight">9</span>
            <span className="text-white/40 text-[10px] uppercase tracking-widest">active client homes</span>
          </div>

          <span className="text-white/10 text-lg hidden md:inline">|</span>

          {/* Stat 3 — Google rating */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-yellow-400 text-lg tracking-wide" aria-label="5 stars">★★★★★</span>
            <a
              href="https://www.google.com/search?q=Coastal+Home+Management+30A"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 text-[10px] uppercase tracking-widest hover:text-white transition"
            >
              5.0 on Google →
            </a>
          </div>

        </div>
      </div>

      {/* Review structured data — for Google and LLM crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://coastalhomemngt30a.com/#business",
            name: "Coastal Home Management 30A",
            description: "Coastal Home Management 30A provides second home management and property care for second-home owners in Watersound Origins, Naturewalk, and Inlet Beach along scenic 30A in Florida. Actively manages more than $8 million in second home real estate across 9 active client properties. Services include weekly inspections, photo documentation, mail handling, arrival prep, contractor coordination, and on-call concierge tasks. Rated 5.0 on Google. Founded 2025, fully insured Florida LLC.",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "5.0",
              bestRating: "5",
              reviewCount: "5",
            },
            review: [
              {
                "@type": "Review",
                datePublished: "2025-12-01",
                author: { "@type": "Person", name: "Beth Tedesco" },
                reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
                reviewBody: "Excellent service and communication! Very helpful and Ryder goes out of his way to help.",
              },
              {
                "@type": "Review",
                datePublished: "2025-11-01",
                author: { "@type": "Person", name: "Barbara Reed" },
                reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
                reviewBody: "Ryder gives us peace of mind if we're out of town and need the house checked on. Very reliable. Would highly recommend using his services!",
              },
            ],
          }),
        }}
      />

{/* Meet Ryder — personal intro strip */}
<section className="bg-white border-t border-gray-100 px-4 md:px-6 py-14 md:py-20 fade-section">
  <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
    <div className="flex-shrink-0">
      <img
        src="/profile-web.jpg"
        alt="Ryder Schilling, founder of Coastal Home Management 30A"
        className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-md"
        loading="lazy"
        decoding="async"
      />
    </div>
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Who You&apos;re Hiring</p>
      <h2 className="text-2xl md:text-3xl font-serif mb-4 leading-snug">
        I live in Watersound Origins.<br className="hidden md:block" /> This is my neighborhood too.
      </h2>
      <p className="text-gray-600 text-sm leading-relaxed max-w-xl">
        I&apos;m Ryder Schilling. I started CHM because my neighbors needed someone they could actually trust — not a company, a person. I&apos;m here full-time, I know the streets, I know this community, and I&apos;m the one who shows up to your house. Today I actively manage more than $8 million in second home real estate across Watersound Origins, Naturewalk, and Inlet Beach. Every single visit, every single time.
      </p>
      <Link href="/about" className="mt-6 inline-flex text-xs uppercase tracking-widest border-b border-gray-300 pb-0.5 hover:border-black transition">
        More about Ryder →
      </Link>
    </div>
  </div>
</section>

{/* Services */}
<section
  id="services"
  className="bg-white px-4 md:px-6 py-20 md:py-28 fade-section"
>
  <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-serif mb-8">
      What Services Do We Offer for Second Homeowners on 30A?
    </h2>

    {/* MOBILE: full-size swipe cards */}
{/* MOBILE: full-size swipe cards */}
<div className="md:hidden -mx-4 px-4">
  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar">
    {/* Card 1 */}
    <div className="snap-center shrink-0 w-[92vw] border border-gray-200 bg-white p-6 flex flex-col">
      <div className="h-64 w-full mb-5 overflow-hidden">
        <img
          src="/img.png"
          alt="Second Home Management"
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="text-2xl font-serif mb-2">Second Home Management</h3>
      <p className="text-base text-gray-700 mb-6">
        Comprehensive oversight while you’re away. Weekly or bi-weekly check-ins,
        full property inspections, issue coordination, and proactive care to keep
        your home in top condition.
      </p>
      <div className="mt-auto pt-2">
  <a
    href={`mailto:${siteData.contactEmail}`}
    className="inline-flex border border-black px-5 py-3 text-xs uppercase tracking-wide hover:bg-black hover:text-white transition"
  >
    Learn more
  </a>
</div>
    </div>

    {/* Card 2 */}
    <div className="snap-center shrink-0 w-[92vw] border border-gray-200 bg-white p-6 flex flex-col">
      <div className="h-64 w-full mb-5 overflow-hidden">
        <img
          src="/service2.png"
          alt="Mail & Package Handling"
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="text-2xl font-serif mb-2">Mail &amp; Package Handling</h3>
      <p className="text-base text-gray-700 mb-6">
        Receive and manage all mail and deliveries while you’re away. Packages
        are collected, secured, and handled according to your preferences so
        nothing is missed.
      </p>
      <div className="mt-auto pt-2">
  <a
    href={`mailto:${siteData.contactEmail}`}
    className="inline-flex border border-black px-5 py-3 text-xs uppercase tracking-wide hover:bg-black hover:text-white transition"
  >
    Learn more
  </a>
</div>
    </div>

    {/* Card 3 */}
    <div className="snap-center shrink-0 w-[92vw] border border-gray-200 bg-white p-6 flex flex-col">
      <div className="h-64 w-full mb-5 overflow-hidden">
        <img
          src="/service3.png"
          alt="Concierge Services"
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="text-2xl font-serif mb-2">Concierge Services</h3>
      <p className="text-base text-gray-700 mb-6">
        Anything you may need as a homeowner. From one-off requests to ongoing
        assistance, we handle the details so you don’t have to.
      </p>
      <div className="mt-auto pt-2">
  <a
    href={`mailto:${siteData.contactEmail}`}
    className="inline-flex border border-black px-5 py-3 text-xs uppercase tracking-wide hover:bg-black hover:text-white transition"
  >
    Learn more
  </a>
</div>
    </div>
  </div>

  {/* Mobile swipe cue */}
  <div className="mt-2 flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-gray-500">
    <span>Swipe</span>
    <span className="swipe-chevron">›</span>
  </div>
</div>

    {/* DESKTOP: 3-column grid */}
    <div className="hidden md:grid grid-cols-3 gap-12">
      {/* Card 1 */}
      <div className="relative group overflow-hidden border border-gray-200 p-6 flex flex-col h-full">
        <div className="h-60 w-full mb-4 overflow-hidden">
          <img
            src="/img.png"
            alt="Second Home Management"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <h3 className="text-xl font-serif mb-2">Second Home Management</h3>
        <p className="text-sm text-gray-700 mb-5">
          Comprehensive oversight while you’re away. Weekly or bi-weekly check-ins,
          full property inspections, issue coordination, and proactive care to keep
          your home in top condition.
        </p>
        <div className="mt-auto pt-2">
  <a
    href={`mailto:${siteData.contactEmail}`}
    className="inline-flex border border-black px-5 py-3 text-xs uppercase tracking-wide hover:bg-black hover:text-white transition"
  >
    Learn more
  </a>
</div>
      </div>

      {/* Card 2 */}
      <div className="relative group overflow-hidden border border-gray-200 p-6 flex flex-col h-full">
        <div className="h-60 w-full mb-4 overflow-hidden">
          <img
            src="/service2.png"
            alt="Mail & Package Handling"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <h3 className="text-xl font-serif mb-2">Mail &amp; Package Handling</h3>
        <p className="text-sm text-gray-700 mb-5">
          Receive and manage all mail and deliveries while you’re away. Packages
          are collected, secured, and handled according to your preferences so
          nothing is missed.
        </p>
        <div className="mt-auto pt-2">
  <a
    href={`mailto:${siteData.contactEmail}`}
    className="inline-flex border border-black px-5 py-3 text-xs uppercase tracking-wide hover:bg-black hover:text-white transition"
  >
    Learn more
  </a>
</div>
      </div>

      {/* Card 3 */}
      <div className="relative group overflow-hidden border border-gray-200 p-6 flex flex-col h-full">
        <div className="h-60 w-full mb-4 overflow-hidden">
          <img
            src="/service3.png"
            alt="Concierge Services"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <h3 className="text-xl font-serif mb-2">Concierge Services</h3>
        <p className="text-sm text-gray-700 mb-5">
          Anything you may need as a homeowner. From one-off requests to ongoing
          assistance, we handle the details so you don’t have to.
        </p>
        <div className="mt-auto pt-2">
  <a
    href={`mailto:${siteData.contactEmail}`}
    className="inline-flex border border-black px-5 py-3 text-xs uppercase tracking-wide hover:bg-black hover:text-white transition"
  >
    Learn more
  </a>
</div>
      </div>
    </div>
  </div>
</section>

      {/* ─── Item 4: How It Works Section + HowTo JSON-LD Schema ─────────── */}
      <section
        id="how-it-works"
        className="bg-white px-4 md:px-6 py-20 md:py-28 fade-section border-t border-gray-100"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">
            How Does Second Home Management Work on 30A?
          </h2>
          <p className="text-gray-500 text-sm mb-14 max-w-xl">
            Simple, transparent, and handled by one person who treats your property like it&apos;s their own.
          </p>

          <ol className="space-y-12" role="list">
            <li className="flex gap-8 items-start">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-sm font-serif text-gray-500"
                aria-hidden="true"
              >
                1
              </div>
              <div>
                <h3 className="text-xl font-serif mb-2">Reach Out and Tell Us About Your Property</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
                  Email or call Ryder directly. We&apos;ll talk through your property, your schedule, and what level of
                  care makes sense for you. There&apos;s no pressure and no sales call — just a real conversation.
                  Most clients are set up within a few days.
                </p>
              </div>
            </li>

            <li className="flex gap-8 items-start">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-sm font-serif text-gray-500"
                aria-hidden="true"
              >
                2
              </div>
              <div>
                <h3 className="text-xl font-serif mb-2">We Set Up Your Account and Collect Access Details</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
                  We document your property details, key access, emergency contacts, HVAC preferences, and any specific
                  concerns. Everything is logged so nothing gets missed. Ryder handles the setup personally — there&apos;s
                  no one else involved.
                </p>
              </div>
            </li>

            <li className="flex gap-8 items-start">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-sm font-serif text-gray-500"
                aria-hidden="true"
              >
                3
              </div>
              <div>
                <h3 className="text-xl font-serif mb-2">Regular Inspections Begin on Your Schedule</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
                  On a weekly or bi-weekly schedule, we walk your property inside and out. We check every system —
                  HVAC, plumbing, irrigation, entry points, exterior condition — and photograph everything.
                  Storm events trigger unscheduled visits at no extra charge on Elite plans.
                </p>
              </div>
            </li>

            <li className="flex gap-8 items-start">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-sm font-serif text-gray-500"
                aria-hidden="true"
              >
                4
              </div>
              <div>
                <h3 className="text-xl font-serif mb-2">You Receive a Report After Every Single Visit</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
                  After each visit you get a written summary with photos by text or email. If anything needs attention,
                  we handle it immediately or coordinate with the right contractor. You&apos;re always in the loop —
                  without having to be here.
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-14">
            <a
              href="mailto:coastalhomemanagement30a@gmail.com"
              className="inline-flex border border-black px-8 py-3 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>

      {/* HowTo JSON-LD Schema — page-specific, lives here not in layout */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How Second Home Management Works on 30A — Coastal Home Management",
            description:
              "A step-by-step guide to how Coastal Home Management 30A handles property care for second-home owners in Watersound Origins, Naturewalk, and Inlet Beach, Florida.",
            image: {
              "@type": "ImageObject",
              url: "https://coastalhomemngt30a.com/img.png",
              width: 1200,
              height: 630,
            },
            totalTime: "P3D",
            supply: [],
            tool: [],
            step: [
              {
                "@type": "HowToStep",
                position: 1,
                name: "Reach Out and Tell Us About Your Property",
                text: "Email or call Ryder directly. We discuss your property, your schedule, and what level of care makes sense. No sales call — just a real conversation. Most clients are set up within a few days.",
                url: "https://coastalhomemngt30a.com/#how-it-works",
              },
              {
                "@type": "HowToStep",
                position: 2,
                name: "We Set Up Your Account and Collect Access Details",
                text: "We document your property details, key access, emergency contacts, HVAC preferences, and specific concerns. Everything is logged so nothing gets missed. Ryder handles setup personally.",
                url: "https://coastalhomemngt30a.com/#how-it-works",
              },
              {
                "@type": "HowToStep",
                position: 3,
                name: "Regular Inspections Begin on Your Schedule",
                text: "On a weekly or bi-weekly schedule, we walk your property inside and out — checking every system including HVAC, plumbing, irrigation, entry points, and exterior condition — and photograph everything. Storm events trigger unscheduled visits at no extra charge on Elite plans.",
                url: "https://coastalhomemngt30a.com/#how-it-works",
              },
              {
                "@type": "HowToStep",
                position: 4,
                name: "You Receive a Report After Every Single Visit",
                text: "After each visit you receive a written summary with photos by text or email. If anything needs attention, we handle it immediately or coordinate with the right contractor. You are always in the loop without having to be there.",
                url: "https://coastalhomemngt30a.com/#how-it-works",
              },
            ],
            provider: {
              "@type": "LocalBusiness",
              name: "Coastal Home Management 30A",
              url: "https://coastalhomemngt30a.com",
              telephone: "+13094158793",
              email: "coastalhomemanagement30a@gmail.com",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Inlet Beach",
                addressRegion: "FL",
                postalCode: "32461",
                addressCountry: "US",
              },
            },
          }),
        }}
      />

      {/* Why CHM — 3 differentiators */}
      <section className="bg-black text-white px-4 md:px-6 py-20 md:py-28 fade-section">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-4 text-center">Why Homeowners Choose CHM</p>
          <h2 className="text-3xl md:text-4xl font-serif mb-14 text-center">What makes CHM different.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            <div>
              <div className="text-3xl mb-5">⌖</div>
              <h3 className="font-serif text-xl mb-3">Your neighbor, not a company</h3>
              <p className="text-white/65 text-sm leading-relaxed">
                I live in Watersound Origins. I&apos;m not dispatched from an office — I&apos;m down the street. That means faster response, community knowledge, and a face you&apos;ll actually recognize.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-5">◻</div>
              <h3 className="font-serif text-xl mb-3">Photos after every single visit</h3>
              <p className="text-white/65 text-sm leading-relaxed">
                Every visit is documented. You get photos and a written summary by text or email. No guessing whether someone showed up — you see exactly what I saw.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-5">✓</div>
              <h3 className="font-serif text-xl mb-3">One person. Full accountability.</h3>
              <p className="text-white/65 text-sm leading-relaxed">
                No rotating staff, no subcontractors, no &quot;I&apos;ll have someone look at it.&quot; You have my number. I&apos;m the one who shows up, and I&apos;m the one you call.
              </p>
            </div>
          </div>
          <div className="mt-14 text-center">
            <a
              href="#contact"
              className="inline-flex border border-white/30 px-8 py-3 text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Table */}
      <section
        id="pricing"
        className="bg-white px-4 md:px-6 py-20 md:py-28 fade-section border-t border-gray-100"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">
            Second Home Management Plans &amp; Pricing
          </h2>
          <p className="text-gray-500 text-sm mb-12 max-w-xl">
            Choose the level of care that fits your property. All plans include weekly inspections and immediate issue alerts. No contracts, no cancellation fees.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" aria-label="Coastal Home Management 30A service plan comparison">
              <caption className="sr-only">
                Comparison of Essential, Home Watch, and Coastal Elite monthly management plans offered by Coastal Home Management 30A
              </caption>
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th scope="col" className="py-4 pr-6 font-serif text-base font-normal w-1/2">What&apos;s Included</th>
                  <th scope="col" className="py-4 px-4 font-serif text-base font-normal text-center">
                    Essential<br /><span className="text-gray-500 text-xs font-sans">$150/mo</span>
                  </th>
                  <th scope="col" className="py-4 px-4 font-serif text-base font-normal text-center">
                    Home Watch<br /><span className="text-gray-500 text-xs font-sans">$275/mo</span>
                  </th>
                  <th scope="col" className="py-4 px-4 font-serif text-base font-normal text-center">
                    Coastal Elite<br /><span className="text-gray-500 text-xs font-sans">$599/mo</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {[
                  ["Weekly walkthrough — interior & exterior", true,  true,  true],
                  ["Issue alerts sent immediately",            true,  true,  true],
                  ["Photo documentation after every visit",    true,  true,  true],
                  ["Written visit report",                     true,  true,  true],
                  ["Mail pickup every visit",                  true,  true,  true],
                  ["Trash out & return (on request)",          true,  true,  true],
                  ["Secure key holding & access coordination", true,  true,  true],
                  ["Appliance & piping checks each visit",     false, true,  true],
                  ["Irrigation filter cleaning",               false, true,  true],
                  ["Storm & freeze monitoring",                false, false, true],
                  ["HVAC filter changes — every unit",         false, false, true],
                  ["Pre-arrival walkthrough & A/C pre-set",    false, false, true],
                  ["Post-departure secure check",              false, false, true],
                  ["Contractor coordination & on-call access", false, false, true],
                ].map(([feature, std, prem, elite]) => (
                  <tr key={feature as string}>
                    <td className="py-3 pr-6 text-gray-700">{feature as string}</td>
                    <td className="py-3 px-4 text-center">{std   ? <span aria-label="Included" className="text-black">✓</span> : <span aria-label="Not included" className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-4 text-center">{prem  ? <span aria-label="Included" className="text-black">✓</span> : <span aria-label="Not included" className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-4 text-center">{elite ? <span aria-label="Included" className="text-black">✓</span> : <span aria-label="Not included" className="text-gray-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black">
                  <td className="py-4 pr-6 font-serif text-base">Monthly price</td>
                  <td className="py-4 px-4 text-center font-serif text-base">$150</td>
                  <td className="py-4 px-4 text-center font-serif text-base">$275</td>
                  <td className="py-4 px-4 text-center font-serif text-base">$599</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/pricing"
              className="inline-flex border border-black px-6 py-3 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
            >
              Full Pricing Details
            </Link>
            <a
              href={`mailto:${siteData.contactEmail}`}
              className="inline-flex px-6 py-3 text-xs uppercase tracking-widest text-gray-500 hover:text-black transition"
            >
              Questions? Email Ryder →
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="bg-gray-50 px-4 md:px-6 py-20 md:py-28 fade-section"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-lg font-serif mb-3">
                What does Coastal Home Management 30A do?
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                We provide regular, documented property care for second-home and vacation homeowners
                in Watersound Origins, Naturewalk, and Inlet Beach along scenic 30A. Every visit
                includes a full walk-through, photo documentation, and a summary report sent directly
                to you. We also handle on-call tasks, mail pickup, trash service, contractor coordination,
                and arrival prep so your home is always in order — whether you&apos;re here or a thousand miles away.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-lg font-serif mb-3">
                What areas do you serve?
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                We serve Watersound Origins, Naturewalk, Inlet Beach, and surrounding communities
                along scenic 30A in the Florida Panhandle. If you&apos;re not sure whether your property
                falls within our coverage area, just reach out — we&apos;re happy to confirm.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-lg font-serif mb-3">
                How much does second home management cost?
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Our monthly management plans start at $150/month (Essential) and go up to $599/month
                for our Coastal Elite membership. We also offer on-call services at $75 base plus
                $45/hour, and mail or trash handling at $35/day. Visit our{" "}
                <Link href="/pricing" className="underline hover:text-black">
                  pricing page
                </Link>{" "}
                for full details on what&apos;s included in each plan.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-lg font-serif mb-3">
                What happens during a property visit?
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Every visit includes a full interior and exterior walk-through of your home. We check
                for anything that needs attention — HVAC, irrigation, entry points, exterior condition,
                signs of water intrusion, storm damage, or anything out of the ordinary. We photograph
                each visit and send you a written summary by text or email so you always know exactly
                what&apos;s going on at your property.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-lg font-serif mb-3">
                Are you licensed and insured?
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Yes. Coastal Home Management 30A is a fully insured Florida LLC, formed in October 2025.
                We take the responsibility of caring for your home seriously, and proper coverage
                is part of that commitment. You can have confidence that your property is in professional hands.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-lg font-serif mb-3">
                What makes CHM different from a large property management company?
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                You get Ryder — directly. No call centers, no rotating staff, no chasing someone down
                for an update. When something happens at your property, it gets handled fast by someone
                who knows your home personally. That&apos;s what it means to work with a local operator
                rather than a large company that manages hundreds of properties.
              </p>
            </div>

            <div className="pb-2">
              <h3 className="text-lg font-serif mb-3">
                How do I get started?
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Send us an email or use the contact form on this page. We&apos;ll talk through your
                property, your schedule, and what level of care makes sense for you. Most clients
                are set up and receiving their first visit report within a few days of their first
                conversation.
              </p>
            </div>
          </div>

          {/* External Authority Links */}
          <div className="mt-16 pt-10 border-t border-gray-200">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-5">
              Useful Resources for 30A Homeowners
            </p>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
              <a
                href="https://www.co.walton.fl.us/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black underline transition"
              >
                Walton County, FL — Official Government Site
              </a>
              <a
                href="https://www.ready.gov/home"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black underline transition"
              >
                FEMA Ready.gov — Home Preparedness
              </a>
              <a
                href="https://www.floridadisaster.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black underline transition"
              >
                Florida Division of Emergency Management
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQPage JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What does Coastal Home Management 30A do?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "We provide regular, documented property care for second-home and vacation homeowners in Watersound Origins, Naturewalk, and Inlet Beach along scenic 30A. Every visit includes a full walk-through, photo documentation, and a summary report sent directly to you. We also handle on-call tasks, mail pickup, trash service, contractor coordination, and arrival prep.",
                },
              },
              {
                "@type": "Question",
                name: "What areas do you serve?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "We serve Watersound Origins, Naturewalk, Inlet Beach, and surrounding communities along scenic 30A in the Florida Panhandle. Reach out to confirm your property falls within our coverage area.",
                },
              },
              {
                "@type": "Question",
                name: "How much does second home management cost?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Monthly management plans start at $150/month (Essential) and go up to $599/month for the Coastal Elite membership. On-call services are $75 base plus $45/hour. Mail or trash handling is $35/day.",
                },
              },
              {
                "@type": "Question",
                name: "What happens during a property visit?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Every visit includes a full interior and exterior walk-through checking HVAC, irrigation, entry points, exterior condition, and signs of water intrusion or storm damage. We photograph each visit and send a written summary by text or email.",
                },
              },
              {
                "@type": "Question",
                name: "Are you licensed and insured?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Coastal Home Management 30A is a fully insured Florida LLC, formed in October 2025. Your property is in professional, covered hands.",
                },
              },
              {
                "@type": "Question",
                name: "What makes CHM different from a large property management company?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You get Ryder directly — no call centers, no rotating staff. When something happens at your property it gets handled fast by someone who knows your home personally. That's the difference between a local operator and a large company managing hundreds of properties.",
                },
              },
              {
                "@type": "Question",
                name: "How do I get started?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Send an email or use the contact form on the site. We'll discuss your property and what level of care fits your needs. Most clients receive their first visit report within a few days of signing up.",
                },
              },
            ],
          }),
        }}
      />

      {/* Service Area Map */}
      <section className="bg-white px-6 py-20 fade-section">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-serif tracking-tight text-black">
            Our Service Area
          </h2>
          <p className="text-gray-500 text-sm uppercase tracking-widest">
            Watersound Origins · Naturewalk · Scenic 30A
          </p>
          <ServiceAreaMapWrapper />
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="px-6 py-32 bg-gray-900 text-white fade-section"
      >
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <h2 className="text-3xl font-serif tracking-tight mb-2">
            Ready to Protect Your 30A Property? Let&apos;s Talk.
          </h2>
          <p className="text-gray-300">
            Reach out for availability and customized service plans.
          </p>
          <div className="mt-auto pt-2">
  <a
    href={`mailto:${siteData.contactEmail}`}
    className="inline-flex border border-black px-5 py-3 text-xs uppercase tracking-wide hover:bg-black hover:text-white transition"
  >
    Message to inquire
  </a>
</div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="about-section fade-section"
      >
        <div className="about-bridge" aria-hidden="true" />

        <div className="about-inner">
          <div className="about-grid">
            {/* Photo (slides in) */}
            <div className="about-media">
              <div className="about-media-frame">
                <img
                  src="/profile-web.jpg"
                  alt="Ryder Schilling, founder of Coastal Home Management 30A, at a Watersound Origins property"
                  className="about-media-img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            {/* About me */}
            <div className="about-copy">
              <h2 className="about-title">
                Why Do 30A Second&#8209;Home Owners Trust CHM?
              </h2>

              <p className="about-body">
                I’m Ryder Schilling — founder of Coastal Home Management 30A. I
                handle high-trust home care for second-home owners with consistent
                check-ins, clear communication, and detailed reporting so your
                property stays protected while you’re away.
              </p>

              <ul className="about-list">
                <li>$8M+ in second home real estate managed</li>
                <li>Local business — I live in the neighborhood</li>
                <li>Weekly reports with photos after every visit</li>
                <li>Experienced, detail-focused care</li>
                <li>Flexible add-on services</li>
              </ul>

              <a href="#contact" className="about-cta">
                Work with me
              </a>
            </div>
          </div>
        </div>
      </section>

{/* Related Services */}
<section className="border-t border-gray-100 bg-white px-6 py-10">
  <div className="mx-auto max-w-6xl">
    <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-gray-500">
      Our Services
    </p>
    <div className="flex flex-wrap gap-3">
      <Link
        href="/second-home-management-inlet-beach"
        className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
      >
        Second Home Management
      </Link>
      <Link
        href="/concierge-services-inlet-beach"
        className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
      >
        Concierge Services
      </Link>
      <Link
        href="/mail-package-handling-inlet-beach"
        className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
      >
        Mail &amp; Package Handling
      </Link>
      <Link
        href="/home-check-services-30a"
        className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
      >
        Home Check Services
      </Link>
      <Link
        href="/pricing"
        className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
      >
        Service Plans &amp; Pricing
      </Link>
    </div>
  </div>
</section>


    </main>
  );
}
