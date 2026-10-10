// Shared layout for the answer-first guides in src/data/guidePages.ts.
// Schema: Article (author Ryder, publisher = the canonical #business entity),
// FAQPage, BreadcrumbList. No aggregateRating here: it lives ONLY in layout.tsx
// (see the 9/5/26 "multiple aggregate ratings" fix). Do not add it back.
import Link from "next/link";
import type { GuidePageData } from "@/data/guidePages";
import { primaryPhone, primaryPhoneDisplay, siteData, trustStats } from "@/data/siteData";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import BhwcBadge from "@/components/BhwcBadge";
import EmailSignup from "@/components/EmailSignup";

const SITE = "https://coastalhomemngt30a.com";

// Storm guides get the storm alerts signup above the CTA (added 10/10/26).
const STORM_SLUGS = new Set([
  "after-hurricane-isaias-30a",
  "storm-prep-30a",
  "storm-shutters-30a",
  "vacation-home-storm-prep-30a",
  "who-to-call-storm-prep-30a",
]);

export default function GuidePage({ page }: { page: GuidePageData }) {
  const url = `${SITE}/${page.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.metaDescription,
    datePublished: page.datePublished,
    dateModified: page.dateModified,
    author: { "@type": "Person", name: "Ryder Schilling", jobTitle: "Founder & Owner", url: `${SITE}/about` },
    publisher: { "@type": "LocalBusiness", "@id": `${SITE}/#business`, name: siteData.businessName, url: SITE },
    about: { "@type": "LocalBusiness", "@id": `${SITE}/#business` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: page.title, item: url },
    ],
  };

  return (
    <main className="bg-[var(--ch-paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <section className="fade-section bg-[var(--ch-paper)] px-4 pt-28 pb-14 md:px-8 md:pt-36 md:pb-16">
        <div className="mx-auto max-w-[860px]">
          <p className="ch-eyebrow reveal-item">{page.eyebrow}</p>
          <h1 className="ch-display mb-8">{page.title}</h1>
          <span className="ch-draw mb-8 block h-px w-24 bg-[var(--ch-teal)]" />
          <p className="ch-label reveal-item mb-6 !text-[var(--ch-soft)]">
            Insured Florida LLC · Watersound Origins · Alys · Rosemary · Scenic 30A
          </p>
          <p className="ch-lede reveal-item max-w-[62ch]">{page.lede}</p>
          <p className="mt-6 text-[13px] text-[var(--ch-muted)]">
            By Ryder Schilling, owner of {siteData.businessName} · Updated{" "}
            {new Date(page.dateModified + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </section>

      {/* Direct answer, written to be lifted whole */}
      <section className="px-4 md:px-8">
        <div className="mx-auto max-w-[860px] border-l-2 border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] p-6 md:p-8">
          <p className="ch-label mb-3">The short answer</p>
          <p className="text-[17px] leading-[1.75] text-[var(--ch-ink)] md:text-[19px]">{page.directAnswer}</p>
        </div>
      </section>

      {/* Body */}
      <section className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-[860px] space-y-14">
          {page.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="ch-display ch-display--sm mb-6">{s.heading}</h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 40)} className="mb-4 text-[16px] leading-[1.8] text-[var(--ch-muted)]">{p}</p>
              ))}
              {s.list && (
                <ul className="mt-2">
                  {s.list.map((item) => (
                    <li key={item} className="flex gap-3 border-t border-[var(--ch-hairline)] py-3.5 text-[15.5px] leading-[1.65] text-[var(--ch-ink)]">
                      <span aria-hidden="true" className="mt-[9px] block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ch-teal)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {s.directory && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {s.directory.map((d) => (
                    <a
                      key={d.name}
                      href={d.url}
                      target="_blank"
                      rel="noopener"
                      className="group block border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-5 transition-colors hover:border-[var(--ch-teal)]"
                    >
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--ch-muted)]">{d.kind}</p>
                      <p className="mt-2 text-[18px] leading-tight text-[var(--ch-ink)] group-hover:text-[var(--ch-teal)]">{d.name}</p>
                      <p className="mt-2 text-[13px] leading-[1.6] text-[var(--ch-muted)]">{d.areas}</p>
                      <p className="mt-3 text-[14.5px] leading-[1.65] text-[var(--ch-ink)]">{d.note}</p>
                    </a>
                  ))}
                </div>
              )}
              {s.table && (
                <div className="mt-4 overflow-x-auto border border-[var(--ch-hairline)]">
                  <table className="w-full min-w-[600px] text-left text-[14px]">
                    <thead>
                      <tr className="bg-[var(--ch-paper-alt)]">
                        {s.table.head.map((h, i) => (
                          <th key={i} className="p-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ch-muted)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((row) => (
                        <tr key={row[0]} className="border-t border-[var(--ch-hairline)]">
                          {row.map((cell, i) => (
                            <td key={i} className={`p-4 leading-[1.6] ${i === 0 ? "text-[var(--ch-ink)]" : "text-[var(--ch-muted)]"}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {STORM_SLUGS.has(page.slug) && <EmailSignup variant="storm" />}

      {/* CTA + proof */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-[860px] gap-10 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <h2 className="ch-display ch-display--sm mb-5">{page.cta.heading}</h2>
            <p className="ch-lede mb-8 max-w-[46ch]">{page.cta.body}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href={page.cta.href} className="ch-btn ch-btn--solid">{page.cta.label}</Link>
              <a href={`tel:${primaryPhone()}`} className="ch-btn">{primaryPhoneDisplay()}</a>
            </div>
          </div>
          <div className="space-y-4">
            <BhwcBadge className="w-full" />
            <a href={siteData.gbpMapsUrl} target="_blank" rel="noopener" className="block text-[13px] text-[var(--ch-muted)] underline underline-offset-4 hover:text-[var(--ch-ink)]">
              {trustStats.ratingValue} on Google across {trustStats.reviewCount} reviews
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[860px]">
          <p className="ch-eyebrow reveal-item">Questions</p>
          <h2 className="ch-display ch-display--sm mb-10">Asked plainly.</h2>
          {page.faqs.map(({ q, a }) => (
            <div key={q} className="border-t border-[var(--ch-hairline)] py-7">
              <h3 className="mb-3 text-[17px] leading-[1.4] text-[var(--ch-ink)]">{q}</h3>
              <p className="text-[15px] leading-[1.75] text-[var(--ch-muted)]">{a}</p>
            </div>
          ))}

          <div className="mt-12 border-t border-[var(--ch-hairline)] pt-8">
            <p className="ch-label mb-4">Keep reading</p>
            <ul className="space-y-3">
              {page.related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="ch-link text-[15px]">{r.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          {page.mentionsInsurance && <LegalDisclaimer variant="inline" />}
        </div>
      </section>
    </main>
  );
}
