import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { siteData, trustStats, testimonials, businessContact } from "@/data/siteData";
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
    <main className="min-h-screen font-sans bg-[#f6f9fc] text-[#0f172a]">
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
      <div className="bg-[#f6f9fc] border-b border-[rgba(15,23,42,0.08)] px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-8 md:gap-14 flex-wrap">

          {/* Stat 1 — portfolio */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#0f172a] text-2xl md:text-3xl font-serif tracking-tight">{trustStats.propertiesManaged}</span>
            <span className="text-[#93a3b5] text-[10px] uppercase tracking-[0.24em]">in properties managed</span>
          </div>

          <span className="hidden md:inline h-8 w-px bg-[rgba(15,23,42,0.1)]" aria-hidden="true" />

          {/* Stat 2 — active homes */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#0f172a] text-2xl md:text-3xl font-serif tracking-tight">{trustStats.activeHomes}</span>
            <span className="text-[#93a3b5] text-[10px] uppercase tracking-[0.24em]">active client homes</span>
          </div>

          <span className="hidden md:inline h-8 w-px bg-[rgba(15,23,42,0.1)]" aria-hidden="true" />

          {/* Stat 3 — Google rating */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-amber-400 text-xl tracking-wide" aria-label="5 stars">★★★★★</span>
            <a
              href="https://www.google.com/search?q=Coastal+Home+Management+30A"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#93a3b5] text-[10px] uppercase tracking-[0.24em] hover:text-[#1d4ed8] transition"
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
            sameAs: [
              "https://www.google.com/maps/place/Coastal+Home+Management+30A",
              "https://www.facebook.com/profile.php?id=61575773416368",
              "https://www.linkedin.com/company/113245630/",
              "https://www.yelp.com/biz/coastal-home-management-30a-inlet-beach",
              "https://www.destinflorida.com/30a/services/home-watch-concierge/coastal-home-management-30a",
              "https://nextdoor.com/pages/coastal-home-management-30a-inlet-beach-fl",
              "https://sourceatrade.com/contractors/coastal-home-management-30a-3",
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: trustStats.ratingValue,
              bestRating: trustStats.bestRating,
              reviewCount: trustStats.reviewCount,
            },
            review: testimonials.map((t) => ({
              "@type": "Review",
              datePublished: t.datePublished,
              author: { "@type": "Person", name: t.author },
              reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: "5" },
              reviewBody: t.body,
            })),
          }),
        }}
      />

{/* Meet Ryder — personal intro strip */}
<section className="bg-[#f6f9fc] px-4 md:px-6 py-20 md:py-28 fade-section">
  <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-20">
    <div className="flex-shrink-0 reveal-item">
      <div className="relative">
        <div className="absolute -inset-3 rounded-full border border-[rgba(15,23,42,0.1)]" aria-hidden="true" />
        <img
          src="/profile-web.jpg"
          alt="Ryder Schilling, founder of Coastal Home Management 30A"
          className="w-32 h-32 md:w-44 md:h-44 rounded-full object-cover shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
    <div>
      <p className="ch-eyebrow reveal-item">Who You&apos;re Hiring</p>
      <h2 className="ch-display ch-display--sm mb-6 reveal-item">
        I live in Watersound Origins.<br className="hidden md:block" /> This is my neighborhood too.
      </h2>
      <p className="ch-lede max-w-xl reveal-item">
        I&apos;m Ryder Schilling. I started CHM because my neighbors needed someone they could actually trust — not a company, a person. I&apos;m here full-time, I know the streets, I know this community, and I&apos;m the one who shows up to your house. Today I actively manage more than $8 million in second home real estate across Watersound Origins, Naturewalk, and Inlet Beach. Every single visit, every single time.
      </p>
      <div className="reveal-item">
        <Link href="/about" className="ch-link mt-8">
          More about Ryder →
        </Link>
      </div>
    </div>
  </div>
</section>

{/* Services */}
<section
  id="services"
  className="bg-[#edf3f9] px-4 md:px-6 py-24 md:py-32 fade-section"
>
  <div className="max-w-6xl mx-auto">
    <p className="ch-eyebrow reveal-item">01 — Services</p>
    <h2 className="ch-display mb-12 md:mb-16 max-w-3xl reveal-item">
      What Services Do We Offer for Second Homeowners on 30A?
    </h2>

    {(() => {
      const services = [
        {
          img: "/img.png",
          alt: "Second Home Management",
          title: <>Second Home Management</>,
          body: (
            <>
              Comprehensive oversight while you’re away. Weekly or bi-weekly check-ins,
              full property inspections, issue coordination, and proactive care to keep
              your home in top condition.
            </>
          ),
        },
        {
          img: "/service2.png",
          alt: "Mail & Package Handling",
          title: <>Mail &amp; Package Handling</>,
          body: (
            <>
              Receive and manage all mail and deliveries while you’re away. Packages
              are collected, secured, and handled according to your preferences so
              nothing is missed.
            </>
          ),
        },
        {
          img: "/service3.png",
          alt: "Concierge Services",
          title: <>Concierge Services</>,
          body: (
            <>
              Anything you may need as a homeowner. From one-off requests to ongoing
              assistance, we handle the details so you don’t have to.
            </>
          ),
        },
      ];

      const Card = ({ s, wide }: { s: (typeof services)[number]; wide?: boolean }) => (
        <div
          className={`ch-card group flex flex-col ${
            wide ? "snap-center shrink-0 w-[88vw]" : "h-full"
          }`}
        >
          <div className={`${wide ? "h-64" : "h-64"} w-full overflow-hidden`}>
            <img
              src={s.img}
              alt={s.alt}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          </div>
          <div className="p-7 md:p-8 flex flex-col flex-1">
            <h3 className="text-2xl font-serif mb-3 text-[#0f172a]">{s.title}</h3>
            <p className="text-sm leading-relaxed text-[#5b6b7f] mb-7">{s.body}</p>
            <div className="mt-auto">
              <a href={`mailto:${siteData.contactEmail}`} className="ch-link">
                Learn more →
              </a>
            </div>
          </div>
        </div>
      );

      return (
        <>
          {/* MOBILE: full-size swipe cards */}
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar">
              {services.map((s) => (
                <Card key={s.alt} s={s} wide />
              ))}
            </div>

            {/* Mobile swipe cue */}
            <div className="mt-2 flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-[#93a3b5]">
              <span>Swipe</span>
              <span className="swipe-chevron">›</span>
            </div>
          </div>

          {/* DESKTOP: 3-column grid */}
          <div className="hidden md:grid grid-cols-3 gap-8 lg:gap-10">
            {services.map((s) => (
              <div key={s.alt} className="reveal-item h-full">
                <Card s={s} />
              </div>
            ))}
          </div>
        </>
      );
    })()}
  </div>
</section>

      {/* ─── Item 4: How It Works Section + HowTo JSON-LD Schema ─────────── */}
      <section
        id="how-it-works"
        className="bg-[#f6f9fc] px-4 md:px-6 py-24 md:py-32 fade-section"
      >
        <div className="max-w-4xl mx-auto">
          <p className="ch-eyebrow reveal-item">02 — The Process</p>
          <h2 className="ch-display mb-5 reveal-item">
            How Does Second Home Management Work on 30A?
          </h2>
          <p className="ch-lede mb-16 md:mb-20 max-w-xl reveal-item">
            Simple, transparent, and handled by one person who treats your property like it&apos;s their own.
          </p>

          <ol className="space-y-14 md:space-y-16" role="list">
            <li className="flex gap-6 md:gap-8 items-start reveal-item">
              <div className="ch-numeral" aria-hidden="true">
                01
              </div>
              <div>
                <h3 className="text-2xl font-serif mb-3 text-[#0f172a]">Reach Out and Tell Us About Your Property</h3>
                <p className="text-[#5b6b7f] text-sm leading-[1.8] max-w-lg">
                  Email or call Ryder directly. We&apos;ll talk through your property, your schedule, and what level of
                  care makes sense for you. There&apos;s no pressure and no sales call — just a real conversation.
                  Most clients are set up within a few days.
                </p>
              </div>
            </li>

            <li className="flex gap-6 md:gap-8 items-start reveal-item">
              <div className="ch-numeral" aria-hidden="true">
                02
              </div>
              <div>
                <h3 className="text-2xl font-serif mb-3 text-[#0f172a]">We Set Up Your Account and Collect Access Details</h3>
                <p className="text-[#5b6b7f] text-sm leading-[1.8] max-w-lg">
                  We document your property details, key access, emergency contacts, HVAC preferences, and any specific
                  concerns. Everything is logged so nothing gets missed. Ryder handles the setup personally — there&apos;s
                  no one else involved.
                </p>
              </div>
            </li>

            <li className="flex gap-6 md:gap-8 items-start reveal-item">
              <div className="ch-numeral" aria-hidden="true">
                03
              </div>
              <div>
                <h3 className="text-2xl font-serif mb-3 text-[#0f172a]">Regular Inspections Begin on Your Schedule</h3>
                <p className="text-[#5b6b7f] text-sm leading-[1.8] max-w-lg">
                  On a weekly or bi-weekly schedule, we walk your property inside and out. We check every system —
                  HVAC, plumbing, irrigation, entry points, exterior condition — and photograph everything.
                  Storm events trigger unscheduled visits at no extra charge on Elite plans.
                </p>
              </div>
            </li>

            <li className="flex gap-6 md:gap-8 items-start reveal-item">
              <div className="ch-numeral" aria-hidden="true">
                04
              </div>
              <div>
                <h3 className="text-2xl font-serif mb-3 text-[#0f172a]">You Receive a Report After Every Single Visit</h3>
                <p className="text-[#5b6b7f] text-sm leading-[1.8] max-w-lg">
                  After each visit you get a written summary with photos by text or email. If anything needs attention,
                  we handle it immediately or coordinate with the right contractor. You&apos;re always in the loop —
                  without having to be here.
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-16 reveal-item">
            <a
              href="mailto:coastalhomemanagement30a@gmail.com"
              className="ch-btn ch-btn--solid"
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
              telephone: businessContact.phone,
              email: "coastalhomemanagement30a@gmail.com",
              address: {
                "@type": "PostalAddress",
                addressLocality: businessContact.address.locality,
                addressRegion: businessContact.address.region,
                postalCode: businessContact.address.postalCode,
                addressCountry: businessContact.address.country,
              },
            },
          }),
        }}
      />

      {/* Why CHM — 3 differentiators */}
      <section className="ch-deep-band text-white px-4 md:px-6 py-24 md:py-32 fade-section">
        <div className="max-w-5xl mx-auto">
          <p className="ch-eyebrow ch-eyebrow--center ch-eyebrow--light reveal-item">Why Homeowners Choose CHM</p>
          <h2 className="ch-display ch-display--light mb-16 md:mb-20 text-center reveal-item">What makes CHM different.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            <div className="reveal-item">
              <div className="text-2xl mb-6 text-[#7ba3f0]" aria-hidden="true">⌖</div>
              <h3 className="font-serif text-2xl mb-3">Your neighbor, not a company</h3>
              <p className="text-white/60 text-sm leading-[1.8]">
                I live in Watersound Origins. I&apos;m not dispatched from an office — I&apos;m down the street. That means faster response, community knowledge, and a face you&apos;ll actually recognize.
              </p>
            </div>
            <div className="reveal-item">
              <div className="text-2xl mb-6 text-[#7ba3f0]" aria-hidden="true">◻</div>
              <h3 className="font-serif text-2xl mb-3">Photos after every single visit</h3>
              <p className="text-white/60 text-sm leading-[1.8]">
                Every visit is documented. You get photos and a written summary by text or email. No guessing whether someone showed up — you see exactly what I saw.
              </p>
            </div>
            <div className="reveal-item">
              <div className="text-2xl mb-6 text-[#7ba3f0]" aria-hidden="true">✓</div>
              <h3 className="font-serif text-2xl mb-3">One person. Full accountability.</h3>
              <p className="text-white/60 text-sm leading-[1.8]">
                No rotating staff, no subcontractors, no &quot;I&apos;ll have someone look at it.&quot; You have my number. I&apos;m the one who shows up, and I&apos;m the one you call.
              </p>
            </div>
          </div>
          <div className="mt-16 text-center reveal-item">
            <a href="#contact" className="ch-btn ch-btn--light">
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Table */}
      <section
        id="pricing"
        className="bg-[#f6f9fc] px-4 md:px-6 py-24 md:py-32 fade-section"
      >
        <div className="max-w-4xl mx-auto">
          <p className="ch-eyebrow reveal-item">03 — Plans</p>
          <h2 className="ch-display mb-5 reveal-item">
            Second Home Management Plans &amp; Pricing
          </h2>
          <p className="ch-lede mb-14 max-w-xl reveal-item">
            Choose the level of care that fits your property. All plans include weekly inspections and immediate issue alerts. No contracts, no cancellation fees.
          </p>

          <div className="overflow-x-auto reveal-item rounded-2xl border border-[rgba(15,23,42,0.1)] bg-white p-4 md:p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.25)]">
            <table className="w-full text-sm border-collapse" aria-label="Coastal Home Management 30A service plan comparison">
              <caption className="sr-only">
                Comparison of Essential, Home Watch, and Coastal Elite monthly management plans offered by Coastal Home Management 30A
              </caption>
              <thead>
                <tr className="border-b border-[rgba(15,23,42,0.35)] text-left">
                  <th scope="col" className="py-4 pr-6 font-serif text-base font-normal w-1/2">What&apos;s Included</th>
                  <th scope="col" className="py-4 px-4 font-serif text-base font-normal text-center">
                    Essential<br /><span className="text-[#5b6b7f] text-xs font-sans">$150/mo</span>
                  </th>
                  <th scope="col" className="py-4 px-4 font-serif text-base font-normal text-center">
                    Home Watch<br /><span className="text-[#5b6b7f] text-xs font-sans">$275/mo</span>
                  </th>
                  <th scope="col" className="py-4 px-4 font-serif text-base font-normal text-center">
                    Coastal Elite<br /><span className="text-[#5b6b7f] text-xs font-sans">$599/mo</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(15,23,42,0.06)] text-[#334155]">
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
                    <td className="py-3 pr-6 text-[#334155]">{feature as string}</td>
                    <td className="py-3 px-4 text-center">{std   ? <span aria-label="Included" className="text-[#1d4ed8]">✓</span> : <span aria-label="Not included" className="text-[#cbd5e1]">—</span>}</td>
                    <td className="py-3 px-4 text-center">{prem  ? <span aria-label="Included" className="text-[#1d4ed8]">✓</span> : <span aria-label="Not included" className="text-[#cbd5e1]">—</span>}</td>
                    <td className="py-3 px-4 text-center">{elite ? <span aria-label="Included" className="text-[#1d4ed8]">✓</span> : <span aria-label="Not included" className="text-[#cbd5e1]">—</span>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[rgba(15,23,42,0.35)]">
                  <td className="py-4 pr-6 font-serif text-base">Monthly price</td>
                  <td className="py-4 px-4 text-center font-serif text-base">$150</td>
                  <td className="py-4 px-4 text-center font-serif text-base">$275</td>
                  <td className="py-4 px-4 text-center font-serif text-base">$599</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 reveal-item">
            <Link href="/pricing" className="ch-btn">
              Full Pricing Details
            </Link>
            <a
              href={`mailto:${siteData.contactEmail}`}
              className="inline-flex px-2 py-3 text-xs uppercase tracking-widest text-[#5b6b7f] hover:text-[#1d4ed8] transition"
            >
              Questions? Email Ryder →
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="bg-[#edf3f9] px-4 md:px-6 py-24 md:py-32 fade-section"
      >
        <div className="max-w-3xl mx-auto">
          <p className="ch-eyebrow reveal-item">04 — Questions</p>
          <h2 className="ch-display mb-14 reveal-item">
            Frequently Asked Questions
          </h2>

          <div className="space-y-10">
            <div className="border-b border-[rgba(15,23,42,0.1)] pb-10 reveal-item">
              <h3 className="text-xl md:text-2xl font-serif mb-3 text-[#0f172a]">
                What does Coastal Home Management 30A do?
              </h3>
              <p className="text-[#5b6b7f] text-sm leading-[1.8]">
                We provide regular, documented property care for second-home and vacation homeowners
                in Watersound Origins, Naturewalk, and Inlet Beach along scenic 30A. Every visit
                includes a full walk-through, photo documentation, and a summary report sent directly
                to you. We also handle on-call tasks, mail pickup, trash service, contractor coordination,
                and arrival prep so your home is always in order — whether you&apos;re here or a thousand miles away.
              </p>
            </div>

            <div className="border-b border-[rgba(15,23,42,0.1)] pb-10 reveal-item">
              <h3 className="text-xl md:text-2xl font-serif mb-3 text-[#0f172a]">
                What areas do you serve?
              </h3>
              <p className="text-[#5b6b7f] text-sm leading-[1.8]">
                We serve Watersound Origins, Naturewalk, Inlet Beach, and surrounding communities
                along scenic 30A in the Florida Panhandle. If you&apos;re not sure whether your property
                falls within our coverage area, just reach out — we&apos;re happy to confirm.
              </p>
            </div>

            <div className="border-b border-[rgba(15,23,42,0.1)] pb-10 reveal-item">
              <h3 className="text-xl md:text-2xl font-serif mb-3 text-[#0f172a]">
                How much does second home management cost?
              </h3>
              <p className="text-[#5b6b7f] text-sm leading-[1.8]">
                Our monthly management plans start at $150/month (Essential) and go up to $599/month
                for our Coastal Elite membership. We also offer on-call services at $75 base plus
                $45/hour, and mail or trash handling at $35/day. Visit our{" "}
                <Link href="/pricing" className="underline hover:text-black">
                  pricing page
                </Link>{" "}
                for full details on what&apos;s included in each plan.
              </p>
            </div>

            <div className="border-b border-[rgba(15,23,42,0.1)] pb-10 reveal-item">
              <h3 className="text-xl md:text-2xl font-serif mb-3 text-[#0f172a]">
                What happens during a property visit?
              </h3>
              <p className="text-[#5b6b7f] text-sm leading-[1.8]">
                Every visit includes a full interior and exterior walk-through of your home. We check
                for anything that needs attention — HVAC, irrigation, entry points, exterior condition,
                signs of water intrusion, storm damage, or anything out of the ordinary. We photograph
                each visit and send you a written summary by text or email so you always know exactly
                what&apos;s going on at your property.
              </p>
            </div>

            <div className="border-b border-[rgba(15,23,42,0.1)] pb-10 reveal-item">
              <h3 className="text-xl md:text-2xl font-serif mb-3 text-[#0f172a]">
                Are you licensed and insured?
              </h3>
              <p className="text-[#5b6b7f] text-sm leading-[1.8]">
                Yes. Coastal Home Management 30A is a fully insured Florida LLC, formed in October 2025.
                We take the responsibility of caring for your home seriously, and proper coverage
                is part of that commitment. You can have confidence that your property is in professional hands.
              </p>
            </div>

            <div className="border-b border-[rgba(15,23,42,0.1)] pb-10 reveal-item">
              <h3 className="text-xl md:text-2xl font-serif mb-3 text-[#0f172a]">
                What makes CHM different from a large property management company?
              </h3>
              <p className="text-[#5b6b7f] text-sm leading-[1.8]">
                You get Ryder — directly. No call centers, no rotating staff, no chasing someone down
                for an update. When something happens at your property, it gets handled fast by someone
                who knows your home personally. That&apos;s what it means to work with a local operator
                rather than a large company that manages hundreds of properties.
              </p>
            </div>

            <div className="pb-2 reveal-item">
              <h3 className="text-xl md:text-2xl font-serif mb-3 text-[#0f172a]">
                How do I get started?
              </h3>
              <p className="text-[#5b6b7f] text-sm leading-[1.8]">
                Send us an email or use the contact form on this page. We&apos;ll talk through your
                property, your schedule, and what level of care makes sense for you. Most clients
                are set up and receiving their first visit report within a few days of their first
                conversation.
              </p>
            </div>
          </div>

          {/* External Authority Links */}
          <div className="mt-16 pt-10 border-t border-[rgba(15,23,42,0.1)] reveal-item">
            <p className="text-xs uppercase tracking-[0.24em] text-[#93a3b5] mb-5">
              Useful Resources for 30A Homeowners
            </p>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-[#5b6b7f]">
              <a
                href="https://www.co.walton.fl.us/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1d4ed8] underline underline-offset-4 decoration-[rgba(15,23,42,0.25)] transition"
              >
                Walton County, FL — Official Government Site
              </a>
              <a
                href="https://www.ready.gov/home"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1d4ed8] underline underline-offset-4 decoration-[rgba(15,23,42,0.25)] transition"
              >
                FEMA Ready.gov — Home Preparedness
              </a>
              <a
                href="https://www.floridadisaster.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1d4ed8] underline underline-offset-4 decoration-[rgba(15,23,42,0.25)] transition"
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
              {
                "@type": "Question",
                name: "Who provides home watch services in Watersound Origins Florida?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Coastal Home Management 30A, founded by Ryder Schilling — a full-time Watersound Origins resident — is the dedicated home watch and second home management provider serving Watersound Origins, Naturewalk at Watersound, and Inlet Beach along 30A. We offer weekly inspections, photo reports, storm preparation, and complete property oversight for second-home owners.",
                },
              },
              {
                "@type": "Question",
                name: "What is the best home watch service near Inlet Beach or 30A?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Coastal Home Management 30A is rated 5.0 on Google and is the only home watch provider that actually lives in Watersound Origins. Ryder Schilling personally visits every property — no subcontractors, no rotating staff, no call center. Service area covers Watersound Origins, Naturewalk, Inlet Beach, Alys Beach, and Rosemary Beach.",
                },
              },
              {
                "@type": "Question",
                name: "Who manages second homes in Watersound Origins Florida?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Coastal Home Management 30A manages second homes in Watersound Origins, Florida. Owner Ryder Schilling lives in the community and provides personal, high-trust property care including home watch inspections, mail handling, storm prep, HVAC monitoring, and concierge services. Currently managing over $8 million in second home real estate across Watersound Origins and Inlet Beach.",
                },
              },
              {
                "@type": "Question",
                name: "Who checks on vacation homes in Naturewalk at Watersound Origins when owners are away?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Coastal Home Management 30A serves Naturewalk at Watersound Origins with scheduled home watch visits. We walk the property inside and out, check all systems, photograph the home, and send a written report after every single visit.",
                },
              },
              {
                "@type": "Question",
                name: "What companies offer home watch services along 30A in the Florida Panhandle?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Coastal Home Management 30A is the locally owned and operated home watch company serving the 30A corridor in the Florida Panhandle, with a focus on Watersound Origins, Naturewalk, and Inlet Beach. Founded in 2025, fully insured Florida LLC, 5.0 Google rating. Contact: coastalhomemanagement30a@gmail.com or (309) 415-8793.",
                },
              },
            ],
          }),
        }}
      />

      {/* Service Area Map */}
      <section className="bg-[#f6f9fc] px-6 py-24 md:py-28 fade-section">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="ch-eyebrow ch-eyebrow--center reveal-item">Coverage</p>
          <h2 className="ch-display ch-display--sm reveal-item">
            Our Service Area
          </h2>
          <p className="text-[#93a3b5] text-xs uppercase tracking-[0.24em] reveal-item">
            Watersound Origins · Naturewalk · Scenic 30A
          </p>
          <ServiceAreaMapWrapper />
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="ch-deep-band px-6 py-28 md:py-36 text-white fade-section"
      >
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <p className="ch-eyebrow ch-eyebrow--center ch-eyebrow--light reveal-item">Get Started</p>
          <h2 className="ch-display ch-display--light reveal-item">
            Ready to Protect Your 30A Property? Let&apos;s Talk.
          </h2>
          <p className="text-white/60 reveal-item">
            Reach out for availability and customized service plans.
          </p>
          <div className="pt-4 reveal-item">
            <a
              href={`mailto:${siteData.contactEmail}`}
              className="ch-btn ch-btn--light"
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
<section className="border-t border-[rgba(15,23,42,0.08)] bg-[#f6f9fc] px-6 py-12">
  <div className="mx-auto max-w-6xl">
    <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-[#93a3b5]">
      Our Services
    </p>
    <div className="flex flex-wrap gap-3">
      <Link
        href="/second-home-management-inlet-beach"
        className="rounded-full border border-[rgba(15,23,42,0.14)] bg-white px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[#334155] transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
      >
        Second Home Management
      </Link>
      <Link
        href="/concierge-services-inlet-beach"
        className="rounded-full border border-[rgba(15,23,42,0.14)] bg-white px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[#334155] transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
      >
        Concierge Services
      </Link>
      <Link
        href="/mail-package-handling-inlet-beach"
        className="rounded-full border border-[rgba(15,23,42,0.14)] bg-white px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[#334155] transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
      >
        Mail &amp; Package Handling
      </Link>
      <Link
        href="/home-check-services-30a"
        className="rounded-full border border-[rgba(15,23,42,0.14)] bg-white px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[#334155] transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
      >
        Home Check Services
      </Link>
      <Link
        href="/pricing"
        className="rounded-full border border-[rgba(15,23,42,0.14)] bg-white px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[#334155] transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
      >
        Service Plans &amp; Pricing
      </Link>
      <Link
        href="/choosing-a-home-watch-company-30a"
        className="rounded-full border border-[rgba(15,23,42,0.14)] bg-white px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[#334155] transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
      >
        How to Choose a Home Watch Company
      </Link>
    </div>
  </div>
</section>


    </main>
  );
}
