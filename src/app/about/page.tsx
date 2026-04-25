// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Coastal Home Management 30A | Property Management Experts",
  description:
    "Local, insured property management for 30A vacation rentals. Serving Watersound Origins, Naturewalk & Inlet Beach. Meet founder Ryder Schilling.",
  alternates: {
    canonical: "https://coastalhomemngt30a.com/about",
  },
  openGraph: {
    title: "About Coastal Home Management 30A | Property Management Experts",
    description:
      "Local, insured property management for 30A vacation rentals. Serving Watersound Origins, Naturewalk & Inlet Beach. Meet founder Ryder Schilling.",
    url: "https://coastalhomemngt30a.com/about",
    images: [
      {
        url: "https://coastalhomemngt30a.com/profile-web.jpg",
        width: 1200,
        height: 630,
        alt: "Ryder Schilling, founder of Coastal Home Management 30A",
      },
    ],
  },
};

// ─── Page-level JSON-LD ─────────────────────────────────────────────────────

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://coastalhomemngt30a.com/#organization",
  name: "Coastal Home Management 30A",
  alternateName: "CHM 30A",
  url: "https://coastalhomemngt30a.com",
  logo: {
    "@type": "ImageObject",
    url: "https://coastalhomemngt30a.com/logo.png",
    width: 400,
    height: 120,
  },
  image: "https://coastalhomemngt30a.com/profile-web.jpg",
  description:
    "Coastal Home Management 30A is a local, owner-operated, fully insured Florida LLC providing second-home management, property inspections, and concierge services for vacation homeowners along scenic 30A in the Florida Panhandle. Founded by Ryder Schilling in October 2025, the company serves Watersound Origins, Naturewalk at Seagrove, Inlet Beach, Rosemary Beach, WaterColor, Seaside, and surrounding 30A communities.",
  foundingDate: "2025-10",
  telephone: "+13094158793",
  email: "coastalhomemanagement30a@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Inlet Beach",
    addressRegion: "FL",
    postalCode: "32461",
    addressCountry: "US",
  },
  areaServed: [
    { "@type": "Place", name: "Watersound Origins" },
    { "@type": "Place", name: "Naturewalk at Seagrove" },
    { "@type": "Place", name: "Inlet Beach, Florida" },
    { "@type": "Place", name: "Rosemary Beach, Florida" },
    { "@type": "Place", name: "WaterColor, Florida" },
    { "@type": "Place", name: "Seaside, Florida" },
    { "@type": "Place", name: "Alys Beach, Florida" },
    { "@type": "Place", name: "Santa Rosa Beach, Florida" },
    { "@type": "Place", name: "Scenic 30A, Florida" },
    { "@type": "Place", name: "Emerald Coast, Florida" },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+13094158793",
    contactType: "customer service",
    email: "coastalhomemanagement30a@gmail.com",
    areaServed: "US",
    availableLanguage: "English",
  },
  founder: {
    "@type": "Person",
    "@id": "https://coastalhomemngt30a.com/about#ryder-schilling",
    name: "Ryder Schilling",
    jobTitle: "Founder & Owner",
  },
  sameAs: ["https://www.facebook.com/CoastalHomeManagement30A"],
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://coastalhomemngt30a.com/about#ryder-schilling",
  name: "Ryder Schilling",
  givenName: "Ryder",
  familyName: "Schilling",
  jobTitle: "Founder & Owner",
  description:
    "Ryder Schilling is the founder and owner of Coastal Home Management 30A. He has provided property care and home watch services for second-home owners in Watersound Origins and along scenic 30A since 2022, and formally incorporated the business as a licensed, insured Florida LLC in October 2025. He operates as a solo, locally-based operator serving the full 30A corridor in the Florida Panhandle.",
  worksFor: {
    "@type": "Organization",
    "@id": "https://coastalhomemngt30a.com/#organization",
    name: "Coastal Home Management 30A",
  },
  telephone: "+13094158793",
  email: "coastalhomemanagement30a@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Inlet Beach",
    addressRegion: "FL",
    postalCode: "32461",
    addressCountry: "US",
  },
  url: "https://coastalhomemngt30a.com/about",
  image: "https://coastalhomemngt30a.com/profile-web.jpg",
  sameAs: ["https://www.facebook.com/CoastalHomeManagement30A"],
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-black font-sans">

      {/* JSON-LD — Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* JSON-LD — Person (owner) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="fixed top-0 w-full z-50 bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex justify-between items-center"
      >
        <Link href="/" className="flex items-center space-x-3" aria-label="Coastal Home Management 30A — Home">
          <img
            src="/logo.png"
            alt="Coastal Home Management 30A logo"
            className="h-10 w-auto"
          />
          <span className="hidden md:inline text-base font-serif">
            Coastal Home Management 30A
          </span>
        </Link>
        <div className="space-x-6">
          <Link href="/#services" className="text-[11px] uppercase tracking-widest hover:underline">
            Services
          </Link>
          <Link href="/pricing" className="text-[11px] uppercase tracking-widest hover:underline">
            Pricing
          </Link>
          <Link href="/about" className="text-[11px] uppercase tracking-widest underline" aria-current="page">
            About
          </Link>
          <Link href="/#contact" className="text-[11px] uppercase tracking-widest hover:underline">
            Contact
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="about-hero-heading" className="pt-36 pb-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">About</p>
          <h1 id="about-hero-heading" className="text-4xl md:text-6xl font-serif leading-tight mb-8">
            Local care for second&#8209;home owners on 30A.
          </h1>
          <p className="text-xl md:text-2xl font-serif text-gray-700 leading-relaxed max-w-2xl">
            Coastal Home Management 30A is an owner-operated, fully insured Florida LLC providing
            vacation rental property management and home watch services along the Emerald Coast.
          </p>
        </div>
      </section>

      {/* ── What We Do ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="what-we-do-heading" className="py-16 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">What We Do</p>
            <h2 id="what-we-do-heading" className="text-3xl font-serif mb-6">
              Second-home management for 30A property owners.
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We provide weekly property inspections, photo documentation, and written reports so
              that second-home and vacation rental owners along 30A always know exactly what&apos;s
              happening at their property — even when they&apos;re a thousand miles away.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Beyond routine check-ins, we handle contractor coordination, storm response, mail and
              trash service, arrival prep, and on-call tasks. One point of contact. No call centers.
              No rotating staff.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Our Services</p>
            <ul className="space-y-4 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" aria-hidden="true" />
                <span><strong className="font-medium text-black">Monthly Management Plans</strong> — Standard, Premium, and Coastal Elite tiers with weekly or bi-weekly inspections and photo reports</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" aria-hidden="true" />
                <span><strong className="font-medium text-black">On-Call Property Tasks</strong> — contractor meetings, one-off errands, anything that comes up</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" aria-hidden="true" />
                <span><strong className="font-medium text-black">Mail &amp; Trash Handling</strong> — mail pickup and trash service while you&apos;re away</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" aria-hidden="true" />
                <span><strong className="font-medium text-black">Arrival Prep</strong> — A/C set, walk-through completed, and your home ready 24 hours before you arrive</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link
                href="/pricing"
                className="inline-flex border border-black px-6 py-3 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
              >
                View Pricing &amp; Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Service Plan Comparison Table ───────────────────────────────────── */}
      <section aria-labelledby="plans-table-heading" className="py-16 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Plans at a Glance</p>
          <h2 id="plans-table-heading" className="text-3xl font-serif mb-8">
            Second-home management plans for 30A property owners.
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" aria-label="Coastal Home Management 30A service plan comparison">
              <caption className="sr-only">
                Comparison of Standard, Premium, and Coastal Elite monthly management plans offered by Coastal Home Management 30A
              </caption>
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th scope="col" className="py-4 pr-6 font-serif text-base font-normal w-1/2">What&apos;s Included</th>
                  <th scope="col" className="py-4 px-4 font-serif text-base font-normal text-center">Standard<br /><span className="text-gray-500 text-xs font-sans">$150/mo</span></th>
                  <th scope="col" className="py-4 px-4 font-serif text-base font-normal text-center">Premium<br /><span className="text-gray-500 text-xs font-sans">$275/mo</span></th>
                  <th scope="col" className="py-4 px-4 font-serif text-base font-normal text-center">Coastal Elite<br /><span className="text-gray-500 text-xs font-sans">$650/mo</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {[
                  ["Weekly property inspection",           true,  true,  true],
                  ["Photo documentation every visit",      true,  true,  true],
                  ["Written visit summary (text/email)",   true,  true,  true],
                  ["Mail & package pickup",                true,  true,  true],
                  ["Storm watch & freeze alerts",          true,  true,  true],
                  ["Bi-weekly detailed photo report",      false, true,  true],
                  ["Seasonal maintenance checks",          false, true,  true],
                  ["1 on-call task/month included",        false, true,  true],
                  ["Contractor coordination",              false, true,  true],
                  ["Priority 4-hour response",             false, true,  true],
                  ["Guaranteed 2-hour emergency response", false, false, true],
                  ["3 on-call hours/month included",       false, false, true],
                  ["Arrival Prep 2×/year",                 false, false, true],
                  ["Quarterly Property Condition Report",  false, false, true],
                  ["Direct line to Ryder — no queue",      false, false, true],
                ].map(([feature, std, prem, elite]) => (
                  <tr key={feature as string}>
                    <td className="py-3 pr-6 text-gray-700">{feature as string}</td>
                    <td className="py-3 px-4 text-center">{std  ? <span aria-label="Included" className="text-black">✓</span> : <span aria-label="Not included" className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-4 text-center">{prem ? <span aria-label="Included" className="text-black">✓</span> : <span aria-label="Not included" className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-4 text-center">{elite? <span aria-label="Included" className="text-black">✓</span> : <span aria-label="Not included" className="text-gray-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black">
                  <td className="py-4 pr-6 font-serif text-base">Monthly price</td>
                  <td className="py-4 px-4 text-center font-serif text-base">$150</td>
                  <td className="py-4 px-4 text-center font-serif text-base">$275</td>
                  <td className="py-4 px-4 text-center font-serif text-base">$650</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-8 flex gap-6">
            <Link
              href="/pricing"
              className="inline-flex border border-black px-6 py-3 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
            >
              Full Pricing Details
            </Link>
            <a
              href="mailto:coastalhomemanagement30a@gmail.com"
              className="inline-flex px-6 py-3 text-xs uppercase tracking-widest text-gray-500 hover:text-black transition"
            >
              Questions? Email Ryder →
            </a>
          </div>
        </div>
      </section>

      {/* ── Story / Origin ──────────────────────────────────────────────────── */}
      <section aria-labelledby="story-heading" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <img
              src="/profile-web.jpg"
              alt="Ryder Schilling, founder of Coastal Home Management 30A, at a Watersound Origins property"
              className="w-full rounded-lg shadow-lg"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Our Story</p>
            <h2 id="story-heading" className="text-3xl font-serif mb-6">How CHM started.</h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              Coastal Home Management 30A grew out of something simple: neighbors in Watersound Origins
              needed someone they could trust to keep an eye on their homes while they were away. Starting
              around 2022, Ryder Schilling began doing exactly that — checking in, photographing, handling
              what came up, and reporting back. People kept asking, so he kept showing up.
            </p>
            <p className="text-gray-700 leading-relaxed mb-5">
              In October 2025, CHM was formally incorporated as a licensed, insured Florida LLC. The business
              is the same thing it always was — one local person doing this right — now backed by a proper
              structure, documented systems, and a dedicated platform for managing client properties and
              visit reports.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Today CHM serves second-home and vacation rental owners across Watersound Origins, Naturewalk,
              and the broader 30A corridor. The core commitment hasn&apos;t changed: be the person your
              clients can actually call.
            </p>
          </div>
        </div>
      </section>

      {/* ── Owner / Team ────────────────────────────────────────────────────── */}
      <section aria-labelledby="team-heading" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">The Team</p>
          <h2 id="team-heading" className="text-3xl font-serif mb-12">Who&apos;s behind CHM.</h2>

          <article
            aria-label="Ryder Schilling, Founder and Owner"
            className="flex flex-col md:flex-row gap-10 items-start border border-gray-100 p-8"
          >
            <div className="flex-shrink-0">
              <img
                src="/profile-web.jpg"
                alt="Ryder Schilling"
                className="w-32 h-32 object-cover rounded-full"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <h3 className="text-2xl font-serif mb-1">Ryder Schilling</h3>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-5">Founder &amp; Owner — Coastal Home Management 30A</p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ryder has been providing property care for second-home owners in Watersound Origins
                since 2022. He started by helping neighbors who needed someone reliable on the ground
                in Florida when they couldn&apos;t be there — someone to check in, catch problems early,
                and communicate clearly.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                He formally launched Coastal Home Management 30A as a Florida LLC in October 2025.
                He handles every client personally — no subcontractors, no middlemen — and operates
                out of the same communities he serves. Ryder is the one who answers the phone, does
                the walk-through, takes the photos, and sends the report.
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-gray-600 mt-6">
                <a
                  href="tel:+13094158793"
                  className="hover:text-black transition underline"
                >
                  (309) 415-8793
                </a>
                <a
                  href="mailto:coastalhomemanagement30a@gmail.com"
                  className="hover:text-black transition underline"
                >
                  coastalhomemanagement30a@gmail.com
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ── Credentials / Trust Signals ─────────────────────────────────────── */}
      <section aria-labelledby="credentials-heading" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Credentials &amp; Trust</p>
          <h2 id="credentials-heading" className="text-3xl font-serif mb-12">
            Why homeowners trust CHM.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="text-4xl font-serif mb-3">3+</div>
              <h3 className="text-base font-serif mb-2">Years of Local Property Experience</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ryder has been providing property care for Watersound Origins homeowners since 2022 —
                well before CHM was formally incorporated. He knows these neighborhoods, these homes,
                and the local trade network.
              </p>
            </div>
            <div>
              <div className="text-4xl font-serif mb-3">FL LLC</div>
              <h3 className="text-base font-serif mb-2">Licensed &amp; Insured Florida LLC</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Coastal Home Management 30A is a fully insured Florida limited liability company,
                incorporated in October 2025. Clients can have confidence that their properties
                are in professional, covered hands.
              </p>
            </div>
            <div>
              <div className="text-4xl font-serif mb-3">1:1</div>
              <h3 className="text-base font-serif mb-2">Direct Owner Relationship</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every client works directly with Ryder. No call centers, no rotating employees,
                no one else walking through your home. The person you hire is the person who
                shows up — every time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
            <div>
              <h3 className="text-base font-serif mb-2">Photo-Documented Every Visit</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every property inspection is photographed and reported in writing. You receive a
                visit summary after every check-in — a verifiable record of your home&apos;s condition
                that no large management company consistently provides.
              </p>
            </div>
            <div>
              <h3 className="text-base font-serif mb-2">Storm &amp; Emergency Response</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                CHM monitors active weather events and conducts unscheduled visits when conditions
                warrant. Elite clients receive a guaranteed 2-hour emergency response and immediate
                direct communication with Ryder.
              </p>
            </div>
            <div>
              <h3 className="text-base font-serif mb-2">Local Contractor Network</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ryder serves as the on-the-ground point of contact for all trades. When your property
                needs a repair, he coordinates the contractor, oversees the visit, and reports back —
                so you never have to manage logistics from out of state.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Service Area ────────────────────────────────────────────────────── */}
      <section aria-labelledby="service-area-heading" className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Where We Operate</p>
          <h2 id="service-area-heading" className="text-3xl font-serif mb-6">Service Area</h2>
          <p className="text-gray-300 max-w-2xl mb-10 leading-relaxed">
            Coastal Home Management 30A operates along the full Emerald Coast 30A corridor in the
            Florida Panhandle. Primary coverage is Watersound Origins and Naturewalk at Seagrove,
            with service extending across the following communities:
          </p>

          <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-200 mb-12" aria-label="Communities served">
            {[
              "Watersound Origins",
              "Naturewalk at Seagrove",
              "Inlet Beach",
              "Rosemary Beach",
              "Alys Beach",
              "WaterColor",
              "Seaside",
              "Seagrove Beach",
              "Grayton Beach",
              "Blue Mountain Beach",
              "Dune Allen Beach",
              "Santa Rosa Beach",
            ].map((place) => (
              <li key={place} className="flex items-center gap-2">
                <span className="h-1 w-3 bg-gray-500 flex-shrink-0" aria-hidden="true" />
                {place}
              </li>
            ))}
          </ul>

          <p className="text-gray-400 text-sm mb-8">
            Not sure if your property falls within our coverage area? Reach out — we&apos;re happy to confirm.
          </p>
          <a
            href="mailto:coastalhomemanagement30a@gmail.com"
            className="inline-flex border border-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition"
          >
            Inquire About Your Property
          </a>
        </div>
      </section>

      {/* ── Why Choose CHM ──────────────────────────────────────────────────── */}
      <section aria-labelledby="differentiators-heading" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">The Difference</p>
          <h2 id="differentiators-heading" className="text-3xl font-serif mb-10">
            What sets CHM apart from large property management companies.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-lg font-serif mb-3">You Get Me Directly</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                No call centers. No rotating staff. When you reach out, you reach Ryder. When
                something needs attention at your property, it gets handled by someone who knows
                your home personally — not a dispatched employee seeing it for the first time.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-serif mb-3">Documented Every Visit</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every property visit is photographed and reported in writing. You get a visit
                summary after every check-in so you always know exactly what&apos;s going on —
                even when you&apos;re in Chicago, Indianapolis, or Nashville.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-serif mb-3">Local, Insured, and Accountable</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                CHM is a fully insured Florida LLC operating in the communities it serves. Ryder
                lives and works here — this isn&apos;t a remote operation or a franchise. Your
                property is covered and your care is consistent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── External Authority Links ────────────────────────────────────────── */}
      <section aria-labelledby="resources-heading" className="py-16 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-5">
            Resources for 30A Property Owners
          </p>
          <h2 id="resources-heading" className="sr-only">Useful resources for second-home owners on 30A</h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-5 text-sm text-gray-600">
            <a
              href="https://www.co.walton.fl.us/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black underline transition"
            >
              Walton County, FL — Official Government Site
            </a>
            <a
              href="https://www.floridadisaster.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black underline transition"
            >
              Florida Division of Emergency Management
            </a>
            <a
              href="https://www.ready.gov/home"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black underline transition"
            >
              FEMA Ready.gov — Home Preparedness Guide
            </a>
            <a
              href="https://www.myfloridalicense.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black underline transition"
            >
              Florida DBPR — License Verification
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="cta-heading" className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-serif mb-5">
            Ready to protect your 30A property?
          </h2>
          <p className="text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
            Reach out directly. We&apos;ll talk through your property, your schedule, and what
            level of care makes sense. Most clients are set up within a few days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:coastalhomemanagement30a@gmail.com"
              className="inline-flex border border-black px-8 py-3 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
            >
              Email Ryder
            </a>
            <a
              href="tel:+13094158793"
              className="inline-flex border border-gray-300 px-8 py-3 text-xs uppercase tracking-widest hover:border-black transition text-gray-600 hover:text-black"
            >
              (309) 415-8793
            </a>
          </div>
          <p className="mt-8 text-xs text-gray-400 uppercase tracking-widest">
            Serving Watersound Origins · Naturewalk · Inlet Beach · Rosemary Beach · WaterColor · Seaside · 30A
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="text-sm text-gray-600">
            <div className="font-serif text-black mb-2">Coastal Home Management 30A</div>
            <div>Inlet Beach, FL 32461</div>
            <a
              href="mailto:coastalhomemanagement30a@gmail.com"
              className="hover:text-black transition"
            >
              coastalhomemanagement30a@gmail.com
            </a>
          </div>
          <div className="flex gap-8 text-sm text-gray-600">
            <Link href="/" className="hover:text-black transition">Home</Link>
            <Link href="/pricing" className="hover:text-black transition">Pricing</Link>
            <Link href="/about" className="hover:text-black transition">About</Link>
          </div>
        </div>
        <div className="border-t border-gray-100 px-6 py-4 text-xs text-gray-400 max-w-6xl mx-auto">
          © {new Date().getFullYear()} Coastal Home Management 30A LLC. All rights reserved.
        </div>
      </footer>

    </main>
  );
}
