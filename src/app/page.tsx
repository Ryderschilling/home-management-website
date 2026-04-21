import Link from "next/link";
import { siteData } from "@/data/siteData";
import TestimonialsSection from "@/components/TestimonialsSection";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import FadeInObserver from "@/components/FadeInObserver";

export default function HomePage() {

  return (
    <main className="min-h-screen font-sans bg-black text-black">
      <FadeInObserver />
      <LeadCapturePopup />
      {/* Sticky nav */}
      <nav className="fixed top-0 w-full z-50 bg-transparent px-4 md:px-6 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Smaller logo */}
          <img
            src="/logo.png"
            alt="Coastal Home Management 30A logo"
            draggable={false}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-10 w-auto"
          />

          {/* Smaller brand text */}
          <span className="hidden md:inline text-base font-serif">
            {siteData.businessName}
          </span>
        </div>

        <div className="space-x-6">
          <a
            href="#services"
            className="text-[11px] uppercase tracking-widest hover:underline"
          >
            Services
          </a>
          <Link
            href="/pricing"
            className="text-[11px] uppercase tracking-widest hover:underline"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-[11px] uppercase tracking-widest hover:underline"
          >
            About
          </Link>
          <a
            href="#contact"
            className="text-[11px] uppercase tracking-widest hover:underline"
          >
            Contact
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero relative h-screen overflow-hidden text-white">
        {/* Background image */}
        <img
          src="/img.png"
          alt="Luxury second home in Watersound Origins, Florida — managed by Coastal Home Management 30A"
          draggable={false}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="hero-bg absolute inset-0 h-full w-full object-cover"
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
  <span>SECOND HOME MANAGEMENT</span>
  <span className="pipe">|</span>
  <span>CONCIERGE</span>
  <span className="pipe">|</span>
  <span>LOCAL</span>
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
                Our monthly management plans start at $150/month (Standard) and go up to $650/month
                for our Coastal Elite membership. We also offer on-call services at $85 base plus
                $50/hour, and mail or trash handling at $35/day. Visit our{" "}
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
                Walton County, Florida (Official)
              </a>
              <a
                href="https://www.30a.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black underline transition"
              >
                Scenic 30A Community
              </a>
              <a
                href="https://www.myfloridalicense.com/intentions2.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black underline transition"
              >
                Florida Licensed Contractor Verification
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
                  text: "Monthly management plans start at $150/month (Standard) and go up to $650/month for the Coastal Elite membership. On-call services are $85 base plus $50/hour. Mail or trash handling is $35/day.",
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
                <li>Local business</li>
                <li>Weekly reports with photos</li>
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

{/* Footer */}
<footer className="border-t border-gray-200 bg-white">
  <div className="mx-auto max-w-6xl px-6 py-14">
    <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
    <div>
  <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
    Services
  </div>
  <ul className="mt-4 space-y-3 text-sm text-gray-700">
    <li>
      <Link
        href="/second-home-management-inlet-beach"
        className="transition hover:text-black"
      >
        Second Home Management
      </Link>
    </li>
    <li>
      <Link
        href="/concierge-services-inlet-beach"
        className="transition hover:text-black"
      >
        Concierge Services
      </Link>
    </li>
    <li>
      <Link
        href="/mail-package-handling-inlet-beach"
        className="transition hover:text-black"
      >
        Mail &amp; Package Handling
      </Link>
    </li>
    <li>
      <Link
        href="/home-check-services-30a"
        className="transition hover:text-black"
      >
        Home Checks
      </Link>
    </li>
    <li>
      <Link
        href="/pricing"
        className="transition hover:text-black font-medium"
      >
        Pricing &amp; Plans
      </Link>
    </li>
  </ul>
</div>

      <div>
        <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
          Company
        </div>
        <ul className="mt-4 space-y-3 text-sm text-gray-700">
          <li>
            <Link href="/about" className="transition hover:text-black">
              About CHM
            </Link>
          </li>
          <li>Local &amp; Insured</li>
          <li>Serving Inlet Beach &amp; 30A</li>
          <li>Reliable, high-trust service</li>
        </ul>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
          Contact
        </div>
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <div>Inlet Beach, Florida</div>
          <a
            href={`mailto:${siteData.contactEmail}`}
            className="inline-block transition hover:text-black"
          >
            {siteData.contactEmail}
          </a>
          <div>
            <a
              href="/admin/login"
              className="text-gray-500 transition hover:text-black"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-500">
      © {new Date().getFullYear()} Coastal Home Management 30A. All rights
      reserved.
    </div>
  </div>
</footer>

    </main>
  );
}
