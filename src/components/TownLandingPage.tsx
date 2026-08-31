import Link from "next/link";
import type { TownPageData } from "@/data/townPages";

const SITE = "https://coastalhomemngt30a.com";
const PHONE_DISPLAY = "(309) 415-8793";
const PHONE_TEL = "3094158793";
const EMAIL = "coastalhomemanagement30a@gmail.com";

const SERIF = {
  fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
} as const;

const PLANS = [
  {
    name: "Essential",
    price: "$200/mo",
    features: [
      "Weekly walkthrough, interior and exterior",
      "Photo documentation every visit",
      "Written report after each check",
      "Mail and package handling",
      "Issue alerts and key holding",
    ],
  },
  {
    name: "Home Watch",
    price: "$350/mo",
    featured: true,
    features: [
      "Everything in Essential",
      "Appliance and plumbing checks",
      "Irrigation filter cleaning",
      "Detailed written condition reports",
      "Weekly or bi-weekly schedule",
    ],
  },
  {
    name: "Coastal Elite",
    price: "$600/mo",
    features: [
      "Everything in Home Watch",
      "HVAC filter changes",
      "Storm and freeze monitoring",
      "Pre-arrival prep and A/C preset",
      "Contractor coordination",
    ],
  },
];

export default function TownLandingPage({ town }: { town: TownPageData }) {
  const url = `${SITE}/${town.slug}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: town.faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Home Watch",
    name: `Home Watch in ${town.town}, Florida`,
    description: town.directAnswer,
    url,
    provider: {
      "@type": "LocalBusiness",
      name: "Coastal Home Management 30A",
      url: SITE,
      telephone: "+13094158793",
      email: EMAIL,
      priceRange: "$200-$600/month",
      image: `${SITE}/img.png`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Inlet Beach",
        addressRegion: "FL",
        postalCode: "32461",
        addressCountry: "US",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        bestRating: "5",
        reviewCount: "4",
      },
    },
    areaServed: [
      {
        "@type": "City",
        name: town.town,
        address: {
          "@type": "PostalAddress",
          addressLocality: town.town,
          addressRegion: "FL",
          postalCode: town.zips[0],
          addressCountry: "US",
        },
      },
      ...town.neighborhoods.map((n) => ({ "@type": "Place", name: n })),
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Home watch plans for ${town.town}`,
      itemListElement: PLANS.map((p) => ({
        "@type": "Offer",
        name: p.name,
        price: p.price.replace(/[^0-9]/g, ""),
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: p.price.replace(/[^0-9]/g, ""),
          priceCurrency: "USD",
          unitText: "MONTH",
        },
      })),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Home Watch", item: `${SITE}/home-watch` },
      { "@type": "ListItem", position: 3, name: `Home Watch in ${town.town}`, item: url },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-black font-sans">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-black/10 px-5 py-3">
        <ol className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-black/40">
          <li>
            <Link href="/" className="transition hover:text-black">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/home-watch" className="transition hover:text-black">
              Home Watch
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-black/70">{town.town}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pt-14 pb-14 md:pt-20 md:pb-20">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
          {town.eyebrow}
        </p>
        <h1
          className="mb-6 max-w-3xl text-4xl leading-[1.05] tracking-tight text-black md:text-5xl"
          style={SERIF}
        >
          {town.h1}
        </h1>
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-black/60">{town.heroLead}</p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Home watch in ${town.town}`)}`}
            className="inline-block bg-black px-8 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
          >
            Get a Free Walkthrough
          </a>
          <a
            href={`tel:${PHONE_TEL}`}
            className="inline-block border border-black px-8 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
          >
            Call {PHONE_DISPLAY}
          </a>
        </div>
      </section>

      {/* Direct answer + fast facts. Written to be quotable by AI answer engines. */}
      <section className="border-y border-black/10 bg-[#fafaf8] px-5 py-14 md:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
            Home watch in {town.town}, in short
          </h2>
          <p className="mb-10 max-w-3xl text-lg leading-relaxed text-black/80" style={SERIF}>
            {town.directAnswer}
          </p>
          <dl className="grid gap-x-8 gap-y-6 border-t border-black/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Service area", v: `${town.town}, ${town.county}, FL ${town.zips.join(" / ")}` },
              {
                k: "Distance from owner",
                v: `About ${town.driveMinutes} minutes from Watersound Origins`,
              },
              { k: "Visit schedule", v: "Weekly or bi-weekly, on a fixed day" },
              { k: "Plans", v: "$200, $350 and $600 per month. No contract." },
              { k: "Proof of visit", v: "Photographs and a written report after every check" },
              { k: "Storm and freeze", v: "Pre-storm and post-storm checks, same-day photos" },
              { k: "Insured", v: "Fully insured Florida LLC, founded October 2025" },
              { k: "Who shows up", v: "Ryder Schilling, the owner. No subcontractors." },
            ].map((row) => (
              <div key={row.k}>
                <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
                  {row.k}
                </dt>
                <dd className="text-sm leading-relaxed text-black/70">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Housing stock */}
      <section className="mx-auto max-w-3xl px-5 py-16 md:py-20">
        <h2 className="mb-8 text-3xl tracking-tight text-black md:text-4xl" style={SERIF}>
          What {town.town} homes are actually like
        </h2>
        <div className="space-y-5">
          {town.housingStock.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-black/65">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* Failure modes */}
      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-3xl tracking-tight text-black md:text-4xl" style={SERIF}>
            What goes wrong in an empty {town.townShort} home
          </h2>
          <p className="mb-10 max-w-2xl text-sm leading-relaxed text-black/50">
            Every town on this coast fails differently. These are the specific things we look for on
            a {town.town} property, and the reason a generic checklist misses them.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {town.failureModes.map((f) => (
              <div key={f.title} className="border border-black/10 bg-white p-7">
                <h3 className="mb-3 text-lg font-semibold text-black">{f.title}</h3>
                <p className="text-sm leading-relaxed text-black/60">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why CHM */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
        <h2 className="mb-10 text-3xl tracking-tight text-black md:text-4xl" style={SERIF}>
          Why {town.townShort} owners hire us
        </h2>
        <div className="grid gap-10 md:grid-cols-2">
          {[
            {
              title: "One person, every visit",
              body: `Ryder Schilling owns the business and does the work. No rotating crews, no dispatchers, no wondering which technician was at your ${town.townShort} house. You have his cell number.`,
            },
            {
              title: "Photo proof, every single time",
              body: "After every walkthrough you get photographs and a written summary by text or email. You never have to take our word that somebody showed up, and you have a dated record of your property's condition.",
            },
            {
              title: `${town.driveMinutes} minutes away, not a territory`,
              body: `The owner lives in Watersound Origins, about ${town.driveMinutes} minutes from ${town.town}. This is a 30A business serving 30A, not a franchise covering three counties from an office you will never see.`,
            },
            {
              title: "No contracts, ever",
              body: "Month to month by default. If you want a better rate you can lock 6 or 12 months and save up to 10 percent, but that is your choice and not a condition of getting started.",
            },
          ].map((p) => (
            <div key={p.title} className="border border-black/10 p-7">
              <h3 className="mb-3 text-lg font-semibold text-black">{p.title}</h3>
              <p className="text-sm leading-relaxed text-black/60">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-3xl tracking-tight text-black md:text-4xl" style={SERIF}>
            Home watch plans for {town.town}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`border p-7 ${
                  plan.featured ? "border-black bg-black text-white" : "border-black/10 bg-white"
                }`}
              >
                <p
                  className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                    plan.featured ? "text-white/50" : "text-black/40"
                  }`}
                >
                  {plan.name}
                </p>
                <p
                  className={`mb-6 text-3xl ${plan.featured ? "text-white" : "text-black"}`}
                  style={SERIF}
                >
                  {plan.price}
                </p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`text-sm leading-relaxed ${
                        plan.featured ? "text-white/75" : "text-black/60"
                      }`}
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-black/40">
            Same published pricing in every town we serve. No contracts, no cancellation fees. Lock a
            6 or 12 month rate and save up to 10 percent.{" "}
            <Link href="/pricing" className="underline transition hover:text-black">
              Full pricing breakdown
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Service area */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
        <h2 className="mb-10 text-3xl tracking-tight text-black md:text-4xl" style={SERIF}>
          Where we work in {town.town}
        </h2>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
              Neighborhoods and streets
            </h3>
            <ul className="space-y-2">
              {town.neighborhoods.map((n) => (
                <li key={n} className="text-sm leading-relaxed text-black/65">
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
              Landmarks nearby
            </h3>
            <ul className="space-y-2">
              {town.landmarks.map((l) => (
                <li key={l} className="text-sm leading-relaxed text-black/65">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-black/10 bg-white px-5 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-3xl tracking-tight text-black md:text-4xl" style={SERIF}>
            Questions about home watch in {town.town}
          </h2>
          <div className="space-y-8">
            {town.faqs.map(({ q, a }) => (
              <div key={q} className="border-b border-black/10 pb-8">
                <h3 className="mb-3 text-base font-semibold text-black">{q}</h3>
                <p className="text-sm leading-relaxed text-black/60">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-16 text-center md:py-20">
        <h2 className="mb-4 text-3xl tracking-tight text-black md:text-4xl" style={SERIF}>
          Ready to have eyes on your {town.townShort} home?
        </h2>
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-black/60">
          Free walkthrough, no commitment. We look at the property, tell you what it actually needs,
          and you decide from there.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Home watch in ${town.town}`)}`}
            className="inline-block bg-black px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
          >
            Get My Free Walkthrough
          </a>
          <a
            href={`tel:${PHONE_TEL}`}
            className="inline-block border border-black px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
          >
            Call {PHONE_DISPLAY}
          </a>
        </div>
      </section>

      {/* Related */}
      <section className="border-t border-black/10 bg-white px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-black/40">
            Home watch in nearby towns
          </p>
          <div className="flex flex-wrap gap-3">
            {town.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 transition hover:border-black hover:text-black"
              >
                {r.label}
              </Link>
            ))}
            <Link
              href="/service-areas"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 transition hover:border-black hover:text-black"
            >
              All Service Areas
            </Link>
            <Link
              href="/pricing"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 transition hover:border-black hover:text-black"
            >
              Pricing and Plans
            </Link>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </main>
  );
}
