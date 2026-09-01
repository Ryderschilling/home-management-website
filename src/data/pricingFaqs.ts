// src/data/pricingFaqs.ts
//
// One array, two consumers: /pricing renders these as visible content and
// /pricing/layout.tsx emits them as FAQPage schema. Keep it that way. A visible
// FAQ that does not match the schema is a spam signal, not a harmless drift.
//
// These answer the four objections that actually stall a decision on the pricing
// page (existing vendors, contracts, what happens when something breaks, rentals)
// plus the two extractive questions worth owning: what it costs, and whether you
// have to be in town.

export const PRICING_FAQS = [
  {
    q: "I already have a lawn company and a pool company. Do I still need this?",
    a: "Usually yes, and the two do not overlap. Your lawn and pool vendors look at the lawn and the pool. Nobody is going inside, checking for leaks, watching humidity, testing that the A/C is actually running, or looking at the roof and the water heater. Home watch is the person responsible for the house itself, and part of the job is making sure the vendors you already pay actually showed up and did the work.",
  },
  {
    q: "Am I locked into a contract?",
    a: "No. Every plan is month to month by default and you can cancel anytime with no cancellation fee. If you want a lower rate you can choose a 6 or 12 month rate lock and save 5 or 10 percent, but that is your choice and never a condition of getting started.",
  },
  {
    q: "What happens if you find a problem while I'm out of state?",
    a: "You hear from Ryder the same day, with photos, before it gets worse. From there you decide. He can coordinate the repair, meet the contractor at the house, and confirm the work was actually done, or he can simply hand you the photos and step back. You are never billed for a repair you did not approve.",
  },
  {
    q: "Do you manage vacation rentals?",
    a: "No. Coastal Home Management 30A watches owner-occupied second homes that sit empty between owner visits. Bookings, guest turnover, and cleaning coordination are a different business. If your home is on a rental program, home watch still has a place, since a rental manager checks whether the unit is ready to book and is not checking the systems, the exterior, or the quiet weeks when nobody is there at all.",
  },
  {
    q: "How much does home watch cost on 30A?",
    a: "Coastal Home Management 30A charges $200 per month for Essential (weekly walkthrough with a photo report), $350 per month for Home Watch (adds appliance and plumbing checks and irrigation filter cleaning), and $600 per month for Coastal Elite (adds HVAC filter changes, storm and freeze monitoring, pre-arrival prep, and contractor coordination). Same published pricing in every town served, month to month, with 6 and 12 month rate locks that save up to 10 percent.",
  },
  {
    q: "Do I need to be in town to get started?",
    a: "No, and most clients are not. Send your address, Ryder walks the property, and you get photos and a written condition report by email within 48 hours. The first walkthrough is free and the report is yours to keep whether or not you sign up.",
  },
];

