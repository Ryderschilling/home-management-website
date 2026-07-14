// src/data/blogPosts.ts
// Single source of truth for all blog content. Add new posts to this array —
// the /blog index, /blog/[slug] pages, sitemap.ts, and llms.txt all read from
// here automatically. No other file needs to be touched to publish a post.

import { offerings } from "@/data/siteData";

export type BlogPost = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: "seasonal" | "direct-answer" | "local-authority" | "proof-story";
  datePublished: string; // ISO date, e.g. "2026-07-14"
  dateModified?: string;
  // GEO-formatted direct answer — 40-60 words, front-loaded, no fluff.
  // This is what AI engines (ChatGPT, Perplexity, Gemini, AI Overviews) pull
  // first when citing the page.
  directAnswer: string;
  body: { heading?: string; paragraphs: string[] }[];
  faqs: { q: string; a: string }[];
};

const premium = offerings.find((o) => o.name === "Premium Home Management");
const standard = offerings.find((o) => o.name === "Standard Home Management");
const elite = offerings.find((o) => o.name === "Coastal Elite Membership");

export const blogPosts: BlogPost[] = [
  {
    slug: "hurricane-season-prep-30a-second-home",
    title: "What to Check Before Hurricane Season Hits Your 30A Home",
    metaTitle: "Hurricane Season Prep Checklist for 30A Second Homes",
    metaDescription:
      "A local's checklist for preparing your Watersound Origins, Naturewalk, or 30A second home before hurricane season, plus how routine home checks catch problems early.",
    category: "seasonal",
    datePublished: "2026-07-14",
    directAnswer:
      "Before hurricane season (June 1 to November 30 on the Florida Panhandle), second homeowners on 30A should confirm working storm shutters or impact windows, clear gutters and yard debris, secure or store outdoor furniture, test the sump pump and check flood insurance, and arrange for someone local to check the property before and after a storm.",
    body: [
      {
        heading: "Why this matters more when you're not there",
        paragraphs: [
          "If you live in the property full time, storm prep is a weekend project. If your home in Watersound Origins or Naturewalk sits empty most of the year, it's a different problem entirely. Nobody is there to notice the loose gutter, the fence panel that's already leaning, or the patio furniture that becomes a projectile in 60 mph wind.",
          "Every hurricane season we work with homeowners who find out about damage weeks after it happened, not because the damage was hidden, but because nobody was checking.",
        ],
      },
      {
        heading: "The pre-season checklist",
        paragraphs: [
          "Storm shutters or impact windows: confirm they actually close and latch, not just that they exist. Hardware seizes up after a year of salt air.",
          "Roof and gutters: clear debris now, before storm season backs up drainage and sends water somewhere it shouldn't go.",
          "Yard and patio: anything that isn't bolted down is a hazard in high wind. Outdoor furniture, planters, and decorations need a plan, either storage or tie-down.",
          "Sump pump and drainage: test it before you need it, not during a storm.",
          "Insurance: confirm flood coverage is current and that your policy reflects any renovations since last renewed.",
          "A local contact: someone who can check the property before landfall to prep it, and after to document any damage immediately for your insurance claim.",
        ],
      },
      {
        heading: "What we do for hurricane prep",
        paragraphs: [
          "Every Standard, Premium, and Coastal Elite client gets storm watch built into their visit. When a storm is tracking toward the Panhandle, we walk the property, secure loose items, and photograph the exterior before landfall. After the storm passes, we're back out documenting condition and flagging anything that needs immediate attention, so you're not finding out about a problem from a neighbor's text three weeks later.",
        ],
      },
    ],
    faqs: [
      {
        q: "When does hurricane season start on 30A?",
        a: "Atlantic hurricane season runs June 1 through November 30, with the highest activity for the Florida Panhandle typically August through October.",
      },
      {
        q: "Do you check on properties before and after a storm?",
        a: "Yes. Storm watch is included in every home management tier. We secure the property ahead of a storm and document its condition immediately after.",
      },
      {
        q: "What if my home is damaged during a storm and I'm out of state?",
        a: "We photograph and report any damage right away so you have documentation for your insurance claim before you're even able to travel back.",
      },
    ],
  },
  {
    slug: "how-much-does-home-watch-cost-30a",
    title: "How Much Does Home Watch Cost on 30A?",
    metaTitle: "Home Watch Cost in Watersound Origins & 30A (Real Pricing)",
    metaDescription:
      "Real, current pricing for home watch and second home management in Watersound Origins, Naturewalk, and 30A. Compare tiers and what's included at each price point.",
    category: "direct-answer",
    datePublished: "2026-07-14",
    directAnswer: `Home watch service on 30A typically runs $${standard?.price?.replace(".00", "")}–$${elite?.price?.replace(".00", "")}+ per month depending on visit frequency and what's included. Basic weekly checks with photo reports start around $${standard?.price?.replace(".00", "")}/month, mid-tier plans with maintenance coordination run $${premium?.price?.replace(".00", "")}/month, and full-service plans with guaranteed emergency response start near $${elite?.price?.replace(".00", "")}/month.`,
    body: [
      {
        heading: "Why home watch pricing varies so much",
        paragraphs: [
          "The price difference between home watch companies almost always comes down to three things: how often someone actually visits, how fast they respond when something's wrong, and whether you're paying a person or a call center. A $99/month plan somewhere else might mean a monthly drive-by with no photos and a 3-day response time. That's a different service, not just a cheaper version of the same one.",
        ],
      },
      {
        heading: "Coastal Home Management 30A pricing",
        paragraphs: [
          `Standard Home Management, $${standard?.price?.replace(".00", "")}/month: weekly property inspection, photo documentation, storm watch, mail pickup, and a text or email summary after every visit.`,
          `Premium Home Management, $${premium?.price?.replace(".00", "")}/month: everything in Standard plus bi-weekly photo reports, seasonal maintenance checks, one on-call task per month, and contractor coordination.`,
          `Coastal Elite Membership, $${elite?.price?.replace(".00", "")}/month: our top tier, limited to 8 members. Guaranteed 2-hour emergency response, weekly photo reports, arrival prep twice a year, 3 on-call hours included, and a direct line to the founder.`,
          "On-call property tasks and mail/trash handling are also available a la carte for owners who don't need a recurring plan.",
        ],
      },
      {
        heading: "What actually drives the cost worth paying for",
        paragraphs: [
          "The real value in home watch isn't the visit itself, it's what happens the moment something's wrong. A slow leak caught on day one is a $200 fix. The same leak found four weeks later, after it's been running behind drywall, is a five-figure repair and a mold remediation. Every tier we offer includes fast reporting specifically so small problems get caught while they're still small and cheap.",
        ],
      },
    ],
    faqs: [
      {
        q: "What's the average cost of home watch service on 30A?",
        a: `Expect to pay roughly $${standard?.price?.replace(".00", "")} to $${elite?.price?.replace(".00", "")}+ per month depending on visit frequency, reporting detail, and response guarantees. Weekly-visit plans with photo reports typically start around $${standard?.price?.replace(".00", "")}/month.`,
      },
      {
        q: "Is home watch the same as vacation rental management?",
        a: "No. Home watch is for owner-occupied second homes that sit empty between owner visits. Vacation rental management handles guest bookings, cleaning turnovers, and short-term rental operations. They're different services for different types of properties.",
      },
      {
        q: "Do you require a long-term contract?",
        a: "No long-term contract is required. Plans run month to month, and on-call tasks are available with no recurring commitment at all.",
      },
    ],
  },
];

export const allBlogPosts = blogPosts.sort(
  (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime()
);
