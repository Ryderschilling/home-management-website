import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home Watch Service Naturewalk at Watersound Origins | Coastal Home Management 30A",
  description:
    "Home watch and second-home care for Naturewalk at Watersound Origins. Local, insured, weekly inspections, photo reports after every visit. Ryder Schilling lives steps away. Free walkthrough.",
  alternates: { canonical: "https://coastalhomemngt30a.com/home-watch-naturewalk" },
  keywords: "home watch Naturewalk, Naturewalk Watersound Origins home watch, property watch Naturewalk Florida, second home care Naturewalk Inlet Beach, home management Naturewalk 30A",
  openGraph: {
    title: "Home Watch — Naturewalk at Watersound Origins | CHM 30A",
    description: "Local, insured home watch for Naturewalk at Watersound Origins. Weekly inspections, photo proof, storm checks. Free walkthrough.",
    url: "https://coastalhomemngt30a.com/home-watch-naturewalk",
    images: ["/img.png"],
  },
};

const FAQ = [
  {
    q: "Who checks on vacation homes in Naturewalk at Watersound Origins when owners are away?",
    a: "Coastal Home Management 30A provides dedicated home watch services for second-home owners in Naturewalk at Watersound Origins. Ryder Schilling — a full-time resident of the Watersound Origins community — personally conducts every inspection, photographs the property, and sends a written report after each visit.",
  },
  {
    q: "Does CHM serve Naturewalk at Watersound Origins specifically?",
    a: "Yes. Naturewalk at Watersound Origins is one of our primary service communities. We actively manage second homes throughout Naturewalk with weekly and bi-weekly scheduled visits, storm checks, mail pickup, and full property oversight.",
  },
  {
    q: "What home watch services are available in Naturewalk Florida?",
    a: "Coastal Home Management 30A offers Essential ($150/month), Home Watch ($275/month), and Coastal Elite ($599/month) plans for Naturewalk properties. All plans include weekly inspections, photo documentation, mail pickup, and written visit reports. Coastal Elite adds HVAC filter changes, storm monitoring, pre-arrival prep, and contractor coordination.",
  },
  {
    q: "Is Naturewalk at Watersound Origins in CHM's service area?",
    a: "Yes. Naturewalk at Watersound Origins is within our primary service zone. We also serve the broader Watersound Origins community, Inlet Beach, Alys Beach, Rosemary Beach, and surrounding 30A communities.",
  },
];

export default function HomeWatchNaturewalkPage() {
  return (
    <main className="min-h-screen bg-white text-black font-sans">
      {/* Nav */}
      <nav className="border-b border-black/10 px-5 py-3 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <img src="/logo.png" alt="Coastal Home Management 30A" className="h-9 w-auto" draggable={false} />
        </Link>
        <a href="tel:3094158793" className="text-sm font-medium text-black hover:text-black/70 transition">
          (309) 415-8793
        </a>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pt-14 pb-16 md:pt-24 md:pb-24">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
          Naturewalk at Watersound Origins · Inlet Beach, FL
        </p>
        <h1
          className="mb-6 text-4xl leading-[1.05] tracking-tight text-black md:text-5xl max-w-3xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          Home Watch Services for Naturewalk at Watersound Origins
        </h1>
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-black/60">
          Naturewalk at Watersound Origins is one of CHM's primary service communities. Ryder Schilling lives in the neighborhood and personally inspects every property on a weekly or bi-weekly schedule.
          Photo proof after every visit. Written report every time. Immediate alerts if anything needs attention.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="mailto:coastalhomemanagement30a@gmail.com"
            className="inline-block bg-black px-8 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
          >
            Get a Free Walkthrough
          </a>
          <a
            href="tel:3094158793"
            className="inline-block border border-black px-8 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
          >
            Call (309) 415-8793
          </a>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-black/10 bg-[#fafaf8]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">
          <span>Naturewalk resident</span>
          <span className="text-black/20">·</span>
          <span>Fully insured Florida LLC</span>
          <span className="text-black/20">·</span>
          <span>5.0 Google rating</span>
          <span className="text-black/20">·</span>
          <span>Photo proof every visit</span>
          <span className="text-black/20">·</span>
          <span>No contracts</span>
        </div>
      </section>

      {/* What we do */}
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <h2
          className="mb-8 text-3xl tracking-tight text-black md:text-4xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          What home watch looks like in Naturewalk
        </h2>
        <div className="space-y-6 text-sm leading-relaxed text-black/65">
          <p>
            Every visit to your Naturewalk property includes a full interior and exterior walkthrough. We check HVAC, plumbing, irrigation,
            entry points, window seals, exterior condition, and anything that could become a problem if left unaddressed.
            Everything is photographed. You receive the photos and a written summary by text or email — every single time.
          </p>
          <p>
            Naturewalk homes sit in a community with HOA standards, mature landscaping, and Florida coastal exposure.
            That means humidity, storm risk, and maintenance schedules matter more than in other climates.
            Ryder knows this community specifically, knows the contractors who do quality work here, and knows who to call when something needs fixing.
          </p>
          <p>
            We also handle mail pickup, trash service, and can coordinate arrival prep — turning on the AC, doing a walkthrough before you arrive,
            and making sure the home is exactly how you left it.
          </p>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-14">
        <div className="mx-auto max-w-2xl">
          <blockquote className="border border-black/10 bg-white p-8">
            <p className="mb-6 text-base leading-relaxed text-black/70">
              &ldquo;Ryder gives us peace of mind if we&apos;re out of town and need the house checked on. Very reliable. Would highly recommend using his services!&rdquo;
            </p>
            <footer className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/40">
              Barbara Reed — Naturewalk, Inlet Beach
            </footer>
          </blockquote>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-black/10 bg-white px-5 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-10 text-3xl tracking-tight text-black md:text-4xl"
            style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
          >
            Home watch questions for Naturewalk owners
          </h2>
          <div className="space-y-8">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="border-b border-black/8 pb-8">
                <h3 className="mb-3 text-base font-semibold text-black">{q}</h3>
                <p className="text-sm leading-relaxed text-black/60">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }),
        }}
      />

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Coastal Home Management 30A",
            description: "Home watch service for Naturewalk at Watersound Origins and surrounding 30A communities. Local resident, fully insured, weekly inspections, photo reports, storm preparation.",
            url: "https://coastalhomemngt30a.com/home-watch-naturewalk",
            telephone: "+13094158793",
            email: "coastalhomemanagement30a@gmail.com",
            priceRange: "$150-$599/month",
            areaServed: [
              { "@type": "Place", name: "Naturewalk at Watersound Origins, Inlet Beach, FL" },
              { "@type": "Place", name: "Watersound Origins, Inlet Beach, FL" },
              { "@type": "Place", name: "Inlet Beach, FL" },
              { "@type": "Place", name: "30A, Walton County, FL" },
            ],
            address: {
              "@type": "PostalAddress",
              addressLocality: "Inlet Beach",
              addressRegion: "FL",
              postalCode: "32461",
              addressCountry: "US",
            },
          }),
        }}
      />

      {/* CTA */}
      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-16 text-center">
        <h2
          className="mb-4 text-3xl tracking-tight text-black md:text-4xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          Protect your Naturewalk home.
        </h2>
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-black/60">
          Free walkthrough, no commitment. Most clients are set up within a few days.
        </p>
        <a
          href="mailto:coastalhomemanagement30a@gmail.com"
          className="inline-block bg-black px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
        >
          Get My Free Home Check
        </a>
      </section>

      {/* Related */}
      <section className="border-t border-black/10 bg-white px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-black/40">Related</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/home-watch" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Home Watch — All Areas</Link>
            <Link href="/home-watch-watersound-origins" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Home Watch — Watersound Origins</Link>
            <Link href="/home-watch-inlet-beach" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Home Watch — Inlet Beach</Link>
            <Link href="/pricing" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Pricing & Plans</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white px-6 py-8 text-center text-xs text-black/40">
        © {new Date().getFullYear()} Coastal Home Management 30A · Inlet Beach, FL · (309) 415-8793
      </footer>
    </main>
  );
}
