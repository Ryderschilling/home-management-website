"use client";

import { useBooking } from "./BookingProvider";

/**
 * "What you actually get", a phone showing a real visit report thread.
 *
 * This is the highest-leverage section on the page and it did not exist
 * before. Every home watch company on 30A claims photo reports; almost
 * none show one. Showing the artifact collapses the entire trust gap in
 * about two seconds, and it does it without asking the visitor to believe
 * a single adjective.
 */
export default function VisitReportProof() {
  const { open } = useBooking();

  return (
    <section className="fade-section relative overflow-hidden bg-[var(--ch-paper-alt)] px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[1fr_auto] lg:gap-24">
        <div>
          <p className="ch-eyebrow reveal-item">03 · The Proof</p>

          <h2 className="ch-display mb-7">
            <span className="ch-mask">
              <span>Every company promises</span>
            </span>
            <span className="ch-mask">
              <span>photo reports. Here&apos;s one.</span>
            </span>
          </h2>

          <span className="ch-draw mt-9 mb-9 block h-px w-24 bg-[var(--ch-teal)]" />

          <p className="ch-lede reveal-item mb-8">
            This is what lands on your phone after a visit. Not a portal you have to
            log into, not a monthly PDF. A text, the same day, with the photos and
            exactly what I found. If something needs attention you know before I&apos;ve
            left your driveway.
          </p>

          <ul className="reveal-item mb-10 space-y-0">
            {[
              ["Same day", "Sent before I leave the property, not batched at month end."],
              ["Photographed", "Interior, exterior, and anything that changed since last visit."],
              ["Plain English", "What I checked, what's fine, what needs a decision from you."],
            ].map(([k, v]) => (
              <li
                key={k}
                className="grid grid-cols-[110px_1fr] gap-5 border-t border-[var(--ch-hairline)] py-4"
              >
                <span className="ch-label !text-[var(--ch-teal)] pt-[3px]">{k}</span>
                <span className="text-[14.5px] leading-[1.65] text-[var(--ch-muted)]">{v}</span>
              </li>
            ))}
          </ul>

          <div className="reveal-item">
            <span className="ch-magnet inline-block" data-magnet="0.28">
              <button type="button" className="ch-btn ch-btn--solid" onClick={() => open("proof")}>
                See it on your own home
              </button>
            </span>
          </div>
        </div>

        {/* The artifact */}
        <div className="reveal-item mx-auto w-full max-w-[330px]">
          <div className="ch-phone">
            <div className="ch-phone__screen">
              {/* thread header */}
              <div className="flex items-center gap-3 border-b border-[var(--ch-hairline)] bg-white px-4 pb-3 pt-9">
                <span className="grid h-8 w-8 place-items-center bg-[var(--ch-ink)] text-[10px] font-semibold text-white">
                  RS
                </span>
                <div>
                  <p className="text-[13px] font-semibold leading-tight text-[var(--ch-ink)]">Ryder</p>
                  <p className="text-[10px] leading-tight text-[var(--ch-soft)]">Coastal Home Management</p>
                </div>
              </div>

              {/* thread */}
              <div className="flex flex-1 flex-col gap-2.5 overflow-hidden p-4">
                <p className="text-center text-[10px] tracking-wide text-[var(--ch-soft)]">Today 10:42 AM</p>

                <div className="ch-bubble">
                  Morning walkthrough done. House is dry and secure, everything locked.
                </div>

                <div className="ch-bubble !max-w-[86%] !p-1.5">
                  <img
                    src="/ryder-at-work.jpg"
                    alt="Photo from a Coastal Home Management property visit"
                    className="h-[104px] w-full rounded-[13px] object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="ch-bubble">
                  One thing: irrigation zone 3 head is spraying the driveway instead of the
                  bed. Small fix, I can handle it Thursday. Want me to?
                </div>

                <div className="ch-bubble ch-bubble--me">Yes please. Thank you Ryder!</div>

                <div className="ch-bubble">
                  Done. A/C set back to 78, mail is inside on the counter. Full report in
                  your email.
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-[var(--ch-soft)]">
            Illustrative of a typical visit thread.
          </p>
        </div>
      </div>
    </section>
  );
}
