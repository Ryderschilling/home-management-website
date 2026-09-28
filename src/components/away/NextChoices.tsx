"use client";

import { useState } from "react";
import AwayBookingFlow from "@/components/AwayBookingFlow";
import StartForm from "./StartForm";

/**
 * Page 2: two doors, side by side. The free walkthrough is the easy yes; start
 * now is for the owner who is already sold. Picking one opens its form right
 * under the choice, and the pick is tracked so /ads shows which door wins.
 */
export default function NextChoices() {
  const [pick, setPick] = useState<"" | "walkthrough" | "start">("");

  function choose(p: "walkthrough" | "start") {
    setPick(p);
    window.chmTrack?.("form_step", { target: `${p}-open`, label: p === "walkthrough" ? "Free walkthrough" : "Start now" });
    setTimeout(() => document.getElementById("next-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  const card = (active: boolean) =>
    `group flex h-full flex-col border p-7 text-left transition-colors md:p-9 ${
      active ? "border-[var(--ch-teal)] bg-white" : "border-[var(--ch-hairline)] bg-[var(--ch-paper)] hover:border-[var(--ch-ink)]"
    }`;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <button type="button" className={card(pick === "walkthrough")} onClick={() => choose("walkthrough")} data-track="Choice: free walkthrough">
          <span className="ch-label mb-4 !text-[var(--ch-teal)]">Free · no commitment</span>
          <span className="mb-3 text-[26px] leading-[1.15] text-[var(--ch-ink)]" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 108, 'wght' 600" }}>
            Book a free walkthrough
          </span>
          <span className="mb-6 text-[15px] leading-[1.65] text-[var(--ch-muted)]">
            Ryder walks your home on a Tuesday or Thursday, with you, on FaceTime, or alone. You get the photo report either way.
          </span>
          <span className="ch-btn ch-btn--solid mt-auto w-fit">Pick a day</span>
        </button>
        <button type="button" className={card(pick === "start")} onClick={() => choose("start")} data-track="Choice: start now">
          <span className="ch-label mb-4 !text-[var(--ch-teal)]">$200/mo · love it or it&apos;s free</span>
          <span className="mb-3 text-[26px] leading-[1.15] text-[var(--ch-ink)]" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 108, 'wght' 600" }}>
            Start now
          </span>
          <span className="mb-6 text-[15px] leading-[1.65] text-[var(--ch-muted)]">
            Already know you want it? Tell Ryder about the house and he calls you to set it up. Nothing is charged until you talk.
          </span>
          <span className="ch-btn mt-auto w-fit">Get started</span>
        </button>
      </div>

      <div id="next-form" className="scroll-mt-28 pt-6">
        {pick === "walkthrough" && (
          <div className="mx-auto max-w-[640px]">
            <AwayBookingFlow />
          </div>
        )}
        {pick === "start" && (
          <div className="mx-auto max-w-[760px]">
            <StartForm />
          </div>
        )}
      </div>
    </div>
  );
}
