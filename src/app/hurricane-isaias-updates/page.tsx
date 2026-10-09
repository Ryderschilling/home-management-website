import type { Metadata } from "next";
import Link from "next/link";
import { primaryPhone, primaryPhoneDisplay, siteData } from "@/data/siteData";
import { officialLinks, stormUpdates } from "@/data/stormUpdates";
import { FEED_REVALIDATE, getNews, getNhcStorms, getNwsAlerts } from "@/lib/stormFeeds";

// Hurricane Isaias live page, added 10/8/26. Server rendered, rebuilt by Next
// every FEED_REVALIDATE seconds from public feeds (src/lib/stormFeeds.ts), so it
// stays current with no cron. Ryder's own notes live in src/data/stormUpdates.ts.
// Keep the value literal here: Next reads route segment config statically.
export const revalidate = 300;

const SITE = "https://coastalhomemngt30a.com";
const PAGE_URL = `${SITE}/hurricane-isaias-updates`;
const TITLE = "Hurricane Isaias Updates for 30A";
const DESCRIPTION =
  "Live Hurricane Isaias updates for 30A, Watersound, Inlet Beach, Alys, Rosemary and South Walton: the latest National Hurricane Center advisory, active NWS alerts, and local news, refreshed every few minutes.";

export const metadata: Metadata = {
  title: `${TITLE} | Live Advisories, Alerts and News`,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL, type: "website", images: ["/img.png"] },
};

const fmt = (iso: string | null, withDay = true) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        ...(withDay ? { weekday: "short", month: "short", day: "numeric" } : {}),
        hour: "numeric",
        minute: "2-digit",
      }) + " CT"
    : "";

function ago(iso: string | null, now: number) {
  if (!iso) return "";
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.round(h / 24)} days ago`;
}

const SEVERITY_STYLE: Record<string, string> = {
  Extreme: "border-l-[#b42318]",
  Severe: "border-l-[#b42318]",
  Moderate: "border-l-[#b08226]",
};

export default async function HurricaneIsaiasUpdatesPage() {
  const [storms, alerts, news] = await Promise.all([getNhcStorms(), getNwsAlerts(), getNews()]);
  const builtAt = new Date();
  const now = builtAt.getTime();
  const isaias = storms.find((s) => s.name.toLowerCase() === "isaias");
  const otherStorms = storms.filter((s) => s !== isaias);

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": PAGE_URL,
    url: PAGE_URL,
    name: TITLE,
    description: DESCRIPTION,
    dateModified: builtAt.toISOString(),
    about: { "@type": "Event", name: "Hurricane Isaias", location: { "@type": "Place", name: "Scenic 30A, Walton County, Florida" } },
    publisher: { "@type": "LocalBusiness", "@id": `${SITE}/#business`, name: siteData.businessName, url: SITE },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: TITLE, item: PAGE_URL },
      ],
    },
  };

  return (
    <main className="bg-[var(--ch-paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="fade-section bg-[var(--ch-paper)] px-4 pt-28 pb-12 md:px-8 md:pt-36 md:pb-14">
        <div className="mx-auto max-w-[1100px]">
          <p className="ch-eyebrow reveal-item">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[#b42318] align-middle" aria-hidden="true" />
            Live · refreshes every {Math.round(FEED_REVALIDATE / 60)} minutes
          </p>
          <h1 className="ch-display mb-8 max-w-[16ch]">Hurricane Isaias updates for 30A</h1>
          <span className="ch-draw mb-8 block h-px w-24 bg-[var(--ch-teal)]" />
          <p className="ch-lede reveal-item max-w-[62ch]">
            The latest from the National Hurricane Center, every active weather alert for South Walton and the
            Inlet Beach line, and the newest local headlines, in one place. Pulled straight from the official
            sources, so check back or refresh any time.
          </p>
          <p className="mt-6 text-[13px] text-[var(--ch-muted)]">
            Last refreshed {fmt(builtAt.toISOString())}. Sources: NOAA National Hurricane Center, National Weather
            Service, Google News. Follow official evacuation orders over anything on this page.
          </p>
        </div>
      </section>

      {/* ── From us ──────────────────────────────────────────────────────── */}
      <section className="px-4 md:px-8">
        <div className="mx-auto max-w-[1100px] border-l-2 border-[var(--ch-teal)] bg-[var(--ch-paper-alt)] p-6 md:p-8">
          <p className="ch-label mb-4">From Coastal Home Management 30A</p>
          {stormUpdates.map((u) => (
            <div key={u.at} className="mb-4 last:mb-0">
              <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--ch-muted)]">{fmt(u.at)}</p>
              <p className="mt-1.5 text-[16px] leading-[1.75] text-[var(--ch-ink)] md:text-[17px]">{u.text}</p>
            </div>
          ))}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/storm-check" className="ch-btn ch-btn--solid">Get my home checked</Link>
            <a href={`tel:${primaryPhone()}`} className="ch-btn">{primaryPhoneDisplay()}</a>
          </div>
        </div>
      </section>

      {/* ── NHC ──────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--ch-paper)] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1100px]">
          <p className="ch-label mb-3">National Hurricane Center</p>
          <h2 className="ch-display ch-display--sm mb-8">The latest advisory</h2>
          {isaias ? (
            <div className="border border-[var(--ch-hairline)] p-6 md:p-8">
              <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--ch-muted)]">
                {isaias.type ? `${isaias.type} ` : ""}{isaias.name} · issued {fmt(isaias.issued)}
              </p>
              {isaias.headline && (
                <p className="mt-4 text-[18px] leading-[1.5] text-[var(--ch-ink)] md:text-[20px]">{isaias.headline}</p>
              )}
              <p className="mt-4 text-[16px] leading-[1.8] text-[var(--ch-muted)]">{isaias.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {isaias.links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener" className="border border-[var(--ch-hairline-2)] px-4 py-2 text-[12px] text-[var(--ch-muted)] transition-colors hover:border-[var(--ch-ink)] hover:text-[var(--ch-ink)]">
                    {l.title}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-[var(--ch-hairline)] p-6 md:p-8">
              <p className="text-[16px] leading-[1.8] text-[var(--ch-muted)]">
                The National Hurricane Center is not issuing advisories on Isaias right now. If the storm has passed,
                that is the reason. See the{" "}
                <a href="https://www.nhc.noaa.gov/" target="_blank" rel="noopener" className="underline underline-offset-4">NHC site</a>{" "}
                for the full record.
              </p>
            </div>
          )}
          {otherStorms.length > 0 && (
            <p className="mt-6 text-[14px] text-[var(--ch-muted)]">
              Also active in the Atlantic and Gulf: {otherStorms.map((s) => `${s.type} ${s.name}`.trim()).join(", ")}.
            </p>
          )}
        </div>
      </section>

      {/* ── NWS alerts ───────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1100px]">
          <p className="ch-label mb-3">National Weather Service</p>
          <h2 className="ch-display ch-display--sm mb-3">Active alerts for 30A</h2>
          <p className="mb-8 text-[14px] text-[var(--ch-muted)]">South Walton and the coastal Bay County line. Tap an alert for the full text.</p>
          {alerts === null ? (
            <p className="text-[15px] text-[var(--ch-muted)]">
              The weather service did not answer this refresh. Check{" "}
              <a href="https://www.weather.gov/tae/" target="_blank" rel="noopener" className="underline underline-offset-4">NWS Tallahassee</a> directly.
            </p>
          ) : alerts.length === 0 ? (
            <p className="text-[15px] text-[var(--ch-muted)]">No active alerts for 30A right now.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <details key={a.id} className={`group border border-[var(--ch-hairline)] border-l-4 bg-[var(--ch-paper)] ${SEVERITY_STYLE[a.severity] ?? "border-l-[var(--ch-teal)]"}`}>
                  <summary className="cursor-pointer list-none p-5 md:p-6">
                    <p className="text-[18px] leading-tight text-[var(--ch-ink)]">{a.event}</p>
                    <p className="mt-2 line-clamp-2 text-[13.5px] leading-[1.6] text-[var(--ch-muted)]">
                      {a.ends ? `Until ${fmt(a.ends)} · ` : ""}{a.areas}
                    </p>
                    <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-[var(--ch-teal)] group-open:hidden">Read the alert</p>
                  </summary>
                  <div className="border-t border-[var(--ch-hairline)] p-5 md:p-6">
                    <p className="whitespace-pre-line text-[14.5px] leading-[1.75] text-[var(--ch-ink)]">{a.description}</p>
                    {a.instruction && (
                      <p className="mt-4 whitespace-pre-line text-[14.5px] leading-[1.75] text-[var(--ch-muted)]">{a.instruction}</p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── News ─────────────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1100px]">
          <p className="ch-label mb-3">Local news</p>
          <h2 className="ch-display ch-display--sm mb-3">Latest headlines</h2>
          <p className="mb-8 text-[14px] text-[var(--ch-muted)]">Each headline opens the original story from the publisher.</p>
          {news.length === 0 ? (
            <p className="text-[15px] text-[var(--ch-muted)]">Headlines could not be loaded this refresh. Try again in a few minutes.</p>
          ) : (
            <ul>
              {news.map((n) => (
                <li key={n.url} className="border-t border-[var(--ch-hairline)]">
                  <a href={n.url} target="_blank" rel="noopener" className="group block py-5">
                    <p className="text-[17px] leading-[1.45] text-[var(--ch-ink)] group-hover:text-[var(--ch-teal)]">{n.title}</p>
                    <p className="mt-1.5 text-[12.5px] text-[var(--ch-muted)]">
                      {n.source}{n.published ? ` · ${ago(n.published, now)}` : ""}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Official links ───────────────────────────────────────────────── */}
      <section className="border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1100px]">
          <p className="ch-label mb-3">Keep these open</p>
          <h2 className="ch-display ch-display--sm mb-8">Official sources</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {officialLinks.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener" className="group block border border-[var(--ch-hairline)] bg-[var(--ch-paper)] p-5 transition-colors hover:border-[var(--ch-teal)]">
                <p className="text-[18px] leading-tight text-[var(--ch-ink)] group-hover:text-[var(--ch-teal)]">{l.name}</p>
                <p className="mt-2 text-[14px] leading-[1.6] text-[var(--ch-muted)]">{l.note}</p>
              </a>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-[var(--ch-muted)]">In an emergency, call 911.</p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <h2 className="ch-display ch-display--sm mb-5">Not in town? We will check the house.</h2>
            <p className="ch-lede mb-8 max-w-[50ch]">
              Once roads are safe, Ryder walks your home inside and out and emails dated photos the same day. Owners
              on a year-round plan never have to ask: same person, every visit, before and after every storm.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/storm-check" className="ch-btn ch-btn--solid">Request a Storm Check</Link>
              <Link href="/pricing" className="ch-btn">Year-round plans</Link>
            </div>
          </div>
          <div>
            <p className="ch-label mb-4">Storm guides</p>
            <ul className="space-y-3">
              <li><Link href="/after-hurricane-isaias-30a" className="ch-link text-[15px]">After Isaias: checking on your 30A home</Link></li>
              <li><Link href="/who-to-call-storm-prep-30a" className="ch-link text-[15px]">Who to call to prep your second home</Link></li>
              <li><Link href="/storm-prep-30a" className="ch-link text-[15px]">Storm prep for 30A homeowners</Link></li>
              <li><Link href="/vacation-home-storm-prep-30a" className="ch-link text-[15px]">Storm prep for a vacation home</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
