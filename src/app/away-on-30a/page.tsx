import type { Metadata } from "next";
import Image from "next/image";
import OptInForm from "@/components/away/OptInForm";
import { trustStats, testimonials, siteData } from "@/data/siteData";

// Away on 30A, page 1 of 2 (simplified 9/28/26 at Ryder's direction).
// Headline, the pool photo, one email box, then the reasons, then the footer.
// The reasons follow Hormozi's value equation: the result they want, proof it
// happens, how fast they see it, and how little they have to do.
// Copy rules: never promise Ryder will call. Never "inspection", "monitoring",
// "security" or "patrol". No insurance language on this page (so it needs no
// disclaimer). noindex: paid-traffic page.

const PAGE_URL = "https://coastalhomemngt30a.com/away-on-30a";

export const metadata: Metadata = {
  title: "Own a Home on 30A? Know It's Fine Without Flying Down.",
  description: "What Coastal Home Management does for 30A second homes while you're away. Put in your email and see how it works.",
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Own a home on 30A? Know it's fine without flying down.",
    description: "See what we do for 30A second homes while the owners are away.",
    url: PAGE_URL,
    images: ["/ryder-at-work.jpg"],
  },
};

/** Hormozi's value equation, in the owner's words. */
const REASONS = [
  {
    k: "What you get",
    t: "Walk in to exactly how you left it.",
    b: "Your house gets walked inside and out on the schedule you pick. Leaks, AC trouble, storm damage and packages on the porch get caught while they are still small.",
  },
  {
    k: "Why it works",
    t: "You see every visit, not a promise.",
    b: `Dated photos after every walkthrough. ${trustStats.activeHomes} homes on 30A already do it this way, rated 5 stars on Google. Love your first month or it's free.`,
  },
  {
    k: "How fast",
    t: "The same day, every time.",
    b: "The photo report hits your phone before Ryder leaves the driveway. You never wait until the end of the month to find out.",
  },
  {
    k: "What you do",
    t: "Nothing. Not even fly in.",
    b: "No app, no login, no scheduling. It's a text from the same local guy every time. You don't need to be in town to start.",
  },
];

const STATS = [
  ["5-star", "on Google"],
  [trustStats.activeHomes, "30A homes cared for"],
  [trustStats.propertiesManaged, "in property looked after"],
  ["Same day", "photo report, every visit"],
];

export default function AwayOn30APage() {
  return (
    <main className="bg-[var(--ch-paper)]">
      {/* ── Headline, photo, the one ask ───────────────────────────────── */}
      <section className="px-4 pt-28 pb-16 md:px-8 md:pt-36 md:pb-24">
        <div className="mx-auto max-w-[980px] text-center">
          <p className="ch-eyebrow ch-eyebrow--center">For 30A second-home owners</p>
          <h1 className="ch-display mx-auto mb-10 max-w-[17ch]">Own a home on 30A? Know it&apos;s fine without flying down.</h1>

          <div className="relative mx-auto mb-10 aspect-[16/9] w-full overflow-hidden border border-[var(--ch-hairline)]">
            <Image
              src="/ryder-at-work.jpg"
              alt="Ryder cleaning the pool at a 30A home"
              fill
              priority
              sizes="(min-width: 1024px) 980px, 100vw"
              className="object-cover"
            />
          </div>

          <p className="ch-lede mx-auto mb-7 max-w-[44ch]">
            Put in your email to see what we do for 30A homes while their owners are away.
          </p>
          <div className="mx-auto flex max-w-[560px] justify-center">
            <OptInForm id="optin-top" />
          </div>
        </div>
      </section>

      {/* ── Social proof: the three live Google reviews ─────────────────── */}
      {/* Quotes come from testimonials in siteData (the GBP reviews). Never edit them here. */}
      <section className="border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="ch-eyebrow">From our clients</p>
              <h2 className="ch-display ch-display--sm max-w-[20ch]">Don&apos;t just listen to us. Hear what our clients have to say.</h2>
            </div>
            <a
              href={siteData.gbpMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-4 self-start border border-[var(--ch-hairline-2)] bg-[var(--ch-paper)] px-5 py-4 md:self-auto"
              aria-label={`Rated ${trustStats.ratingValue} out of 5 on Google`}
            >
              <span className="text-[34px] leading-none tracking-[-0.02em] text-[var(--ch-ink)]" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 110, 'wght' 650" }}>
                {trustStats.ratingValue}
              </span>
              <span className="flex flex-col gap-1.5">
                <ReviewStars size={15} />
                <span className="text-[13px] text-[var(--ch-muted)]">5-star rated on Google</span>
              </span>
            </a>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.author} className="flex flex-col border border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] p-7 md:p-8">
                <ReviewStars size={13} />
                <blockquote className="mt-5 flex-1 text-[16px] leading-[1.6] tracking-[-0.01em] text-[var(--ch-ink)]">&ldquo;{t.body}&rdquo;</blockquote>
                <figcaption className="mt-6 border-t border-[var(--ch-hairline)] pt-4">
                  <p className="text-[14px] font-semibold text-[var(--ch-ink)]">{t.author}</p>
                  <p className="text-[13px] text-[var(--ch-muted)]">Google review</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why owners use us ──────────────────────────────────────────── */}
      <section className="border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1240px]">
          <p className="ch-eyebrow">Why owners use us</p>
          <h2 className="ch-display ch-display--sm mb-12 max-w-[22ch]">Peace of mind, without lifting a finger.</h2>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((r) => (
              <div key={r.k} className="border-t border-[var(--ch-hairline-2)] pt-6">
                <p className="ch-label mb-4 !text-[var(--ch-teal)]">{r.k}</p>
                <h3 className="mb-3 text-[20px] leading-[1.3] text-[var(--ch-ink)]">{r.t}</h3>
                <p className="text-[15px] leading-[1.7] text-[var(--ch-muted)]">{r.b}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-2 gap-px border border-[var(--ch-hairline)] bg-[var(--ch-hairline)] md:grid-cols-4">
            {STATS.map(([n, l]) => (
              <div key={l} className="bg-[var(--ch-paper)] px-6 py-7">
                <p className="mb-1 text-[34px] leading-none tracking-[-0.02em] text-[var(--ch-ink)]" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 110, 'wght' 620" }}>
                  {n}
                </p>
                <p className="text-[13px] text-[var(--ch-muted)]">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The ask, once more ─────────────────────────────────────────── */}
      <section className="ch-deep-band px-4 py-20 text-white md:px-8 md:py-24">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="mb-8 text-[clamp(24px,3vw,36px)] leading-[1.25]">See what we&apos;d do for your house.</h2>
          <div className="mx-auto flex max-w-[560px] justify-center">
            <OptInForm id="optin-bottom" dark />
          </div>
        </div>
      </section>
    </main>
  );
}

function ReviewStars({ size }: { size: number }) {
  return (
    <span className="flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12" fill="var(--ch-teal)">
          <path d="M6 0l1.6 3.9L12 4.4 8.8 7.2l1 4.4L6 9.3 2.2 11.6l1-4.4L0 4.4l4.4-.5z" />
        </svg>
      ))}
    </span>
  );
}
