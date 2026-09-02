import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { siteData, trustStats, testimonials, businessContact } from "@/data/siteData";
import TestimonialsSection from "@/components/TestimonialsSection";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import ServiceAreaMapWrapper from "@/components/ServiceAreaMapWrapper";
import ServiceTiles from "@/components/ServiceTiles";
import ScrollJourney from "@/components/ScrollJourney";
import VisitReportProof from "@/components/VisitReportProof";
import AlwaysOnSection from "@/components/AlwaysOnSection";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import { BookButton } from "@/components/BookingProvider";

export const metadata: Metadata = {
  description:
    "Second home management and home watch in Watersound Origins, Alys, Rosemary and scenic 30A. Insured Florida LLC. Weekly visits, photo report every time, one owner-operator. Free first walkthrough, and you do not need to be in town for it.",
  alternates: {
    canonical: "https://coastalhomemngt30a.com",
  },
};

/* Marquee content, one array, rendered twice for a seamless loop. */
const MARQUEE = [
  "Watersound Origins",
  "Alys Beach",
  "Rosemary Beach",
  "Scenic 30A",
  "Insured FL LLC",
  "5.0 on Google",
  "Owner-operated",
];

type Stat = {
  value: string;
  count: number;
  prefix: string;
  suffix: string;
  decimals: number;
  label: string;
};

const STATS: Stat[] = [
  { value: "$10M+", count: 10, prefix: "$", suffix: "M+", decimals: 0, label: "In property under care" },
  { value: "15+", count: 15, prefix: "", suffix: "+", decimals: 0, label: "Active client homes" },
  { value: "5.0", count: 5, prefix: "", suffix: "", decimals: 1, label: "Rating on Google" },
  { value: "100%", count: 100, prefix: "", suffix: "%", decimals: 0, label: "Visits photographed" },
];

const FAQS: FaqItem[] = [
  {
    q: "What does Coastal Home Management 30A do?",
    a: "We provide regular, documented property care for second-home and vacation homeowners in Watersound Origins, Alys, Rosemary, and scenic 30A. Every visit includes a full walk-through, photo documentation, and a summary report sent directly to you. We also handle on-call tasks, mail pickup, trash service, contractor coordination, and arrival prep so your home is always in order, whether you're here or a thousand miles away.",
  },
  {
    q: "What is home watch, and is it different from property management?",
    a: "Home watch is the scheduled checking of an unoccupied home: someone physically walks the property inside and out on a set schedule, checks the systems, and reports what they find. Traditional property management usually means managing tenants or rental bookings. Coastal Home Management 30A is a home watch and second home management service. We look after your home for you, not rent it out to other people.",
  },
  {
    q: "What areas do you serve?",
    a: "We serve Watersound Origins, Alys, Rosemary, and scenic 30A in the Florida Panhandle, including Inlet Beach, Naturewalk, Seacrest, and the surrounding communities. If you're not sure whether your property falls within our coverage area, just reach out, we're happy to confirm.",
  },
  {
    q: "How much does home watch cost in 30A?",
    a: (
      <>
        Our monthly plans start at $200/month (Essential) and go up to $600/month for the
        Coastal Elite membership. Lock in a 6 or 12-month rate and save up to 10%, still
        billed monthly. On-call services are $75 base plus $45/hour, and mail or
        trash handling is $35/day. See the{" "}
        <Link href="/pricing" className="text-[var(--ch-teal)] underline underline-offset-4">
          full pricing page
        </Link>{" "}
        for exactly what&apos;s included in each plan.
      </>
    ),
  },
  {
    q: "What happens during a property visit?",
    a: "Every visit includes a full interior and exterior walk-through of your home. We check for anything that needs attention: HVAC, irrigation, entry points, exterior condition, signs of water intrusion, storm damage, or anything out of the ordinary. We photograph each visit and send you a written summary by text or email so you always know exactly what's going on at your property.",
  },
  {
    q: "Are you licensed and insured?",
    a: "Yes. Coastal Home Management 30A is a fully insured Florida LLC, formed in October 2025. We take the responsibility of caring for your home seriously, and proper coverage is part of that commitment.",
  },
  {
    q: "What makes CHM different from a large property management company?",
    a: "You get Ryder, directly. No call centers, no rotating staff, no chasing someone down for an update. When something happens at your property it gets handled fast by someone who knows your home personally. That's what it means to work with a local operator who lives in the neighborhood rather than a company managing hundreds of properties from an office.",
  },
  {
    q: "How do I get started?",
    a: "Send your address using any button on this page, or call directly. You do not need to be in town. I'll walk the property, email you photos and a written condition report within 48 hours, and tell you straight what it actually needs. Most clients are set up and receiving their first visit report within a few days.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--ch-paper)] font-sans text-[var(--ch-ink)]">
      <LeadCapturePopup />

      {/* ═══ HERO, unchanged ═══════════════════════════════════════ */}
      <section className="hero relative h-screen overflow-hidden text-white">
        <Image
          src="/img.png"
          alt="Coastal Home Management 30A, pool maintenance and home care services in Watersound Origins, Florida"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="hero-bg object-cover object-top"
        />

        <div className="hero-overlay absolute inset-0" />

        <div className="hero-content relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="hero-title">COASTAL HOME MANAGEMENT 30A</h1>
          <div className="hero-divider" aria-hidden="true" />
          <p className="hero-sub">SCENIC 30A, FLORIDA</p>
          <a href="#contact" className="hero-cta">
            Contact
          </a>
        </div>

        <div className="hero-bottom relative z-10">
          <div className="hero-bottom-inner">
            <span>WATERSOUND ORIGINS</span>
            <span className="pipe">|</span>
            <span>ALYS</span>
            <span className="pipe">|</span>
            <span>ROSEMARY</span>
            <span className="pipe">|</span>
            <span>SCENIC 30A</span>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2" aria-hidden="true">
          <div className="scroll-cue">
            <span className="scroll-cue-line" />
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ════════════════════════════════════════════════ */}
      <div
        className="border-y border-[var(--ch-hairline)] bg-[var(--ch-paper)] py-6 md:py-8"
        aria-hidden="true"
      >
        <div className="ch-marquee" style={{ "--duration": "52s" } as React.CSSProperties}>
          {[0, 1].map((dup) => (
            <div className="ch-marquee__track" key={dup}>
              {MARQUEE.map((m) => (
                <span key={`${dup}-${m}`} className="flex items-center gap-[var(--gap,48px)]">
                  <span className="ch-marquee__item">{m}</span>
                  <span className="ch-marquee__dot" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STATS ══════════════════════════════════════════════════ */}
      <section className="fade-section bg-[var(--ch-paper)] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="reveal-item border-t border-[var(--ch-ink)] pt-6">
              <span
                className="block text-[clamp(38px,5.4vw,68px)] leading-[0.9] tracking-[-0.035em] text-[var(--ch-ink)]"
                style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 116, 'wght' 700" }}
                data-count-to={s.count}
                data-count-prefix={s.prefix}
                data-count-suffix={s.suffix}
                data-count-decimals={s.decimals}
              >
                {s.value}
              </span>
              <span className="ch-label mt-4 block max-w-[22ch] leading-[1.6]">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ MEET RYDER ═════════════════════════════════════════════ */}
      <section className="fade-section bg-[var(--ch-paper-alt)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 md:grid-cols-[auto_1fr] md:gap-20">
          <div className="reveal-item shrink-0">
            <div className="relative">
              <span
                className="absolute -inset-4 border border-[var(--ch-hairline)]"
                aria-hidden="true"
              />
              <img
                src="/profile-web.jpg"
                alt="Ryder Schilling, founder of Coastal Home Management 30A"
                className="h-48 w-48 object-cover md:h-72 md:w-72"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div>
            <p className="ch-eyebrow reveal-item">Who you&apos;re hiring</p>
            <h2 className="ch-display mb-7">
              <span className="ch-mask">
                <span>I live in Watersound Origins.</span>
              </span>
              <span className="ch-mask">
                <span>This is my neighborhood too.</span>
              </span>
            </h2>
            <span className="ch-draw mt-9 mb-9 block h-px w-24 bg-[var(--ch-teal)]" />
            <p className="ch-lede reveal-item">
              I&apos;m Ryder Schilling. I started CHM because my neighbors needed someone they
              could actually trust, not a company, a person. I&apos;m here full-time, I know the
              streets, and I&apos;m the one who shows up to your house. Today I look after more
              than $10 million in second-home real estate across Watersound Origins, Alys, Rosemary,
              and scenic 30A. Fully insured. Every visit, every time.
            </p>
            <div className="reveal-item mt-9 flex flex-wrap items-center gap-6">
              <BookButton source="meet-ryder" className="ch-btn ch-btn--solid" />
              <Link href="/about" className="ch-link">
                More about Ryder &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══════════════════════════════════════════════ */}
      <section id="services" className="fade-section bg-[var(--ch-paper)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="ch-eyebrow reveal-item">01 · Services</p>
              <h2 className="ch-display max-w-[20ch]">
                <span className="ch-mask">
                  <span>What we handle</span>
                </span>
                <span className="ch-mask">
                  <span>while you&apos;re away.</span>
                </span>
              </h2>
            </div>
            <Link href="/pricing" className="ch-link reveal-item shrink-0">
              See plans &amp; pricing &rarr;
            </Link>
          </div>

          <ServiceTiles />
        </div>
      </section>

      {/* ═══ PROCESS, the scroll journey ═══════════════════════════ */}
      <ScrollJourney />

      {/* ═══ PROOF, the visit report ══════════════════════════════ */}
      <VisitReportProof />

      {/* ═══ THE PHONE / 24-7 ══════════════════════════════════════ */}
      <AlwaysOnSection />

      {/* ═══ WHY CHM ═══════════════════════════════════════════════ */}
      <section className="fade-section bg-[var(--ch-paper)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[1240px]">
          <p className="ch-eyebrow reveal-item">05 · The difference</p>
          <h2 className="ch-mega mb-16 max-w-[14ch] md:mb-24">
            <span className="ch-mask">
              <span>Not a</span>
            </span>
            <span className="ch-mask">
              <span>company.</span>
            </span>
            <span className="ch-mask">
              <span className="text-[var(--ch-teal)]">A neighbor.</span>
            </span>
          </h2>

          <div className="grid gap-px bg-[var(--ch-hairline)] md:grid-cols-3">
            {[
              [
                "Down the street, not dispatched",
                "I live in Watersound Origins. When something happens at your property I'm minutes away, not routed from an office in another county. That's faster response, real community knowledge, and a face you'll actually recognize.",
              ],
              [
                "Photos after every single visit",
                "Every visit is documented and sent the same day. No guessing whether somebody showed up, no monthly summary that arrives three weeks after the leak started. You see exactly what I saw.",
              ],
              [
                "One person. Full accountability.",
                "No rotating staff, no subcontractors, no “I'll have someone look at it.” You have my number, I'm the one who shows up, and I'm the one you call when it matters.",
              ],
            ].map(([title, body], i) => (
              <div key={title} className="reveal-item bg-[var(--ch-paper)] p-8 md:p-10">
                <span className="ch-label !text-[var(--ch-teal)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="ch-h3 mt-5">{title}</h3>
                <p className="ch-lede mt-4 !text-[14.5px]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══════════════════════════════════════════════ */}
      <section id="pricing" className="fade-section bg-[var(--ch-paper-alt)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-12 md:mb-16">
            <p className="ch-eyebrow reveal-item">06 · Plans</p>
            <h2 className="ch-display mb-5">
              <span className="ch-mask">
                <span>Second home management</span>
              </span>
              <span className="ch-mask">
                <span>plans &amp; pricing.</span>
              </span>
            </h2>
            <p className="ch-lede reveal-item">
              Every plan includes weekly walkthroughs, immediate issue alerts, and a photo
              report each visit. Month to month. No contracts, no cancellation fees.
            </p>
          </div>

          <div className="reveal-item overflow-x-auto border border-[var(--ch-hairline)] bg-white p-4 md:p-9">
            <table
              className="w-full border-collapse text-sm"
              aria-label="Coastal Home Management 30A service plan comparison"
            >
              <caption className="sr-only">
                Comparison of Essential, Home Watch, and Coastal Elite monthly management plans
              </caption>
              <thead>
                <tr className="border-b border-[var(--ch-ink)] text-left">
                  <th scope="col" className="w-1/2 py-5 pr-6">
                    <span className="ch-label">What&apos;s included</span>
                  </th>
                  {[
                    ["Essential", "$200"],
                    ["Home Watch", "$350"],
                    ["Coastal Elite", "$600"],
                  ].map(([name, price]) => (
                    <th key={name} scope="col" className="px-3 py-5 text-center align-bottom">
                      <span
                        className="block text-[15px] uppercase leading-tight tracking-[-0.01em] text-[var(--ch-ink)]"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontVariationSettings: "'wdth' 104, 'wght' 620",
                        }}
                      >
                        {name}
                      </span>
                      <span className="mt-1.5 block text-[12px] font-normal text-[var(--ch-muted)]">
                        {price}/mo
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ch-hairline)] text-[var(--ch-muted)]">
                {(
                  [
                    ["Weekly walkthrough, interior & exterior", true, true, true],
                    ["Issue alerts sent immediately", true, true, true],
                    ["Photo documentation after every visit", true, true, true],
                    ["Written visit report", true, true, true],
                    ["Mail pickup every visit", true, true, true],
                    ["Trash out & return (on request)", true, true, true],
                    ["Secure key holding & access coordination", true, true, true],
                    ["Appliance & piping checks each visit", false, true, true],
                    ["Irrigation filter cleaning", false, true, true],
                    ["Storm & freeze monitoring", false, false, true],
                    ["HVAC filter changes (every unit)", false, false, true],
                    ["Pre-arrival walkthrough & A/C pre-set", false, false, true],
                    ["Post-departure secure check", false, false, true],
                    ["Contractor coordination & on-call access", false, false, true],
                  ] as Array<[string, boolean, boolean, boolean]>
                ).map(([feature, std, prem, elite]) => (
                  <tr key={feature}>
                    <td className="py-3.5 pr-6 text-[13.5px] text-[var(--ch-ink)]">{feature}</td>
                    {[std, prem, elite].map((on, i) => (
                      <td key={i} className="px-3 py-3.5 text-center">
                        {on ? (
                          <svg
                            width="14"
                            height="11"
                            viewBox="0 0 14 11"
                            fill="none"
                            className="mx-auto"
                            aria-label="Included"
                            role="img"
                          >
                            <path d="M1 5.5L5 9.5L13 1" stroke="var(--ch-teal)" strokeWidth="1.7" />
                          </svg>
                        ) : (
                          <span aria-label="Not included" className="text-[var(--ch-hairline-2)]">
                            &ndash;
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="reveal-item mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <BookButton source="pricing-table" className="ch-btn ch-btn--teal">
              Book a Free Walkthrough
            </BookButton>
            <Link href="/pricing" className="ch-link">
              Full pricing details &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ══════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ═══ FAQ ═══════════════════════════════════════════════════ */}
      <section id="faq" className="fade-section bg-[var(--ch-paper-alt)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="ch-eyebrow reveal-item">07 · Questions</p>
            <h2 className="ch-display">
              <span className="ch-mask">
                <span>Everything</span>
              </span>
              <span className="ch-mask">
                <span>owners ask.</span>
              </span>
            </h2>
            <p className="ch-lede reveal-item mt-6">
              Still not sure? Call and ask. I&apos;d rather talk it through than have you guess.
            </p>
            <div className="reveal-item mt-8">
              <BookButton source="faq" className="ch-btn ch-btn--solid" />
            </div>
          </div>

          <div className="reveal-item border-t border-[var(--ch-hairline)]">
            <FaqAccordion items={FAQS} />
          </div>
        </div>

        {/* External authority links, real value for owners, real signal
            for crawlers. */}
        <div className="mx-auto mt-16 max-w-[1240px] border-t border-[var(--ch-hairline)] pt-10">
          <p className="ch-label mb-5">Useful resources for 30A homeowners</p>
          <div className="flex flex-col gap-4 text-[13.5px] text-[var(--ch-muted)] sm:flex-row sm:gap-8">
            {[
              ["https://www.co.walton.fl.us/", "Walton County, FL Government Site"],
              ["https://www.ready.gov/home", "FEMA Ready.gov Home Preparedness"],
              ["https://www.floridadisaster.org/", "Florida Division of Emergency Management"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--ch-hairline-2)] underline-offset-4 transition-colors hover:text-[var(--ch-teal)]"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICE AREA ══════════════════════════════════════════ */}
      <section className="fade-section bg-[var(--ch-paper)] px-4 py-24 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1000px] space-y-6 text-center">
          <p className="ch-eyebrow ch-eyebrow--center reveal-item">Coverage</p>
          <h2 className="ch-display ch-display--sm reveal-item">Where we work</h2>
          <p className="ch-label reveal-item !text-[var(--ch-soft)]">
            Watersound Origins · Alys · Rosemary · Scenic 30A
          </p>
          <div className="reveal-item pt-4">
            <ServiceAreaMapWrapper />
          </div>
        </div>
      </section>

      {/* ═══ ABOUT SPLIT ═══════════════════════════════════════════ */}
      <section id="about" className="about-section fade-section">
        <div className="about-inner">
          <div className="about-grid">
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

            <div className="about-copy">
              <h2 className="about-title">Why 30A second&#8209;home owners trust CHM.</h2>

              <p className="about-body">
                I&apos;m Ryder Schilling, founder of Coastal Home Management 30A. I handle
                high-trust home care for second-home owners with consistent check-ins, clear
                communication, and detailed reporting, so your property stays protected while
                you&apos;re away.
              </p>

              <ul className="about-list">
                <li>$10M+ in second-home real estate under care</li>
                <li>I live in the neighborhood, not an office</li>
                <li>Photo report after every single visit</li>
                <li>Insured Florida LLC, formed 2025</li>
                <li>Month to month, no contracts</li>
              </ul>

              <a href="#contact" className="about-cta">
                Work with me
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═════════════════════════════════════════════ */}
      <section
        id="contact"
        className="ch-deep-band ch-grid-tex fade-section relative overflow-hidden px-4 py-28 text-white md:px-8 md:py-40"
      >
        <div className="relative mx-auto max-w-[1240px] text-center">
          <p className="ch-eyebrow ch-eyebrow--center ch-eyebrow--light reveal-item">Get started</p>

          <h2 className="ch-mega ch-mega--light mx-auto mb-10 max-w-[15ch]">
            <span className="ch-mask">
              <span>Your house,</span>
            </span>
            <span className="ch-mask">
              <span>looked after</span>
            </span>
            <span className="ch-mask">
              <span className="text-[var(--ch-teal-bright)]">properly.</span>
            </span>
          </h2>

          <p className="ch-lede ch-lede--light reveal-item mx-auto mb-12 mt-10 text-center">
            The first walkthrough is free, and you do not need to be in Florida for it. Send me
            your address, I&apos;ll walk your home this week and email you photos and a written
            condition report within 48 hours. The report is yours to keep either way.
          </p>

          <div className="reveal-item flex flex-col items-center justify-center gap-4 sm:flex-row">
            <BookButton source="final-cta" className="ch-btn ch-btn--light" />
            <a
              href={`mailto:${siteData.contactEmail}`}
              className="ch-link ch-link--light"
            >
              Or email Ryder &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ═══ RELATED SERVICES ══════════════════════════════════════ */}
      <section className="border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-14 md:px-8">
        <div className="mx-auto max-w-[1240px]">
          <p className="ch-label mb-6">Explore</p>
          <div className="flex flex-wrap gap-2.5">
            {[
              ["/second-home-management-inlet-beach", "Second Home Management"],
              ["/home-watch", "Home Watch"],
              ["/home-watch-watersound-origins", "Home Watch · Watersound Origins"],
              ["/home-watch-naturewalk", "Home Watch · Naturewalk"],
              ["/home-watch-inlet-beach", "Home Watch · Inlet Beach"],
              ["/concierge-services-inlet-beach", "Concierge Services"],
              ["/mail-package-handling-inlet-beach", "Mail & Package Handling"],
              ["/home-check-services-30a", "Home Check Services"],
              ["/pricing", "Service Plans & Pricing"],
              ["/choosing-a-home-watch-company-30a", "How to Choose a Home Watch Company"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="border border-[var(--ch-hairline-2)] px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[var(--ch-muted)] transition-colors duration-300 hover:border-[var(--ch-ink)] hover:text-[var(--ch-ink)]"
                style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 94, 'wght' 560" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STRUCTURED DATA
          Kept verbatim from the previous build and extended. These
          blocks are why CHM currently wins "second home management
          Watersound Origins" in AI Overviews, do not trim them.
          ═══════════════════════════════════════════════════════════ */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://coastalhomemngt30a.com/#business",
            name: "Coastal Home Management 30A",
            description:
              "Coastal Home Management 30A provides second home management and home watch services for second-home owners in Watersound Origins, Alys, Rosemary, and scenic 30A in Florida. Actively manages more than $10 million in second home real estate across 15+ active client properties. Services include weekly property checks, photo documentation, mail handling, arrival prep, contractor coordination, and on-call concierge tasks. Rated 5.0 on Google. Founded 2025, fully insured Florida LLC.",
            sameAs: [
              "https://www.google.com/maps/place/Coastal+Home+Management+30A",
              "https://www.facebook.com/profile.php?id=61575773416368",
              "https://www.linkedin.com/company/coastal-home-management-30a/",
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How Second Home Management Works on 30A, Coastal Home Management",
            description:
              "A step-by-step guide to how Coastal Home Management 30A handles home watch and property care for second-home owners in Watersound Origins, Alys, Rosemary, and scenic 30A, Florida.",
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
                name: "Tell us about your property",
                text: "Send your address or call Ryder directly. You do not need to be in town for the first walkthrough. He walks the property, emails photos and a written condition report within 48 hours, and tells you what it actually needs. No sales call. Most clients are set up within a few days.",
                url: "https://coastalhomemngt30a.com/#how-it-works",
              },
              {
                "@type": "HowToStep",
                position: 2,
                name: "We document your property once",
                text: "We record key access, gate codes, HVAC preferences, emergency contacts, and any specific concerns. Everything is logged so nothing gets missed and you never have to explain it twice.",
                url: "https://coastalhomemngt30a.com/#how-it-works",
              },
              {
                "@type": "HowToStep",
                position: 3,
                name: "Visits begin on your schedule",
                text: "On a weekly or bi-weekly schedule we walk your property inside and out: HVAC, plumbing, irrigation, entry points, exterior condition, and any sign of water intrusion, and photograph everything. Storm events trigger unscheduled visits at no extra charge on Elite plans.",
                url: "https://coastalhomemngt30a.com/#how-it-works",
              },
              {
                "@type": "HowToStep",
                position: 4,
                name: "You receive a report after every visit",
                text: "After each visit you receive photos and a written summary by text or email the same day. If anything needs attention we handle it immediately or coordinate the right contractor. You stay in the loop without having to be there.",
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
                  text: "We provide regular, documented property care for second-home and vacation homeowners in Watersound Origins, Alys, Rosemary, and scenic 30A. Every visit includes a full walk-through, photo documentation, and a summary report sent directly to you. We also handle on-call tasks, mail pickup, trash service, contractor coordination, and arrival prep.",
                },
              },
              {
                "@type": "Question",
                name: "What is home watch, and is it different from property management?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Home watch is the scheduled checking of an unoccupied home: someone physically walks the property inside and out on a set schedule, checks the systems, and reports what they find. Traditional property management usually means managing tenants or rental bookings. Coastal Home Management 30A is a home watch and second home management service in Watersound Origins, Alys, Rosemary, and scenic 30A. We look after your home for you rather than renting it out.",
                },
              },
              {
                "@type": "Question",
                name: "What areas do you serve?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "We serve Watersound Origins, Alys, Rosemary, and scenic 30A in the Florida Panhandle, including Inlet Beach, Naturewalk, Seacrest, and the surrounding communities.",
                },
              },
              {
                "@type": "Question",
                name: "How much does home watch cost in 30A?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Monthly home watch and second home management plans start at $200/month (Essential), $350/month (Home Watch), and $600/month for the Coastal Elite membership. A 6-month rate lock saves 5% and a 12-month rate lock saves 10%, both billed monthly. On-call services are $75 base plus $45/hour. Mail or trash handling is $35/day.",
                },
              },
              {
                "@type": "Question",
                name: "What happens during a property visit?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Every visit includes a full interior and exterior walk-through checking HVAC, irrigation, entry points, exterior condition, and signs of water intrusion or storm damage. We photograph each visit and send a written summary by text or email the same day.",
                },
              },
              {
                "@type": "Question",
                name: "Are you licensed and insured?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Coastal Home Management 30A is a fully insured Florida LLC, formed in October 2025.",
                },
              },
              {
                "@type": "Question",
                name: "What makes CHM different from a large property management company?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You get Ryder directly. No call centers, no rotating staff. He lives in Watersound Origins, so when something happens at your property it gets handled fast by someone who knows your home personally.",
                },
              },
              {
                "@type": "Question",
                name: "How do I get started?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Send your address on the website or call directly. You do not need to be in town. Ryder walks the property and emails photos and a written condition report within 48 hours. Most clients receive their first visit report within a few days.",
                },
              },
              {
                "@type": "Question",
                name: "Who provides home watch services in Watersound Origins Florida?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Coastal Home Management 30A, founded by Ryder Schilling (a full-time Watersound Origins resident) is the dedicated home watch and second home management provider serving Watersound Origins, Naturewalk at Watersound, and Inlet Beach along 30A. Services include weekly home watch visits, photo reports, storm preparation, and complete property oversight for second-home owners.",
                },
              },
              {
                "@type": "Question",
                name: "What is the best home watch service near Inlet Beach or 30A?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Coastal Home Management 30A is rated 5.0 on Google and is the only home watch provider that actually lives in Watersound Origins. Ryder Schilling personally visits every property. No subcontractors, no rotating staff, no call center. Service area covers Watersound Origins, Naturewalk, Inlet Beach, Alys Beach, and Rosemary Beach.",
                },
              },
              {
                "@type": "Question",
                name: "Who manages second homes in Watersound Origins Florida?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Coastal Home Management 30A manages second homes in Watersound Origins, Florida. Owner Ryder Schilling lives in the community and provides personal, high-trust property care including home watch visits, mail handling, storm prep, HVAC monitoring, and concierge services. Currently managing over $10 million in second home real estate across Watersound Origins and Inlet Beach.",
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
    </main>
  );
}
