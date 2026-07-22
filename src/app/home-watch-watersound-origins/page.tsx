import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home Watch Service Watersound Origins FL | Coastal Home Management 30A",
  description:
    "Coastal Home Management 30A is the dedicated home watch service for Watersound Origins. Local, insured, weekly inspections, photo reports, storm prep. Owner lives in the neighborhood. Free walkthrough.",
  alternates: { canonical: "https://coastalhomemngt30a.com/home-watch-watersound-origins" },
  keywords: "home watch Watersound Origins, Watersound Origins property management, home watch service Watersound FL, second home care Watersound Origins, property watch Watersound Origins Florida",
  openGraph: {
    title: "Home Watch Service in Watersound Origins | CHM 30A",
    description:
      "The only home watch provider that lives in Watersound Origins. Weekly inspections, photo proof, storm checks. Free walkthrough.",
    url: "https://coastalhomemngt30a.com/home-watch-watersound-origins",
    images: ["/img.png"],
  },
};

const FAQ = [
  {
    q: "Who provides home watch services in Watersound Origins Florida?",
    a: "Coastal Home Management 30A is the dedicated home watch provider for Watersound Origins. Owner Ryder Schilling lives full-time in the community and personally inspects every property. No subcontractors, no rotating staff — just one local person who treats your home like his own.",
  },
  {
    q: "What does a home watch service do in Watersound Origins?",
    a: "We walk your home inside and out on a weekly or bi-weekly schedule, check every system (HVAC, plumbing, irrigation, entry points), photograph the entire property, and send you a written report after every visit. Storm events trigger unscheduled checks. We also handle mail pickup, trash, and contractor coordination.",
  },
  {
    q: "How much does home watch cost in Watersound Origins?",
    a: "Plans start at $150/month for weekly Essential visits, $300/month for the full Home Watch plan with appliance and plumbing checks, and $600/month for Coastal Elite with HVAC filter changes, storm monitoring, pre-arrival prep, and contractor coordination. No contracts or cancellation fees.",
  },
  {
    q: "Is Coastal Home Management 30A insured?",
    a: "Yes. Coastal Home Management 30A is a fully insured Florida LLC. We carry general liability coverage and operate professionally in Walton County, Florida.",
  },
  {
    q: "Does CHM serve all of Watersound Origins?",
    a: "Yes. We serve all streets and sections within Watersound Origins — including Naturewalk at Watersound Origins — as well as surrounding communities in Inlet Beach, Alys Beach, and along 30A.",
  },
];

export default function HomeWatchWatersoundPage() {
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
          Watersound Origins · Inlet Beach, FL · 30A
        </p>
        <h1
          className="mb-6 text-4xl leading-[1.05] tracking-tight text-black md:text-5xl max-w-3xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          Home Watch Services in Watersound Origins, Florida
        </h1>
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-black/60">
          Coastal Home Management 30A is the only home watch provider that actually lives in Watersound Origins.
          Ryder Schilling personally inspects every property — no subcontractors, no office dispatchers, no guessing whether someone showed up.
          Weekly inspections, photo proof every visit, and immediate alerts if anything needs attention.
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
          <span>Lives in Watersound Origins</span>
          <span className="text-black/20">·</span>
          <span>Fully insured Florida LLC</span>
          <span className="text-black/20">·</span>
          <span>Photo proof every visit</span>
          <span className="text-black/20">·</span>
          <span>5.0 Google rating</span>
          <span className="text-black/20">·</span>
          <span>No contracts</span>
        </div>
      </section>

      {/* Why CHM for Watersound */}
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <h2
          className="mb-10 text-3xl tracking-tight text-black md:text-4xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          Why Watersound Origins homeowners choose CHM
        </h2>
        <div className="grid gap-10 md:grid-cols-2">
          {[
            {
              title: "Your neighbor — literally",
              body: "Ryder lives in Watersound Origins. He knows the streets, the HOA rules, the storm patterns, and the specific challenges of homes in this community. That neighborhood knowledge makes every visit better.",
            },
            {
              title: "One person. Every time.",
              body: "No rotating crews, no subcontractors. You have Ryder's personal number. He's the one who shows up, and he's the one who calls you if something needs attention.",
            },
            {
              title: "Documented proof after every visit",
              body: "After every walkthrough you receive photos and a written summary — by text or email, however you prefer. No wondering if someone showed up. You see exactly what was found.",
            },
            {
              title: "Storm-ready and on-call",
              body: "Coastal Florida storms are real. CHM monitors storm events and performs pre- and post-storm checks so you always know the status of your property, even during hurricane season.",
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
      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-8 text-3xl tracking-tight text-black md:text-4xl"
            style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
          >
            Home Watch Plans for Watersound Origins
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Essential",
                price: "$150/mo",
                features: ["Weekly walkthrough", "Photo documentation", "Mail pickup", "Issue alerts", "Written report"],
              },
              {
                name: "Home Watch",
                price: "$300/mo",
                features: ["Everything in Essential", "Appliance & plumbing checks", "Irrigation filter cleaning", "Bi-weekly or weekly schedule"],
                featured: true,
              },
              {
                name: "Coastal Elite",
                price: "$600/mo",
                features: ["Everything in Home Watch", "HVAC filter changes", "Storm & freeze monitoring", "Pre-arrival prep", "Contractor coordination"],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`border p-7 ${plan.featured ? "border-black bg-black text-white" : "border-black/10 bg-white"}`}
              >
                <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] mb-3 ${plan.featured ? "text-white/50" : "text-black/40"}`}>
                  {plan.name}
                </p>
                <p className={`text-3xl font-serif mb-6 ${plan.featured ? "text-white" : "text-black"}`}>{plan.price}</p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className={`text-sm ${plan.featured ? "text-white/75" : "text-black/60"}`}>
                      ✓ {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-black/40">No contracts. No cancellation fees. Cancel anytime.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-black/10 bg-white px-5 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-10 text-3xl tracking-tight text-black md:text-4xl"
            style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
          >
            Questions about home watch in Watersound Origins
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
            description: "Home watch service in Watersound Origins, Florida. Weekly inspections, photo reports, storm preparation, and full second-home oversight by a local Watersound Origins resident. Fully insured Florida LLC. 5.0 Google rating.",
            url: "https://coastalhomemngt30a.com/home-watch-watersound-origins",
            telephone: "+13094158793",
            email: "coastalhomemanagement30a@gmail.com",
            priceRange: "$150-$600/month",
            areaServed: [
              { "@type": "Place", name: "Watersound Origins, Inlet Beach, FL 32461" },
              { "@type": "Place", name: "Naturewalk at Watersound Origins, FL" },
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
      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-16 md:py-20 text-center">
        <h2
          className="mb-4 text-3xl tracking-tight text-black md:text-4xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          Ready to protect your Watersound home?
        </h2>
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-black/60">
          Free walkthrough, no commitment. Reach out and we'll set everything up within a few days.
        </p>
        <a
          href="mailto:coastalhomemanagement30a@gmail.com"
          className="inline-block bg-black px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
        >
          Get My Free Home Check
        </a>
      </section>

      {/* Related pages */}
      <section className="border-t border-black/10 bg-white px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-black/40">Related</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/home-watch" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Home Watch — All Areas</Link>
            <Link href="/home-watch-naturewalk" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Home Watch — Naturewalk</Link>
            <Link href="/second-home-management-watersound-origins" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Second Home Management — Watersound</Link>
            <Link href="/pricing" className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/70 hover:border-black hover:text-black transition">Pricing & Plans</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white px-6 py-8 text-center text-xs text-black/40">
        © {new Date().getFullYear()} Coastal Home Management 30A · Inlet Beach, FL · (309) 415-8793 ·{" "}
        <a href="mailto:coastalhomemanagement30a@gmail.com" className="hover:text-black transition">
          coastalhomemanagement30a@gmail.com
        </a>
      </footer>
    </main>
  );
}
