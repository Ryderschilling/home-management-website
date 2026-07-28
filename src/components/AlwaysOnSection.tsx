"use client";

import { contactChannels, primaryPhone, primaryPhoneDisplay } from "@/data/siteData";
import { useBooking } from "./BookingProvider";

/**
 * The phone section.
 *
 * Reads honestly in both states, controlled by one flag in siteData.ts:
 *
 *   answeringService.enabled = false  →  "Ryder answers. Not a queue."
 *   answeringService.enabled = true   →  "Answered in three rings. Any hour."
 *
 * The claim never runs ahead of what's actually provisioned. A homeowner
 * who calls at 2am because the site said 24/7 and reaches voicemail is a
 * worse outcome than never having said it, and second-home owners are
 * exactly the people who call at 2am, because that's when the alarm goes
 * off two states away.
 */
type Fact = [string, string];

const LIVE_FACTS: Fact[] = [
  ["Answered", "24 hours a day, 7 days a week"],
  ["Urgent calls", "Reach Ryder immediately, any hour"],
  ["Every call", "Logged against your property file"],
  ["Coverage", "Watersound Origins \u00b7 Naturewalk \u00b7 Inlet Beach"],
];

const DIRECT_FACTS: Fact[] = [
  ["Who picks up", "Ryder. Every time."],
  ["Typical response", "Same day, usually within the hour"],
  ["Storm & freeze", "Unscheduled visits, no extra charge on Elite"],
  ["Coverage", "Watersound Origins \u00b7 Naturewalk \u00b7 Inlet Beach"],
];

export default function AlwaysOnSection() {
  const { open } = useBooking();
  const live = contactChannels.answeringService.enabled;

  return (
    <section className="ch-deep-band ch-grid-tex fade-section relative overflow-hidden px-4 py-24 text-white md:px-8 md:py-32">
      <div className="relative mx-auto max-w-[1240px]">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-24">
          <div>
            <p className="ch-eyebrow ch-eyebrow--light reveal-item">
              {live ? "04 · Always On" : "04 · The Phone"}
            </p>

            <h2 className="ch-mega ch-mega--sm ch-mega--light mb-8">
              {live ? (
                <>
                  <span className="ch-mask">
                    <span>Answered</span>
                  </span>
                  <span className="ch-mask">
                    <span>in three</span>
                  </span>
                  <span className="ch-mask">
                    <span className="text-[var(--ch-teal-bright)]">rings.</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="ch-mask">
                    <span>You call.</span>
                  </span>
                  <span className="ch-mask">
                    <span className="text-[var(--ch-teal-bright)]">I answer.</span>
                  </span>
                </>
              )}
            </h2>

            <p className="ch-lede ch-lede--light reveal-item mb-10">
              {live ? (
                <>
                  A pipe doesn&apos;t break during business hours. Our line is answered
                  around the clock, every call is logged with your property details, and
                  anything urgent reaches Ryder immediately. Nobody sits on hold, and
                  nothing waits until Monday.
                </>
              ) : (
                <>
                  No call center, no ticket number, no &quot;someone will get back to
                  you.&quot; You have my number and I&apos;m the one who picks up. I live
                  in Watersound Origins, so when something happens at your property I&apos;m
                  minutes away, not dispatched from an office in another county.
                </>
              )}
            </p>

            <div className="reveal-item flex flex-wrap items-center gap-4">
              <span className="ch-magnet inline-block" data-magnet="0.3">
                <a href={`tel:${primaryPhone()}`} className="ch-btn ch-btn--light">
                  {live ? <span className="ch-live" aria-hidden="true" /> : null}
                  Call {primaryPhoneDisplay()}
                </a>
              </span>
              <button type="button" className="ch-link ch-link--light" onClick={() => open("always-on")}>
                Or book a walkthrough &rarr;
              </button>
            </div>
          </div>

          {/* Facts panel */}
          <div className="reveal-item border border-white/10 bg-[rgba(255,255,255,0.03)] p-8 backdrop-blur-sm md:p-10">
            <div className="mb-7 flex items-center gap-3">
              {live && <span className="ch-live" aria-hidden="true" />}
              <p className="ch-label !text-[var(--ch-teal-bright)]">
                {live ? "Line is live" : "How it actually works"}
              </p>
            </div>

            <dl className="space-y-0">
              {(live ? LIVE_FACTS : DIRECT_FACTS).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[128px_1fr] gap-4 border-t border-white/10 py-4">
                  <dt className="ch-label pt-[3px]">{k}</dt>
                  <dd className="text-[14.5px] leading-[1.6] text-white/78">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
