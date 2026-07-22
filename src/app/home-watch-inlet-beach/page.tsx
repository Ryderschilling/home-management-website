import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home Watch Service Inlet Beach FL | Coastal Home Management 30A",
  description:
    "Home watch and second-home care in Inlet Beach, Florida. Local, insured, weekly inspections, photo reports, storm checks. Serving Inlet Beach, Watersound Origins, Naturewalk, Alys Beach. Free walkthrough.",
  alternates: { canonical: "https://coastalhomemngt30a.com/home-watch-inlet-beach" },
  keywords: "home watch Inlet Beach FL, home watch service Inlet Beach Florida, second home care Inlet Beach, property watch Inlet Beach 30A, home watch 32461",
  openGraph: {
    title: "Home Watch Service — Inlet Beach FL | CHM 30A",
    description: "Local, insured home watch for Inlet Beach second-home owners. Weekly inspections, photo proof, storm prep. Free walkthrough.",
    url: "https://coastalhomemngt30a.com/home-watch-inlet-beach",
    images: ["/img.png"],
  },
};

const FAQ = [
  {
    q: "What home watch services are available in Inlet Beach Florida?",
    a: "Coastal Home Management 30A provides dedicated home watch services throughout Inlet Beach, FL 32461. Services include weekly or bi-weekly property inspections, interior and exterior walkthroughs, photo documentation, written visit reports, mail pickup, storm preparation, HVAC and plumbing checks, and contractor coordination.",
  },
  {
    q: "Who is the best home watch company in Inlet Beach FL?",
    a: "Coastal Home Management 30A is a locally owned, 5.0-rated home watch service based in Inlet Beach. Owner Ryder Schilling lives in Watersound Origins and personally visits every property — no subcontractors or rotating staff. Serving Inlet Beach, Watersound Origins, Naturewalk, Alys Beach, and Rosemary Beach.",
  },
  {
    q: "How often does home watch visit my Inlet Beach property?",
    a: "Coastal Home Management 30A offers weekly and bi-weekly visit schedules. All plans include visits on a set schedule, plus unscheduled storm checks after significant weather events at no extra charge on Elite plans.",
  },
  {
    q: "How much does home watch cost in Inlet Beach FL?",
    a: "Plans start at $150/month (Essential — weekly visits, photo reports, mail pickup), $300/month (Home Watch — adds appliance and plumbing checks), and $600/month (Coastal Elite — adds HVAC filter changes, storm monitoring, pre-arrival prep, and contractor coordination). No contracts or cancellation fees.",
  },
];

export default function HomeWatchInletBeachPage() {
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
          Inlet Beach, FL 32461 · 30A Florida Panhandle
        </p>
        <h1
          className="mb-6 text-4xl leading-[1.05] tracking-tight text-black md:text-5xl max-w-3xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          Home Watch Services in Inlet Beach, Florida
        </h1>
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-black/60">
          Coastal Home Management 30A is the locally owned and operated home watch service for Inlet Beach and the surrounding 30A corridor.
          Weekly inspections, photo documentation after every visit, storm preparation, and a single local person who personally checks your home every time.
          Rated 5.0 on Google. Fully insured Florida LLC.
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
          <span>Inlet Beach based</span>
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

      {/* Service area callout */}
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-20">
        <h2
          className="mb-8 text-3xl tracking-tight text-black md:text-4xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          Serving all of Inlet Beach and surrounding 30A communities
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm">
          {[
            "Watersound Origins",
            "Naturewalk at Watersound",
            "Inlet Beach (32461)",
            "Alys Beach",
            "Rosemary Beach",
            "WaterSound Beach",
            "Seacrest Beach",
            "Watersound West Beach",
            "Scenic 30A Corridor",
          ].map((area) => (
            <div key={area} className="border border-black/10 px-4 py-3 text-black/70">
              ✓ {area}
            </div>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-10 text-3xl tracking-tight text-black md:text-4xl"
            style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
          >
            What every home watch visit includes
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              "Full interior walkthrough — every room, every system",
              "Exterior inspection — roof line, entry points, drainage",
              "HVAC function check and filter assessment",
              "Plumbing and water heater check",
              "Irrigation system inspection",
              "Photo documentation — entire property, every visit",
              "Written visit report by text or email",
              "Mail and package retrieval",
              "Storm damage assessment after weather events",
              "Immediate alert if anything needs attention",
              "Contractor coordination if repairs are needed",
              "Pre-arrival walkthrough and AC pre-set (Elite plan)",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-black/65">
                <span className="mt-0.5 text-black font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-black/10 bg-white px-5 py-14">
        <div className="mx-auto max-w-3xl grid gap-6 md:grid-cols-2">
          <blockquote className="border border-black/10 p-7">
            <p className="mb-5 text-sm leading-relaxed text-black/70">&ldquo;Ryder gives us peace of mind if we&apos;re out of town and need the house checked on. Very reliable.&rdquo;</p>
            <footer className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">Barbara Reed — Naturewalk, Inlet Beach</footer>
          </blockquote>
          <blockquote className="border border-black/10 p-7">
            <p className="mb-5 text-sm leading-relaxed text-black/70">&ldquo;Excellent service and communication! Very helpful and Ryder goes out of his way to help.&rdquo;</p>
            <footer className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">Beth Tedesco — Inlet Beach</footer>
          </blockquote>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-10 text-3xl tracking-tight text-black md:text-4xl"
            style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
          >
            Home watch questions for Inlet Beach owners
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

      {/* Schema */}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Coastal Home Management 30A",
            description: "Home watch service in Inlet Beach, FL. Weekly inspections, photo reports, storm prep, HVAC checks, mail pickup. Serving Watersound Origins, Naturewalk, Alys Beach, and 30A. Fully insured Florida LLC. 5.0 Google rating.",
            url: "https://coastalhomemngt30a.com/home-watch-inlet-beach",
            telephone: "+13094158793",
            email: "coastalhomemanagement30a@gmail.com",
            priceRange: "$150-$600/month",
            areaServed: [
              { "@type": "Place", name: "Inlet Beach, FL 32461" },
              { "@type": "Place", name: "Watersound Origins, FL" },
              { "@type": "Place", name: "Naturewalk at Watersound Origins, FL" },
              { "@type": "Place", name: "Alys Beach, FL" },
              { "@type": "Place", name: "Rosemary Beach, FL" },
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
      <section className="border-t border-black/10 bg-white px-5 py-16 text-center">
        <h2
          className="mb-4 text-3xl tracking-tight text-black md:text-4xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          Let&apos;s protect your Inlet Beach home.
        </h2>
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-black/60">
          Free walkthrough, no commitment. Most clients are set up and receiving their first report within a few days.
        </p>
        <a
          href="mailto:coastalhomemanagement30a@gmail.com"
          className="inline-block bg-black px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
        >
          Get My Free Home Check
        </a>
      </section>

      {/* Related */}
      <section className="border-t border-black/10 bg-[#fafaf8] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-black/40">Related</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/home-watch" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Home Watch — All Areas</Link>
            <Link href="/home-watch-watersound-origins" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Watersound Origins</Link>
            <Link href="/home-watch-naturewalk" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Naturewalk</Link>
            <Link href="/concierge-services-inlet-beach" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Concierge Services</Link>
            <Link href="/pricing" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Pricing & Plans</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white px-6 py-8 text-center text-xs text-black/40">
        © {new Date().getFullYear()} Coastal Home Management 30A · Inlet Beach, FL 32461 · (309) 415-8793
      </footer>
    </main>
  );
}
