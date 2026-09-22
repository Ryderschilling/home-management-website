import type { Metadata } from "next";
import Link from "next/link";
import AwayBookingFlow from "@/components/AwayBookingFlow";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { primaryPhone, primaryPhoneDisplay, trustStats } from "@/data/siteData";

// Away on 30A, the Meta ads landing page (9/21/26). Offer approved by Ryder:
// Essential $200/mo bi-weekly, free first walkthrough (in person, FaceTime, or
// solo with a report), "Love your first month or it's free."
// Copy rules: never "inspection", "monitoring", "security" or "patrol". No
// insurance discount language. The yearly record line mentions an agent or
// adjuster, so this page renders <LegalDisclaimer />.
// noindex on purpose: it is a paid-traffic page and repeats the homepage offer.

const PAGE_URL = "https://coastalhomemngt30a.com/away-on-30a";

export const metadata: Metadata = {
  title: "Away on 30A: Your Home, Checked Every Two Weeks",
  description:
    "A walkthrough of your 30A second home every two weeks with a photo report to your phone the same day. $200 a month. First walkthrough free, first month guaranteed.",
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Away on 30A: Your Home, Checked Every Two Weeks",
    description: "Walk in to exactly how you left it. First walkthrough free, in person or on FaceTime.",
    url: PAGE_URL,
    images: ["/img.png"],
  },
};

const INCLUDED = [
  "A walkthrough every two weeks, inside and out",
  "Photo report to your phone the same day",
  "A check after every named storm",
  "A dated yearly record of every visit, ready for your agent or adjuster",
  "One local owner, one direct line: Ryder",
];

const STEPS = [
  { n: "01", t: "Pick a Tuesday or Thursday", b: "Takes about a minute. Ryder texts you to lock in the exact time." },
  { n: "02", t: "Ryder walks your home", b: "With you in person, together on FaceTime, or on his own if you are out of town." },
  { n: "03", t: "You get the photo report", b: "Same day, yours to keep. Then you decide if you want it every two weeks." },
];

const FAQ = [
  { q: "Do I need to be in town?", a: "No. Most owners are not. Ryder can walk the home on his own and send the photo report, or walk it with you on FaceTime." },
  { q: "What does the free walkthrough cost?", a: "Nothing, and there is no commitment. The photo report is yours to keep whether you sign up or not." },
  { q: "What does \"love your first month or it's free\" mean?", a: "If you sign up for Essential and you are not happy with your first month, tell Ryder and that month is not charged." },
  { q: "What if my home needs more than every two weeks?", a: "Homes with a pool, irrigation, older plumbing, or long empty stretches often do better with a weekly walkthrough. That is Home Watch at $300 a month. Ryder will tell you straight which one your home actually needs." },
  { q: "Which areas do you cover?", a: "Watersound Origins, Naturewalk, Inlet Beach, Alys Beach, Rosemary Beach, Seacrest and the rest of scenic 30A." },
];

export default function AwayOn30APage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <main className="bg-[var(--ch-paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── Hero + booking ─────────────────────────────────────────────── */}
      <section id="book" className="fade-section bg-[var(--ch-paper)] px-4 pt-28 pb-16 md:px-8 md:pt-36 md:pb-24">
        <div className="mx-auto grid max-w-[1240px] items-start gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="ch-eyebrow reveal-item">Away on 30A</p>
            <h1 className="ch-display mb-8 max-w-[16ch]">
              <span className="ch-mask"><span>Your home, checked</span></span>
              <span className="ch-mask"><span>every two weeks</span></span>
              <span className="ch-mask"><span>while you&apos;re away.</span></span>
            </h1>
            <span className="ch-draw mb-8 block h-px w-24 bg-[var(--ch-teal)]" />
            <p className="ch-lede reveal-item mb-8 max-w-[48ch]">
              Walk in to exactly how you left it. Start with a free walkthrough of your home, in
              person or on FaceTime. You do not need to be in town.
            </p>
            <p className="ch-label reveal-item !text-[var(--ch-soft)]">
              {trustStats.ratingValue} on Google · {trustStats.reviewCount} reviews · Insured Florida LLC · Local to Watersound Origins
            </p>
          </div>
          <div className="reveal-item">
            <AwayBookingFlow />
            {/* Direct line for owners who do not want a walkthrough (added 9/22/26).
                Real tel:/sms:/mailto: links so Pulse and GA4 count the tap. */}
            <div className="mt-5 border border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] p-6 md:p-7">
              <p className="ch-label mb-2">Rather just talk?</p>
              <p className="mb-5 text-[15px] leading-[1.6] text-[var(--ch-ink)]">
                Skip the walkthrough and reach Ryder directly. Questions, pricing, or a one-off favor.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={`sms:${primaryPhone()}`} className="ch-btn ch-btn--solid">Text Ryder</a>
                <a href={`tel:${primaryPhone()}`} className="ch-btn">Call {primaryPhoneDisplay()}</a>
                <a href="mailto:coastalhomemanagement30a@gmail.com?subject=Question%20about%20my%2030A%20home" className="ch-btn">Email</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The offer ──────────────────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-[1240px] gap-12 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="ch-label mb-3">Essential</p>
            <p className="text-[64px] leading-none tracking-[-0.03em] text-[var(--ch-ink)]" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 112, 'wght' 620" }}>
              $200<span className="text-[22px] text-[var(--ch-muted)]">/mo</span>
            </p>
            <p className="mt-6 max-w-[34ch] text-[20px] leading-[1.4] text-[var(--ch-ink)]">Love your first month or it&apos;s free.</p>
            <a href="#book" className="ch-btn ch-btn--solid mt-8">Book My Free Walkthrough</a>
          </div>
          <ul>
            {INCLUDED.map((t) => (
              <li key={t} className="flex gap-4 border-t border-[var(--ch-hairline)] py-5 text-[16px] leading-[1.6] text-[var(--ch-ink)]">
                <span className="mt-[9px] block h-px w-5 shrink-0 bg-[var(--ch-teal)]" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1240px]">
          <p className="ch-eyebrow reveal-item">How it works</p>
          <h2 className="ch-display ch-display--sm mb-12 max-w-[22ch]">Three steps, and you never have to fly in.</h2>
          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t border-[var(--ch-hairline-2)] pt-6">
                <p className="ch-label mb-4 !text-[var(--ch-teal)]">{s.n}</p>
                <h3 className="mb-3 text-[20px] leading-[1.3] text-[var(--ch-ink)]">{s.t}</h3>
                <p className="text-[15px] leading-[1.7] text-[var(--ch-muted)]">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who ────────────────────────────────────────────────────────── */}
      <section className="fade-section ch-deep-band px-4 py-20 text-white md:px-8 md:py-28">
        <div className="mx-auto max-w-[860px]">
          <p className="ch-eyebrow ch-eyebrow--light reveal-item">Who shows up</p>
          <p className="text-[clamp(22px,2.6vw,32px)] leading-[1.4]">
            I&apos;m Ryder. I live in Watersound Origins and I check on 30A homes while their owners
            are somewhere else. Every visit gets dated photos sent to your phone, and you always
            text the same person.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#book" className="ch-btn ch-btn--solid">Book My Free Walkthrough</a>
            <a href={`tel:${primaryPhone()}`} className="ch-btn !border-white/40 !text-white">{primaryPhoneDisplay()}</a>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper)] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[860px]">
          <p className="ch-eyebrow reveal-item">Questions</p>
          <h2 className="ch-display ch-display--sm mb-10">Plain answers.</h2>
          {FAQ.map(({ q, a }) => (
            <div key={q} className="border-t border-[var(--ch-hairline)] py-7">
              <h3 className="mb-3 text-[17px] leading-[1.4] text-[var(--ch-ink)]">{q}</h3>
              <p className="text-[14.5px] leading-[1.75] text-[var(--ch-muted)]">{a}</p>
            </div>
          ))}
          <p className="mt-8 text-[14px] text-[var(--ch-muted)]">
            Want to compare every plan? <Link href="/pricing" className="underline underline-offset-4">See pricing</Link>.
          </p>
          <LegalDisclaimer variant="inline" />
        </div>
      </section>
    </main>
  );
}
