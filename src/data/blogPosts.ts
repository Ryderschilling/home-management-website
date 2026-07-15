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
  {
    slug: "home-watch-caught-failing-ac-before-mold",
    title: "How a Routine Home Watch Visit Caught a Failing AC Before It Turned Into Mold",
    metaTitle: "Home Watch Caught a Failing AC Before Mold Set In on 30A",
    metaDescription:
      "A real-style walkthrough of how a routine summer home watch visit on 30A catches a failed AC and rising humidity before mold does five-figure damage to an empty second home.",
    category: "proof-story",
    datePublished: "2026-07-15",
    directAnswer:
      "In a closed-up Florida home, a failed AC in July can push indoor humidity past 60 percent within a day or two, and mold can start growing on walls, furniture, and ductwork in as little as 24 to 48 hours. A routine home watch visit catches the warm, sticky interior early, before humidity turns into a five-figure repair.",
    body: [
      {
        heading: "The problem you never see coming",
        paragraphs: [
          "Summer is the season most second-home owners on 30A worry the least and lose the most. Hurricanes get the attention because they make the news. The quiet killer is the AC unit that stops running in July while nobody is in the house.",
          "Here is what actually happens. The condensate drain clogs, or the capacitor fails, or the breaker trips. The system stops cooling and, more importantly, stops pulling moisture out of the air. In a sealed-up home on the Gulf Coast, indoor humidity climbs fast. Within a day or two it is sitting above 60 percent, which is exactly the environment mold needs to take hold on drywall, baseboards, upholstery, and inside the ductwork itself.",
        ],
      },
      {
        heading: "What the visit looked like",
        paragraphs: [
          "On a routine weekly check this July, the first thing our person noticed walking through the door was the air. It was warm and heavy, not the crisp cool you expect from a house running at 74 degrees. The thermostat told the rest of the story: set to 74, reading 81, and climbing.",
          "The condensate line had clogged and tripped the safety float switch, which shut the system down to stop it from overflowing. No alarm went off. No one got a call. If nobody had walked in, that house would have sat at 80-plus degrees and rising humidity for another full week until the next visit, or longer if it had no visits at all.",
          "We cleared the line, reset the switch, confirmed the system was cooling and pulling humidity back down, and sent the owner a photo report of the thermostat, the drain, and the corrected reading within the hour.",
        ],
      },
      {
        heading: "The math on catching it early",
        paragraphs: [
          "A clogged condensate line cleared on the spot is a 20-minute fix. The same failure left running for two or three weeks in a Florida summer is mold remediation, replaced drywall, ruined furniture, and an insurance claim, easily five figures, plus weeks of a home you cannot use.",
          `That is the entire point of home watch. Standard Home Management is $${standard?.price?.replace(".00", "")}/month for weekly visits with photo proof, which is a rounding error next to what an unchecked summer AC failure costs. The visit is not the product. Catching the problem while it is still small and cheap is the product.`,
        ],
      },
      {
        heading: "How we watch for this specifically",
        paragraphs: [
          "Every visit includes a check of the thermostat reading against its setpoint, a look at the AC handler and condensate drain, and a note on how the interior actually feels and smells, because a musty smell is often the first sign of a moisture problem before it is visible anywhere. During the summer months on 30A this is one of the first things we look at, not an afterthought.",
          "For owners who want an extra layer, Premium and Coastal Elite clients can add a smart temperature and humidity sensor so a spike gets flagged between visits, not just during them.",
        ],
      },
    ],
    faqs: [
      {
        q: "How fast can mold grow in a Florida home with no AC?",
        a: "Mold can begin growing in as little as 24 to 48 hours once indoor humidity climbs above 60 percent, which happens quickly in a sealed summer home after the AC fails. That short window is why weekly checks matter most in the summer.",
      },
      {
        q: "Why does an empty home need AC monitoring in the summer?",
        a: "Because the AC is what keeps humidity out, not just heat. When it fails in an empty Florida home, moisture builds fast and can damage drywall, furniture, and ductwork long before the owner ever finds out. A routine visit catches it while it is still a cheap fix.",
      },
      {
        q: "Do you check the AC during home watch visits?",
        a: `Yes. Every visit includes checking the thermostat reading against its setpoint, inspecting the air handler and condensate drain, and noting the feel and smell of the interior. Standard plans start at $${standard?.price?.replace(".00", "")}/month with a photo report after every check.`,
      },
    ],
  },
];

export const allBlogPosts = blogPosts.sort(
  (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime()
);
