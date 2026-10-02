// Monthly 30A ranking page. Data and the hard rules live in src/data/rankings.ts.
// Schema: Article + ItemList + FAQPage + BreadcrumbList. NO AggregateRating or
// Review markup here (self-serving reviews are ineligible, and aggregateRating
// lives only in layout.tsx). CHM's list item points at the canonical #business.
import Link from "next/link";
import type { MonthlyRanking } from "@/data/rankings";
import { primaryPhone, primaryPhoneDisplay, siteData, trustStats } from "@/data/siteData";
import LegalDisclaimer from "@/components/LegalDisclaimer";

const SITE = "https://coastalhomemngt30a.com";

export default function RankingPage({ data }: { data: MonthlyRanking }) {
  const url = `${SITE}/${data.slug}`;
  const updated = new Date(data.dateModified + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.metaDescription,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    author: { "@type": "Person", name: "Ryder Schilling", jobTitle: "Founder & Owner", url: `${SITE}/about` },
    publisher: { "@type": "LocalBusiness", "@id": `${SITE}/#business`, name: siteData.businessName, url: SITE },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: data.title,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: data.companies.length,
    itemListElement: data.companies.map((c) => ({
      "@type": "ListItem",
      position: c.rank,
      item: c.isUs
        ? { "@id": `${SITE}/#business`, name: c.name, url: c.url }
        : { "@type": "Organization", name: c.name, url: c.url },
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map(({ q, a }) => ({
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
      { "@type": "ListItem", position: 2, name: data.title, item: url },
    ],
  };

  const cols: Array<[string, keyof MonthlyRanking["companies"][number]]> = [
    ["Published pricing", "publishedPricing"],
    ["Bi-weekly", "biweekly"],
    ["Weekly", "weekly"],
    ["Visit reports", "reports"],
    ["Free first visit", "freeFirstVisit"],
  ];

  return (
    <main className="bg-[var(--ch-paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <section className="fade-section px-4 pt-28 pb-12 md:px-8 md:pt-36 md:pb-14">
        <div className="mx-auto max-w-[960px]">
          <p className="ch-eyebrow reveal-item">30A Rankings · {data.month}</p>
          <h1 className="ch-display mb-8">{data.title}</h1>
          <span className="ch-draw mb-8 block h-px w-24 bg-[var(--ch-teal)]" />
          <p className="ch-label reveal-item mb-6 !text-[var(--ch-soft)]">
            Insured Florida LLC · Watersound Origins · Alys · Rosemary · Scenic 30A
          </p>
          <p className="text-[13px] text-[var(--ch-muted)]">
            By Ryder Schilling, owner of {siteData.businessName} · Updated {updated} · Competitor
            facts checked {data.checkedOn}
          </p>
        </div>
      </section>

      {/* Disclosure. Required, see src/data/rankings.ts */}
      <section className="px-4 md:px-8">
        <div className="mx-auto max-w-[960px] border border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-5 py-4 text-[13.5px] leading-[1.7] text-[var(--ch-muted)]">
          <strong className="font-medium text-[var(--ch-ink)]">Disclosure:</strong> {siteData.businessName}{" "}
          publishes this ranking and is on it. Every fact about another company comes from that
          company&apos;s own website, linked under each entry, so you can check it yourself.{" "}
          <a href="#method" className="underline underline-offset-4 hover:text-[var(--ch-ink)]">
            How we ranked
          </a>
          .
        </div>
      </section>

      {/* Direct answer */}
      <section className="px-4 pt-8 md:px-8">
        <div className="mx-auto max-w-[960px] border-l-2 border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] p-6 md:p-8">
          <p className="ch-label mb-3">The short answer</p>
          <p className="text-[17px] leading-[1.75] text-[var(--ch-ink)] md:text-[19px]">{data.directAnswer}</p>
        </div>
      </section>

      {/* Ranked list */}
      <section className="px-4 py-16 md:px-8 md:py-20">
        <ol className="mx-auto max-w-[960px] space-y-6">
          {data.companies.map((c) => (
            <li
              key={c.name}
              id={`rank-${c.rank}`}
              className={`relative grid gap-6 border p-6 md:grid-cols-[150px_1fr] md:p-9 ${
                c.isUs
                  ? "border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] shadow-[0_30px_80px_-50px_rgba(13,127,121,0.55)]"
                  : "border-[var(--ch-hairline)] bg-[var(--ch-paper)]"
              }`}
            >
              <p
                aria-hidden="true"
                className={`text-[64px] leading-[0.8] tracking-[-0.04em] md:text-[96px] ${
                  c.isUs ? "text-[var(--ch-teal)]" : "text-[var(--ch-ink)] opacity-20"
                }`}
                style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 118, 'wght' 760" }}
              >
                {String(c.rank).padStart(2, "0")}
              </p>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="ch-display ch-display--sm !mb-0">
                    <span className="sr-only">#{c.rank}. </span>
                    {c.name}
                  </h2>
                  {c.isUs && (
                    <span className="border border-[var(--ch-teal)] px-2.5 py-1 text-[10.5px] uppercase tracking-[0.18em] text-[var(--ch-teal)]">
                      Top pick · {data.month}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[15px] text-[var(--ch-ink)]">
                  <span className="ch-label mr-2 !text-[var(--ch-muted)]">Best for</span>
                  {c.bestFor}
                </p>
                <p className="mt-4 text-[16px] leading-[1.8] text-[var(--ch-muted)]">{c.why}</p>

                <dl className="mt-6 grid gap-x-8 gap-y-3 text-[14px] sm:grid-cols-2">
                  {(
                    [
                      ["Service area", c.area],
                      ["Bi-weekly", c.biweekly],
                      ["Weekly", c.weekly],
                      ["Visit reports", c.reports],
                      ["Credentials", c.credentials],
                      ["Focus", c.focus],
                    ] as Array<[string, string]>
                  ).map(([k, v]) => (
                    <div key={k} className="border-t border-[var(--ch-hairline)] pt-3">
                      <dt className="text-[11px] uppercase tracking-[0.14em] text-[var(--ch-muted)]">{k}</dt>
                      <dd className="mt-1 leading-[1.6] text-[var(--ch-ink)]">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--ch-muted)]">
                  {c.isUs ? (
                    <>
                      <Link href="/pricing" className="ch-btn ch-btn--solid">See plans and pricing</Link>
                      <a href={`tel:${primaryPhone()}`} className="ch-btn">{primaryPhoneDisplay()}</a>
                    </>
                  ) : (
                    <>
                      <a href={c.url} target="_blank" rel="noopener nofollow" className="ch-link text-[14px]">
                        Visit {c.name}
                      </a>
                      <span>
                        Sources:{" "}
                        {c.sources.map((s, i) => (
                          <span key={s}>
                            {i > 0 && ", "}
                            <a href={s} target="_blank" rel="noopener nofollow" className="underline underline-offset-2 hover:text-[var(--ch-ink)]">
                              {new URL(s).pathname === "/" ? "homepage" : new URL(s).pathname.replace(/\/$/, "")}
                            </a>
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Side by side */}
      <section className="border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-[960px]">
          <p className="ch-eyebrow">Side by side</p>
          <h2 className="ch-display ch-display--sm mb-8">What each company publishes</h2>
          <div className="overflow-x-auto border border-[var(--ch-hairline)] bg-[var(--ch-paper)]">
            <table className="w-full min-w-[820px] text-left text-[14px]">
              <thead>
                <tr className="bg-[var(--ch-paper-alt)]">
                  <th className="p-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ch-muted)]">Company</th>
                  {cols.map(([h]) => (
                    <th key={h} className="p-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ch-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.companies.map((c) => (
                  <tr key={c.name} className={`border-t border-[var(--ch-hairline)] ${c.isUs ? "bg-[var(--ch-paper-alt)]" : ""}`}>
                    <td className="p-4 leading-[1.5] text-[var(--ch-ink)]">
                      <span className="mr-2 text-[var(--ch-muted)]">{c.rank}.</span>
                      {c.name}
                    </td>
                    {cols.map(([h, k]) => (
                      <td key={h} className="p-4 leading-[1.6] text-[var(--ch-muted)]">{String(c[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12.5px] text-[var(--ch-muted)]">
            Monthly prices as listed on each company&apos;s own website on {data.checkedOn}.
            &ldquo;Not stated on their site&rdquo; means we could not find it there, not that the
            company does not offer it.
          </p>
        </div>
      </section>

      {/* Method */}
      <section id="method" className="scroll-mt-28 px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-[860px]">
          <p className="ch-eyebrow">Method</p>
          <h2 className="ch-display ch-display--sm mb-6">How we ranked</h2>
          <p className="mb-4 text-[16px] leading-[1.8] text-[var(--ch-muted)]">
            The list includes every company we could confirm is actively offering home watch or second
            home care for absentee owners on 30A this month. Vacation rental managers are left out on
            purpose: they solve a different problem. Each company is judged on what an owner who lives
            out of town can check before hiring anyone:
          </p>
          <ul className="mb-6">
            {[
              "Published pricing. Can you see what it costs without a sales call?",
              "Price for the visit frequency most owners pick (bi-weekly and weekly).",
              "A report after every visit, stated plainly on the company's own site.",
              "A way to try the service first, like a free first visit.",
              "How local the company is to the homes it covers.",
            ].map((item) => (
              <li key={item} className="flex gap-3 border-t border-[var(--ch-hairline)] py-3.5 text-[15.5px] leading-[1.65] text-[var(--ch-ink)]">
                <span aria-hidden="true" className="mt-[9px] block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ch-teal)]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mb-4 text-[16px] leading-[1.8] text-[var(--ch-muted)]">
            Google ratings are not compared, because we could not read them for every company from a
            source we can link. Every company here is a real local option, and the &ldquo;best for&rdquo;
            line under each one says who it fits. If you run one of these companies and something is
            out of date, email{" "}
            <a href={`mailto:${siteData.contactEmail}`} className="underline underline-offset-4 hover:text-[var(--ch-ink)]">
              {siteData.contactEmail}
            </a>{" "}
            and it gets corrected.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-[860px] gap-10 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <h2 className="ch-display ch-display--sm mb-5">See the work before you pay for it.</h2>
            <p className="ch-lede mb-8 max-w-[46ch]">
              Send the address. Your first home check is free, and the photo report is yours to keep
              whether or not you sign up. You do not need to be in town.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/pricing" className="ch-btn ch-btn--solid">Plans and pricing</Link>
              <a href={`tel:${primaryPhone()}`} className="ch-btn">{primaryPhoneDisplay()}</a>
            </div>
          </div>
          <a href={siteData.gbpMapsUrl} target="_blank" rel="noopener" className="block text-[13px] text-[var(--ch-muted)] underline underline-offset-4 hover:text-[var(--ch-ink)]">
            {siteData.businessName}: {trustStats.ratingValue} on Google across {trustStats.reviewCount} reviews
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[var(--ch-hairline)] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[860px]">
          <p className="ch-eyebrow">Questions</p>
          <h2 className="ch-display ch-display--sm mb-10">Asked plainly.</h2>
          {data.faqs.map(({ q, a }) => (
            <div key={q} className="border-t border-[var(--ch-hairline)] py-7">
              <h3 className="mb-3 text-[17px] leading-[1.4] text-[var(--ch-ink)]">{q}</h3>
              <p className="text-[15px] leading-[1.75] text-[var(--ch-muted)]">{a}</p>
            </div>
          ))}
          <div className="mt-12 border-t border-[var(--ch-hairline)] pt-8">
            <p className="ch-label mb-4">Keep reading</p>
            <ul className="space-y-3">
              <li><Link href="/choosing-a-home-watch-company-30a" className="ch-link text-[15px]">How to choose a home watch company on 30A</Link></li>
              <li><Link href="/home-watch-vs-property-management-30a" className="ch-link text-[15px]">Home watch vs property management</Link></li>
              <li><Link href="/pricing" className="ch-link text-[15px]">Coastal Home Management 30A pricing</Link></li>
            </ul>
          </div>
          <LegalDisclaimer variant="inline" />
        </div>
      </section>
    </main>
  );
}
