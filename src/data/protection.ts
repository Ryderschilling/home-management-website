// src/data/protection.ts
//
// SINGLE SOURCE OF TRUTH for the two claim-protection services and, more
// importantly, for the legal line this business is not allowed to cross.
//
// ─── READ THIS BEFORE WRITING ANY COPY THAT MENTIONS INSURANCE ─────────────
//
// Verified August 2026. No insurance carrier in the United States gives a
// premium discount for hiring a home watch company. Not one. Every article
// claiming otherwise is marketing published by a home watch company, naming
// no carrier and citing no policy language.
//
// What IS true and defensible:
//   1. Florida policies exclude water damage from "constant or repeated
//      seepage or leakage over a period of 14 or more days," and cap mold at
//      $10,000. Undetected water in an empty house is where claims die.
//   2. Hicks v. American Integrity (Fla. 5th DCA 2018) puts the burden on the
//      INSURER to prove that exclusion and to apportion damage occurring after
//      day 14. Dated visit records make that burden very hard to meet.
//   3. Fla. Stat. 627.70132 bars any claim not reported within one year of the
//      date of loss. Dated records establish that date for hidden damage.
//   4. Universal Property & Casualty's filed Florida manual defines
//      unoccupancy as "no discernable sign of occupation OR maintenance" over
//      thirty days. Documented maintenance is directly responsive to that.
//   5. Automatic water shutoff devices DO carry filed premium credits at
//      several carriers (PURE publishes up to 5%, Chubb and others have
//      programs). That credit comes from the client's own carrier, never
//      from us, and it attaches to the device, never to our service.
//
// NEVER SAY, anywhere on this site, in email, or in a proposal:
//   - that CHM lowers, reduces, or discounts anyone's insurance premium
//   - "second insurance", "like insurance", or any variant
//   - that any carrier requires, endorses, approves, or recognizes CHM
//   - that CHM performs an "inspection" (Fla. Stat. 468.8311 defines home
//     inspection as a licensed profession; 468.8319 makes practicing without
//     the license a first-degree misdemeanor). Use visit, walkthrough, check,
//     property check, condition report.
//   - anything that reads as advice about a person's coverage. CHM is not a
//     licensed insurance agent (Fla. Stat. 626.112).
//
// ALWAYS carry <LegalDisclaimer /> on any page that mentions insurance.

export const protectionServices = {
  shutoff: {
    name: "Water Shutoff Protection",
    short: "A smart valve that shuts your water off automatically, monitored by us.",
    installPrice: 1295,
    installPriceLabel: "$1,295 installed",
    monitoringPrice: 35,
    monitoringPriceLabel: "$35/mo",
    body:
      "A smart shutoff valve goes on your main line. It watches flow around the clock and closes the line by itself when it sees a burst or a running leak. The alert comes to us, not to a phone you left on a nightstand in Nashville. We drive over, confirm what happened, and tell you what we found.",
    bullets: [
      "Professionally installed on your main water line by a licensed plumber",
      "Shuts the water off on its own when it detects a burst or a running leak",
      "Alerts route to us, and we go to the house",
      "Several carriers publish a premium credit for an automatic shutoff device. Ask your agent whether yours is one of them.",
    ],
  },
  coverageRecord: {
    name: "Annual Coverage Record",
    short: "One dated, photographed record of every visit we made to your home this year.",
    annualPrice: 195,
    annualPriceLabel: "$195/year",
    body:
      "Once a year we compile every visit into a single dated document: what was checked, what was found, and the photos, in order. If you ever have to argue with an adjuster about when damage started, this is the thing you hand them. It is also the cleanest record of what you paid us to do.",
    bullets: [
      "Every visit for the year, in order, with the date on each one",
      "Per-area notes, including the areas that were dry and fine",
      "Photos attached to the visit they came from",
      "Delivered as one PDF you can forward to your agent",
    ],
  },
} as const;

/** The short line that goes at the bottom of any insurance-adjacent page. */
export const LEGAL_DISCLAIMER = `Coastal Home Management 30A provides property visit and documentation services. We are not home inspectors, insurance agents, or adjusters, and nothing here is a home inspection, an insurance recommendation, or advice about your coverage. Our reports document observations on the dates listed. Policy terms differ by carrier. For questions about your policy, coverage, or a claim, contact your insurance agent.`;
