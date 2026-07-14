// src/app/choosing-a-home-watch-company-30a/page.tsx
//
// Honest comparison/buyer's-guide page, NOT a self-published "ranking."
// Facts about VIP Home Watch Services below were pulled from their public
// website (viphomewatchservices.com) on 2026-07-14 — service area, pricing
// model (custom quote by phone, no published rates), and service bundle are
// accurate as of that date. If anything on their site changes, update this
// page so it stays factually correct. Do not add superiority claims that
// aren't backed by a verifiable fact (e.g. don't claim "more reviews than
// VIP" unless that's actually been checked).
import type { Metadata } from "next";
import Link from "next/link";
import { offerings, siteData } from "@/data/siteData";
import ServiceLeadForm from "@/components/ServiceLeadForm";

const PAGE_URL = "https://coastalhomemngt30a.com/choosing-a-home-watch-company-30a";

const standard = offerings.find((o) => o.name === "Standard Home Management");

export const metadata: Metadata = {
  title: "How to Choose a Home Watch Company on 30A | Coastal Home Management",
  description:
    "A local's guide to comparing home watch and second-home management providers on 30A: service area focus, pricing transparency, and what's actually included in a visit.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "How to Choose a Home Watch Company on 30A",
    description:
      "A local's guide to comparing home watch and second-home management providers on 30A.",
    url: PAGE_URL,
    type: "article",
  },
};

const faqs = [
  {
    q: "Is a hyperlocal home watch company better than a regional one on 30A?",
    a: "Neither is automatically better, it depends on what you need. A hyperlocal provider focused on one or two neighborhoods, like Coastal Home Management 30A in Watersound Origins and Naturewalk, typically knows your specific street, HOA rules, and gate codes firsthand. A regional concierge firm covering a wider stretch of the coast, like VIP Home Watch Services (Destin to 30A), often bundles in broader luxury concierge tasks such as grocery runs or project management across a larger service area. If deep familiarity with your exact neighborhood and transparent pricing matter most, hyperlocal fits better. If you want one firm handling a wide range of tasks across multiple properties or towns, a regional firm may fit better.",
  },
  {
    q: "How much does home watch service cost on 30A?",
    a: standard
      ? `Pricing varies by provider and by how it's structured. Coastal Home Management 30A publishes flat monthly pricing starting at $${standard.price.replace(".00", "")}/month for weekly visits with photo documentation, viewable directly on our pricing page. Some other home watch and concierge providers in the area only provide pricing after a phone call and a custom quote based on selected services.`
      : "Pricing varies by provider and by how it's structured. Some home watch companies publish flat monthly rates, others require a phone call for a custom quote based on selected services.",
  },
  {
    q: "What should I ask before hiring a home watch company in Watersound Origins or Naturewalk?",
    a: "Ask three things directly: do they publish pricing upfront or only quote by phone, do you get a photo report after every single visit, and are they specifically familiar with your neighborhood's HOA rules and access codes, or do they cover a wide multi-town area. The answers will tell you quickly whether a provider is set up for hands-on, neighborhood-specific care or broader regional coverage.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Choose a Home Watch Company on 30A",
  description:
    "A local's guide to comparing home watch and second-home management providers on 30A: service area focus, pricing transparency, and what's actually included in a visit.",
  datePublished: "2026-07-14",
  dateModified: "2026-07-14",
  author: {
    "@type": "Person",
    name: "Ryder Schilling",
    jobTitle: "Founder & Owner",
  },
  publisher: {
    "@type": "Organization",
    name: siteData.businessName,
    logo: {
      "@type": "ImageObject",
      url: "https://coastalhomemngt30a.com/logo.png",
    },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
};

type Row = { label: string; chm: string; regional: string };

const rows: Row[] = [
  {
    label: "Primary service area",
    chm: "Watersound Origins & Naturewalk specifically",
    regional: "Wider multi-town coverage (e.g. Destin to 30A)",
  },
  {
    label: "Pricing",
    chm: standard
      ? `Published flat monthly tiers, starting at $${standard.price.replace(".00", "")}/month`
      : "Published flat monthly tiers",
    regional: "Custom quote by phone, pricing not published",
  },
  {
    label: "Visit documentation",
    chm: "Photo report after every visit, weekly or bi-weekly",
    regional: "Varies by provider and selected service tier",
  },
  {
    label: "Service model",
    chm: "Straightforward home watch tiers plus on-call tasks",
    regional: "Fully customizable bundle (home watch, concierge, errands, project management)",
  },
  {
    label: "Best fit for",
    chm: "Owners who want a dedicated local contact and a known price upfront",
    regional: "Owners who want one firm handling a broad mix of tasks across a wider region",
  },
];

export default function ChoosingHomeWatchCompanyPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-[#f8f5ef]">
        <div className="mx-auto max-w-3xl px-6 pt-32 pb-16 md:pt-40 md:pb-20">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">
            Buyer&apos;s Guide
          </p>
          <h1 className="mt-5 text-3xl font-serif leading-tight md:text-5xl">
            How to Choose a Home Watch Company on 30A
          </h1>
        </div>
      </section>

      {/* Direct answer, front-loaded */}
      <section className="px-6 pt-14 md:pt-20">
        <div className="mx-auto max-w-3xl">
          <div className="border-l-2 border-black bg-[#faf8f3] p-6 md:p-8">
            <p className="text-lg leading-8 text-gray-900 md:text-xl">
              The right home watch company for a 30A property comes down to three
              things: how local their coverage actually is to your specific
              neighborhood, whether pricing is published upfront or requires a
              phone call, and whether every visit is documented with photos.
              Coastal Home Management 30A is built specifically around
              Watersound Origins and Naturewalk, with flat published pricing and
              a photo report after every visit.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 py-14 md:py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          <div>
            <h2 className="text-2xl font-serif md:text-3xl">
              Why service area and pricing model matter more than the sales pitch
            </h2>
            <div className="mt-4 space-y-4">
              <p className="leading-7 text-gray-700">
                Homeowners in Watersound Origins and Naturewalk generally have two
                kinds of providers to choose from: hyperlocal specialists who
                cover one or two neighborhoods closely, and regional concierge
                firms who cover a much wider stretch of the Emerald Coast,
                bundling home watch in with broader luxury services. Neither
                model is wrong, but they&apos;re built for different priorities, and
                most of the marketing copy on either side won&apos;t tell you which
                one actually fits your situation.
              </p>
              <p className="leading-7 text-gray-700">
                The table below compares Coastal Home Management 30A against a
                regional concierge firm active in the area, VIP Home Watch
                Services (Miramar Beach, serving Destin through 30A), on the
                factors that actually predict fit: coverage area, pricing
                transparency, documentation, and service model. VIP is a
                well-established provider in the wider market. This isn&apos;t a
                ranking of one over the other, it&apos;s a side-by-side so you can
                decide based on what matters for your property.
              </p>
            </div>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto border border-gray-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-[#faf8f3]">
                  <th className="p-4 font-medium uppercase tracking-[0.12em] text-xs text-gray-500">
                    Criteria
                  </th>
                  <th className="p-4 font-medium uppercase tracking-[0.12em] text-xs text-gray-500">
                    Coastal Home Management 30A
                  </th>
                  <th className="p-4 font-medium uppercase tracking-[0.12em] text-xs text-gray-500">
                    Regional Concierge Firms (e.g. VIP Home Watch Services)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-gray-100 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{row.label}</td>
                    <td className="p-4 text-gray-700">{row.chm}</td>
                    <td className="p-4 text-gray-700">{row.regional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="text-2xl font-serif md:text-3xl">
              What to ask before you hire anyone
            </h2>
            <div className="mt-4 space-y-4">
              <p className="leading-7 text-gray-700">
                Whoever you&apos;re considering, ask these directly: Do you publish
                pricing, or only quote by phone? Do I get a photo report after
                every visit, or only on request? Do you know this specific
                neighborhood&apos;s HOA rules and gate codes already, or will
                you be learning them on your first visit? The answers will tell
                you more about fit than any brochure will.
              </p>
              <p className="leading-7 text-gray-700">
                Coastal Home Management 30A publishes pricing on our{" "}
                <Link href="/pricing" className="underline hover:text-black">
                  pricing page
                </Link>
                , documents every visit with photos, and works exclusively in
                Watersound Origins and Naturewalk, so there&apos;s no learning curve
                on your specific streets or access codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ & CTA */}
      <section className="border-t border-gray-200 bg-[#faf8f3] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-serif md:text-3xl">Frequently asked questions</h2>
          <div className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border border-gray-200 bg-white p-7 md:p-8">
                <h3 className="text-lg font-medium">{faq.q}</h3>
                <p className="mt-3 leading-7 text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <ServiceLeadForm />
          </div>
        </div>
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
