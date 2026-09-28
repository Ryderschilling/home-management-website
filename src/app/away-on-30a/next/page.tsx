import type { Metadata } from "next";
import Link from "next/link";
import { primaryPhone } from "@/data/siteData";

// Away on 30A, page 2 of 2 (simplified 9/28/26). Reached after the email
// opt-in. "Ryder will be in touch", then a look at what we do for a house.
// Never promise a call. No forms here: the lead is already in CHM Ops, and the
// follow-up emails take it from there if Ryder has not reached them yet.

export const metadata: Metadata = {
  title: "You're In",
  robots: { index: false, follow: false },
};

const WHAT_WE_DO = [
  ["Walkthroughs", "Inside and out every two weeks (or weekly). Every sink, ceiling, door and window."],
  ["Same-day photo report", "Dated photos and a checklist on your phone before we leave the driveway."],
  ["Storm checks", "A walkthrough after every named storm, without you asking."],
  ["Arrival and departure", "House opened up, AC set, fridge stocked, then closed back down when you leave."],
  ["Mail and packages", "Brought in, forwarded, or photographed so nothing sits on the porch."],
  ["Pool and irrigation", "Eyes on the pump, the water and the sprinklers so nothing runs dry or floods."],
  ["Contractors and deliveries", "Let in, watched, and locked up after, so you don't have to fly down."],
  ["A dated record", "Every visit kept on file, year round, for whenever you need it."],
];

export default function AwayNextPage() {
  return (
    <main className="bg-[var(--ch-paper)]">
      <section className="px-4 pt-28 pb-14 md:px-8 md:pt-36 md:pb-20">
        <div className="mx-auto max-w-[860px] text-center">
          <p className="ch-eyebrow ch-eyebrow--center">You&apos;re in</p>
          <h1 className="ch-display mx-auto mb-6 max-w-[16ch]">Thanks. Ryder will be in touch.</h1>
          <p className="ch-lede mx-auto max-w-[46ch]">
            A quick email is on its way to you now. In the meantime, here&apos;s what we do for 30A homes.
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1240px]">
          <p className="ch-eyebrow">What we do for a house</p>
          <div className="mt-8 grid gap-px border border-[var(--ch-hairline)] bg-[var(--ch-hairline)] sm:grid-cols-2 lg:grid-cols-4">
            {WHAT_WE_DO.map(([t, b], i) => (
              <div key={t} className="bg-[var(--ch-paper)] p-7">
                <p className="ch-label mb-4 !text-[var(--ch-teal)]">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="mb-2 text-[19px] leading-[1.3] text-[var(--ch-ink)]">{t}</h2>
                <p className="text-[14.5px] leading-[1.7] text-[var(--ch-muted)]">{b}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start gap-4 border-t border-[var(--ch-hairline)] pt-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[16px] text-[var(--ch-ink)]">Want to see one? Here&apos;s a real visit report, names removed.</p>
            <Link href="/away-on-30a/report" className="ch-btn ch-btn--solid" data-track="Page 2: see a real report">
              See a real report
            </Link>
          </div>
          <p className="mt-6 text-[14px] text-[var(--ch-muted)]">
            Rather not wait? <a href={`sms:${primaryPhone()}`} className="underline underline-offset-4" data-track="Page 2: text Ryder">Text Ryder</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
