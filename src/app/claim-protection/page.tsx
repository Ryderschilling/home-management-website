import type { Metadata } from "next";
import Link from "next/link";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { protectionServices } from "@/data/protection";
import { primaryPhone, primaryPhoneDisplay } from "@/data/siteData";

// Read src/data/protection.ts before editing any copy on this page.
// There is a hard line here and it is documented at the top of that file.

export const metadata: Metadata = {
  title: "Claim Protection for Empty 30A Homes",
  description:
    "Most water claims on empty Florida second homes are denied on timing, not on coverage. Here is how a dated, photographed visit record protects the claim, and what an automatic water shutoff actually does.",
  alternates: { canonical: "https://coastalhomemngt30a.com/claim-protection" },
  keywords:
    "empty house water damage claim Florida, home watch insurance claim documentation, 14 day seepage exclusion Florida, unoccupied home insurance 30A, water shutoff valve second home",
  openGraph: {
    title: "Claim Protection for Empty 30A Homes | CHM 30A",
    description:
      "Undetected water is what turns a $2,000 repair into a $40,000 one you pay yourself. Here is exactly how documentation and an automatic shutoff change that.",
    url: "https://coastalhomemngt30a.com/claim-protection",
    images: ["/img.png"],
  },
};

const FAQ = [
  {
    q: "Does a home watch service lower my homeowners insurance premium?",
    a: "No. No insurance carrier in the United States offers a premium discount for hiring a home watch company, and any company telling you otherwise cannot name the carrier. What documented visits do is protect the claim itself. Separately, an automatic water shutoff device does carry a published premium credit at some carriers, including PURE. That credit comes from your carrier and attaches to the device, not to our service. Ask your agent whether your carrier files one.",
  },
  {
    q: "Is my insurance void while my Florida second home sits empty?",
    a: "Usually not. Most Florida policies trigger on the word vacant, which is defined as lacking furnishings, utilities, and amenities. A furnished second home with the power and water on is normally unoccupied rather than vacant, and fire and wind coverage stay in force. Your policy is the thing that decides this, so read your form or ask your agent.",
  },
  {
    q: "Why do water damage claims on empty houses get denied?",
    a: "Almost always on timing rather than on coverage. Florida policies commonly exclude damage from constant or repeated seepage or leakage of water over a period of 14 or more days, and mold is typically capped at $10,000. A slow supply line or condensate leak in an empty house runs well past 14 days and blows through the mold cap before anyone knows it started.",
  },
  {
    q: "How does a written visit record help with a claim?",
    a: "It fixes dates. In Hicks v. American Integrity, a Florida appeals court held that the insurer carries the burden of proving the seepage exclusion applies and must apportion which damage happened after day 14. A dated record showing an area was dry on a specific date makes that very hard for a carrier to do. Separately, Florida Statute 627.70132 bars a claim reported more than one year after the date of loss, and for hidden damage in an empty house that date is otherwise difficult to establish.",
  },
  {
    q: "What does an automatic water shutoff valve actually do?",
    a: "It sits on your main water line and watches flow around the clock. When it sees a burst or a leak that keeps running, it closes the line by itself, which ends the damage instead of letting it run for weeks. We hold the alerts, so someone local goes to the house and confirms what happened.",
  },
  {
    q: "Are you an insurance agent or a home inspector?",
    a: "No, and we do not want to be mistaken for one. Coastal Home Management 30A provides property visits and documentation. We are not licensed home inspectors, insurance agents, or adjusters, and nothing we publish is advice about your coverage. For anything about your policy, talk to your agent.",
  },
];

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="border-t border-[var(--ch-hairline)] pt-5">
      <p
        className="text-[38px] leading-none tracking-[-0.03em] text-[var(--ch-ink)] md:text-[46px]"
        style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 112, 'wght' 620" }}
      >
        {n}
      </p>
      <p className="mt-3 text-[13.5px] leading-[1.6] text-[var(--ch-muted)]">{label}</p>
    </div>
  );
}

export default function ClaimProtectionPage() {
  const { shutoff, coverageRecord } = protectionServices;

  return (
    <main className="bg-[var(--ch-paper)]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="fade-section relative overflow-hidden bg-[var(--ch-paper)] px-4 pt-28 pb-20 md:px-8 md:pt-36 md:pb-28">
        <div className="mx-auto max-w-[1240px]">
          <p className="ch-eyebrow reveal-item">Why the record matters</p>

          <h1 className="ch-display mb-8 max-w-[18ch]">
            <span className="ch-mask">
              <span>Most claims on empty</span>
            </span>
            <span className="ch-mask">
              <span>houses are lost on</span>
            </span>
            <span className="ch-mask">
              <span>timing, not coverage.</span>
            </span>
          </h1>

          <span className="ch-draw mb-9 block h-px w-24 bg-[var(--ch-teal)]" />

          <p className="ch-label reveal-item mb-6 !text-[var(--ch-soft)]">
            Insured Florida LLC · Watersound Origins · Alys · Rosemary · Scenic 30A
          </p>

          <p className="ch-lede reveal-item max-w-[62ch]">
            A supply line lets go in March. You find it in May. The repair was never the
            expensive part. The expensive part is the two months nobody could account for,
            because that is the gap your carrier gets to argue about. Everything below is
            about closing that gap.
          </p>

          <div className="reveal-item mt-11 flex flex-wrap items-center gap-4">
            <Link href="/pricing" className="ch-btn ch-btn--solid">
              See what&apos;s included
            </Link>
            <a href={`tel:${primaryPhone()}`} className="ch-btn">
              {primaryPhoneDisplay()}
            </a>
          </div>
        </div>
      </section>

      {/* ── The three real mechanisms ─────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[1240px]">
          <p className="ch-eyebrow reveal-item">01 · What actually goes wrong</p>
          <h2 className="ch-display ch-display--sm mb-7 max-w-[20ch]">
            <span className="ch-mask">
              <span>Three lines in your</span>
            </span>
            <span className="ch-mask">
              <span>policy do the damage.</span>
            </span>
          </h2>

          <p className="ch-lede reveal-item mb-14 max-w-[62ch]">
            None of these are secrets and none of them are unfair. They are standard terms
            that assume somebody is in the house. Nobody is in yours.
          </p>

          <div className="grid gap-10 md:grid-cols-3">
            <Stat
              n="14 days"
              label="Florida policies commonly exclude damage from constant or repeated seepage or leakage of water over a period of 14 or more days. A slow leak in an empty house passes that line before anyone notices."
            />
            <Stat
              n="$10,000"
              label="The usual Florida cap on mold. Remediation on a coastal house that sat wet for weeks runs well past it, and carriers may charge their own investigation cost against that same cap."
            />
            <Stat
              n="1 year"
              label="Florida Statute 627.70132 bars a claim reported more than one year after the date of loss. For hidden damage in an empty house, proving when the loss started is the whole fight."
            />
          </div>
        </div>
      </section>

      {/* ── What the record does ─────────────────────────────────────────── */}
      <section className="fade-section bg-[var(--ch-paper)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto grid max-w-[1240px] gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
          <div>
            <p className="ch-eyebrow reveal-item">02 · What we do about it</p>
            <h2 className="ch-display ch-display--sm mb-7">
              <span className="ch-mask">
                <span>A date on the page</span>
              </span>
              <span className="ch-mask">
                <span>is worth more than</span>
              </span>
              <span className="ch-mask">
                <span>an adjective.</span>
              </span>
            </h2>

            <span className="ch-draw mb-9 block h-px w-24 bg-[var(--ch-teal)]" />

            <p className="ch-lede reveal-item mb-6 max-w-[58ch]">
              Every visit we make is dated and photographed, and the report says what was
              checked, including the areas that were dry and fine. That last part is the
              part almost nobody does, and it is the part that matters.
            </p>
            <p className="reveal-item max-w-[58ch] text-[15px] leading-[1.75] text-[var(--ch-muted)]">
              In <em>Hicks v. American Integrity Insurance Company of Florida</em>, a Florida
              appeals court held that when a carrier wants to use the seepage exclusion, the
              carrier carries the burden of proving it, and has to apportion which damage
              happened after day fourteen. If the record shows your guest bath ceiling was dry
              on the fourth and stained on the eighteenth, that apportionment is close to
              impossible. The same dated record is what establishes a date of loss inside the
              one-year deadline.
            </p>
            <p className="reveal-item mt-6 max-w-[58ch] text-[15px] leading-[1.75] text-[var(--ch-muted)]">
              Worth being plain about the limit: documentation does not create coverage and it
              does not override an exclusion. It is evidence. Evidence is what these arguments
              turn on.
            </p>
          </div>

          <div className="lg:pt-24">
            <div className="ch-card p-8 md:p-10">
              <p className="ch-label !text-[var(--ch-teal)] mb-6">What a visit record has to contain to be worth anything</p>
              <ul className="space-y-0">
                {[
                  ["A real date", "On every visit, recorded when the visit happened, not typed in later."],
                  ["Named areas", "Kitchen, primary bath, laundry, water heater, under every sink. Named, not summarized."],
                  ["The dry ones too", "&quot;Visit completed&quot; proves nothing. &quot;Primary bath ceiling: dry&quot; proves a lot."],
                  ["Photos attached", "To the visit and the area they came from, so the sequence holds up."],
                ].map(([k, v]) => (
                  <li
                    key={k}
                    className="grid grid-cols-[120px_1fr] gap-5 border-t border-[var(--ch-hairline)] py-4 first:border-t-0 first:pt-0"
                  >
                    <span className="ch-label !text-[var(--ch-ink)] pt-[3px]">{k}</span>
                    <span
                      className="text-[14px] leading-[1.65] text-[var(--ch-muted)]"
                      dangerouslySetInnerHTML={{ __html: v }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── The two services ─────────────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[1240px]">
          <p className="ch-eyebrow reveal-item">03 · The two pieces</p>
          <h2 className="ch-display ch-display--sm mb-7 max-w-[20ch]">
            <span className="ch-mask">
              <span>Included in Coastal Elite.</span>
            </span>
            <span className="ch-mask">
              <span>Add them to any plan.</span>
            </span>
          </h2>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {[shutoff, coverageRecord].map((s) => (
              <div key={s.name} className="ch-card flex flex-col p-8 md:p-10">
                <p className="ch-label !text-[var(--ch-teal)]">{s.name}</p>
                <p className="mt-4 text-[17px] leading-[1.55] text-[var(--ch-ink)]">{s.short}</p>
                <p className="mt-5 text-[14.5px] leading-[1.75] text-[var(--ch-muted)]">{s.body}</p>
                <ul className="mt-7 space-y-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-[14px] leading-[1.6] text-[var(--ch-muted)]">
                      <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--ch-teal)]" />
                      {b}
                    </li>
                  ))}
                </ul>
                <p className="mt-8 border-t border-[var(--ch-hairline)] pt-5 text-[13.5px] text-[var(--ch-muted)]">
                  {"installPriceLabel" in s
                    ? `${s.installPriceLabel}, then ${s.monitoringPriceLabel} to monitor and respond. Monitoring is included on Coastal Elite.`
                    : `${s.annualPriceLabel}. Included on Coastal Elite.`}
                </p>
              </div>
            ))}
          </div>

          <div className="reveal-item mt-12">
            <Link href="/pricing" className="ch-btn ch-btn--solid">
              Compare the plans
            </Link>
          </div>
        </div>
      </section>

      {/* ── What we will not claim ───────────────────────────────────────── */}
      <section className="fade-section bg-[var(--ch-paper)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[860px]">
          <p className="ch-eyebrow reveal-item">04 · Being straight with you</p>
          <h2 className="ch-display ch-display--sm mb-7">
            <span className="ch-mask">
              <span>What we will not</span>
            </span>
            <span className="ch-mask">
              <span>tell you.</span>
            </span>
          </h2>

          <span className="ch-draw mb-9 block h-px w-24 bg-[var(--ch-teal)]" />

          <p className="ch-lede reveal-item mb-8">
            You will find home watch companies claiming their service lowers your insurance
            bill. We checked. It does not, anywhere in the country, at any carrier.
          </p>

          <ul className="space-y-5">
            {[
              "We will not tell you we lower your premium. No US carrier gives a discount for home watch, and none of the companies claiming it can name one.",
              "We will not call ourselves a second insurance policy. We are not insurance and the comparison is not honest.",
              "We will not say any carrier requires, approves, or endorses us. None do.",
              "We will not call our visits inspections. Home inspection is a licensed profession in Florida with a specific legal meaning, and we are not licensed for it.",
              "We will not tell you what your policy covers. That is your agent's job, and they are the one who can actually read your form.",
            ].map((t) => (
              <li
                key={t}
                className="border-t border-[var(--ch-hairline)] pt-5 text-[15px] leading-[1.75] text-[var(--ch-muted)]"
              >
                {t}
              </li>
            ))}
          </ul>

          <p className="reveal-item mt-10 text-[15px] leading-[1.75] text-[var(--ch-ink)]">
            One thing that is true and worth acting on: several carriers, PURE among them, do
            publish a premium credit for an automatic water shutoff device, and PURE names
            seasonal and unoccupied homes as exactly the reason. That credit comes from your
            carrier and attaches to the device. Call your agent and ask. If the answer is yes,
            the device pays for part of itself.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="fade-section border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[860px]">
          <p className="ch-eyebrow reveal-item">Questions</p>
          <h2 className="ch-display ch-display--sm mb-12">
            <span className="ch-mask">
              <span>The honest answers.</span>
            </span>
          </h2>

          <div className="space-y-0">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="border-t border-[var(--ch-hairline)] py-7">
                <h3 className="mb-3 text-[17px] leading-[1.4] text-[var(--ch-ink)]">{q}</h3>
                <p className="text-[14.5px] leading-[1.75] text-[var(--ch-muted)]">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="ch-deep-band fade-section px-4 py-24 text-white md:px-8 md:py-28">
        <div className="mx-auto max-w-[860px] text-center">
          <h2 className="ch-display ch-display--sm ch-display--light mb-7">
            <span className="ch-mask">
              <span>Start with a walkthrough.</span>
            </span>
          </h2>
          <p className="ch-lede ch-lede--light mx-auto mb-10 max-w-[52ch]">
            I&apos;ll walk your home, tell you where the real water risk is, and show you what
            the record looks like. No cost and no commitment.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href={`tel:${primaryPhone()}`} className="ch-btn ch-btn--light">
              {primaryPhoneDisplay()}
            </a>
            <Link href="/pricing" className="ch-btn ch-btn--teal">
              See the plans
            </Link>
          </div>
        </div>
      </section>

      <LegalDisclaimer />

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
    </main>
  );
}
