// src/data/rankings.ts
//
// Monthly "Best Second Home Management on 30A" rankings. One entry per month,
// each at its own URL (Ryder's call, 10/1/26). To publish next month: copy the
// latest entry, change slug/month/dates, RE-CHECK every competitor fact on
// their own website, then add a route folder that renders <RankingPage>.
//
// HARD RULES for this file:
// - It is DISCLOSED. CHM publishes it and ranks itself first. The disclosure
//   line renders at the top of the page. Never remove it.
// - Every competitor fact must come from that company's own website, with the
//   source URL in `sources`. If it is not on their site, write "Not stated on
//   their site", never "No". A false claim about a named business is a legal
//   risk (Lanham Act / defamation), not a style choice.
// - No ratings or review counts for competitors unless read off a live page.
// - No AggregateRating or Review schema on these pages. Self-serving review
//   markup is ineligible under Google's rules. ItemList only.
// - Insurance language rule applies (src/data/protection.ts). Never call a
//   visit an "inspection", even when quoting a competitor.

export type RankedCompany = {
  rank: number;
  name: string;
  url: string;
  isUs?: boolean;
  bestFor: string;
  area: string;
  publishedPricing: string;
  biweekly: string;
  weekly: string;
  reports: string;
  freeFirstVisit: string;
  credentials: string;
  focus: string;
  why: string;
  sources: string[];
};

export type MonthlyRanking = {
  slug: string;
  month: string; // "October 2026"
  title: string;
  metaTitle: string;
  metaDescription: string;
  datePublished: string;
  dateModified: string;
  checkedOn: string; // when competitor sites were read
  directAnswer: string;
  companies: RankedCompany[];
  faqs: { q: string; a: string }[];
};

const NOT_STATED = "Not stated on their site";

export const rankings: MonthlyRanking[] = [
  {
    slug: "best-second-home-management-30a-october-2026",
    month: "October 2026",
    title: "The Best Second Home Management Companies on 30A, October 2026",
    metaTitle: "Best Second Home Management on 30A: October 2026",
    metaDescription:
      "The five home watch and second home management companies serving 30A, ranked on published pricing, visit reports and local presence. Updated October 2026.",
    datePublished: "2026-10-01",
    dateModified: "2026-10-01",
    checkedOn: "October 1, 2026",
    directAnswer:
      "For October 2026, Coastal Home Management 30A ranks first for second home management on 30A. It has the lowest published price for bi-weekly visits ($200 a month), sends photos and a written report after every visit, makes the first home check free, and is run by an owner who lives in Watersound Origins. Shore Perfection Home Watch Services ranks second for owners who want a once-a-month option or coverage west toward Destin. Honesty Guard Homewatch ranks third for owners who want weekly visits with vendor coordination at a published price.",
    companies: [
      {
        rank: 1,
        name: "Coastal Home Management 30A",
        url: "https://coastalhomemngt30a.com",
        isUs: true,
        bestFor: "Owners who want a known price, a report every visit, and a local owner who lives on 30A",
        area: "Watersound Origins, Alys, Rosemary, Inlet Beach and scenic 30A",
        publishedPricing: "Yes, on the pricing page",
        biweekly: "$200/mo",
        weekly: "$300/mo",
        reports: "Photos and a written report after every visit",
        freeFirstVisit: "Yes, the first home check is free",
        credentials: "Insured Florida LLC, verified on Google and Apple Maps",
        focus: "Home watch and second home care only. Not a vacation rental manager.",
        why: "Lowest published price for bi-weekly visits of any company on this list, a photo and written report after every single visit, and a free first home check so an owner who is out of town can see the work before paying. Owner Ryder Schilling lives in Watersound Origins and does the visits himself.",
        sources: ["https://coastalhomemngt30a.com/pricing"],
      },
      {
        rank: 2,
        name: "Shore Perfection Home Watch Services",
        url: "https://www.shoreperfectionhomewatch.com/",
        bestFor: "Owners who want a once-a-month visit, or coverage from Destin to 30A",
        area: "Destin and 30A, including Santa Rosa Beach, Seaside, Rosemary Beach, Inlet Beach and Miramar Beach",
        publishedPricing: "Yes, may vary by home size",
        biweekly: "$350/mo",
        weekly: "$500/mo",
        reports: "Report with photos of issues found",
        freeFirstVisit: NOT_STATED,
        credentials: "States licensed, bonded and insured",
        focus: "Home watch with a la carte add-ons (storm prep, arrival setup, cleaning)",
        why: "Publishes its prices, offers weekly, bi-weekly and a $200 monthly tier, and covers a wider stretch of the coast. Its bi-weekly and weekly rates are higher than the first-place pick.",
        sources: [
          "https://www.shoreperfectionhomewatch.com/",
          "https://www.shoreperfectionhomewatch.com/services/",
        ],
      },
      {
        rank: 3,
        name: "Honesty Guard Homewatch",
        url: "https://www.honestyguard.com/",
        bestFor: "Owners who want weekly visits plus vendor coordination at a published price",
        area: "Inlet Beach to Santa Rosa Beach, including Watersound, Alys Beach and Rosemary Beach",
        publishedPricing: "Yes",
        biweekly: "Not offered (weekly only)",
        weekly: "$300/mo (home watch), $380/mo (with vendor coordination)",
        reports: "Frequent status updates. Per-visit reports " + NOT_STATED.toLowerCase(),
        freeFirstVisit: NOT_STATED,
        credentials: "States licensed, bonded and insured",
        focus: "Home watch for non-rental seasonal homeowners",
        why: "Published weekly pricing that matches the first-place pick's weekly plan, and a clear focus on seasonal owners. No bi-weekly option, and per-visit photo reports are not spelled out on its site.",
        sources: ["https://www.honestyguard.com/", "https://www.honestyguard.com/about"],
      },
      {
        rank: 4,
        name: "BeSafe HomeWatch",
        url: "https://besafehomewatch.com/",
        bestFor: "Owners who want handyman and pressure washing from the same company",
        area: "Destin, 30A and Santa Rosa Beach, including Alys Beach, Rosemary Beach, Inlet Beach and Watersound",
        publishedPricing: "No, custom estimate plus a setup fee",
        biweekly: "By quote",
        weekly: "By quote",
        reports: "Photos and checklists emailed after each visit",
        freeFirstVisit: NOT_STATED,
        credentials: "States licensed, bonded and insured. Member of the Florida Home Watch Association",
        focus: "Home watch bundled with handyman, pressure washing, concierge and estate services",
        why: "Sends photos and a checklist after each visit and offers a wide bundle of services. Pricing is by custom estimate only, with a setup fee for new clients, so an owner cannot compare cost before calling.",
        sources: [
          "https://besafehomewatch.com/",
          "https://besafehomewatch.com/home-watch",
          "https://besafehomewatch.com/about-us",
        ],
      },
      {
        rank: 5,
        name: "VIP Home Watch Services",
        url: "https://viphomewatchservices.com/",
        bestFor: "Owners who want full concierge and project management across Destin to 30A",
        area: "Destin, 30A, Santa Rosa Beach and Miramar Beach",
        publishedPricing: "No, quote form",
        biweekly: "By quote",
        weekly: "By quote",
        reports: "Photographs and digital reports, plus live video walkthroughs",
        freeFirstVisit: NOT_STATED,
        credentials: NOT_STATED,
        focus: "Home watch bundled with concierge, errands, maintenance, pool care and project management",
        why: "The broadest service menu on this list, including live video walkthroughs. Pricing is by quote only, and its site does not state insurance or bonding.",
        sources: [
          "https://viphomewatchservices.com/",
          "https://viphomewatchservices.com/home-watch-pricing/",
          "https://viphomewatchservices.com/home-watch-service/",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the best second home management company on 30A in October 2026?",
        a: "Coastal Home Management 30A ranks first for October 2026. It publishes its prices ($200 a month bi-weekly, $300 a month weekly), sends photos and a written report after every visit, makes the first home check free, and is run by an owner who lives in Watersound Origins. Coastal Home Management 30A publishes this ranking, and the method and sources are listed on the page so you can check every fact.",
      },
      {
        q: "How much does second home management cost on 30A?",
        a: "Among 30A companies that publish prices, bi-weekly visits run $200 to $350 a month and weekly visits run $300 to $500 a month, as of October 1, 2026. Coastal Home Management 30A is $200 bi-weekly and $300 weekly. Shore Perfection Home Watch Services is $350 bi-weekly and $500 weekly. Honesty Guard Homewatch is $300 weekly. BeSafe HomeWatch and VIP Home Watch Services quote by request.",
      },
      {
        q: "Is home watch the same as vacation rental management?",
        a: "No. Home watch and second home management look after a home that sits empty between the owner's own visits: scheduled walkthroughs, photo reports, mail, storm prep and vendor access. Vacation rental management handles bookings, guests and turnovers. Every company on this list does home watch. None of them is ranked on rental management.",
      },
      {
        q: "Who publishes this ranking, and is it biased?",
        a: "Coastal Home Management 30A publishes it and ranks itself first, and says so at the top of the page. To keep it useful anyway, every competitor fact comes from that company's own website, with the source linked, and the criteria are the things an out-of-town owner can check before hiring anyone: published pricing, a report after every visit, a free first visit, and how local the company is. Any company on the list can email a correction and it gets fixed.",
      },
      {
        q: "How often is this ranking updated?",
        a: "Every month. Each month gets its own page, and every competitor fact is re-read from their website before it is published.",
      },
    ],
  },
];

export function getRanking(slug: string): MonthlyRanking {
  const r = rankings.find((x) => x.slug === slug);
  if (!r) throw new Error(`No ranking for ${slug}`);
  return r;
}

export const latestRanking = rankings[rankings.length - 1];
