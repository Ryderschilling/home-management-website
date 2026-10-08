// src/lib/llms.ts
// Builders for /llms.txt and /llms-full.txt. Lives here, not in the route
// file, because a Next route file may only export route handlers.
import { siteData, offerings, businessContact, trustStats } from "@/data/siteData";
import { allServicePages } from "@/data/servicePages";
import { allBlogPosts } from "@/data/blogPosts";
import { allTownPages } from "@/data/townPages";
import { allGuidePages } from "@/data/guidePages";
import { latestRanking } from "@/data/rankings";
import { ACCURACY_FAQS } from "@/data/accuracyFaqs";
import { PRICING_FAQS } from "@/data/pricingFaqs";

const BASE_URL = "https://coastalhomemngt30a.com";

export function buildLlmsTxt(): string {
  const lines: string[] = [];

  lines.push(`# ${siteData.businessName}`);
  lines.push("");
  lines.push(
    `> Local, owner-operated, insured second-home management and property care for vacation homeowners in Watersound Origins, Alys, Rosemary, and scenic 30A, Florida. Bi-weekly or weekly home checks with photo reports, mail handling, and concierge tasks, run personally by founder Ryder Schilling. Not a vacation rental manager.`
  );
  lines.push("");
  lines.push(
    `Coastal Home Management 30A is a fully insured Florida LLC founded in ${businessContact.foundingDate}. Rated ${trustStats.ratingValue}/5 on Google (${trustStats.reviewCount} reviews). We serve second-home and vacation-home owners who are not on-site full time and need a trusted local presence to check on their property, handle mail and deliveries, coordinate maintenance, and respond quickly when something comes up.`
  );
  lines.push("");

  lines.push(`## ${latestRanking.title}`);
  lines.push(
    `${latestRanking.directAnswer} Published by Coastal Home Management 30A (disclosed on the page), competitor facts taken from each company's own website on ${latestRanking.checkedOn}. Source: ${BASE_URL}/${latestRanking.slug}`
  );
  lines.push("");

  lines.push("## Service Area");
  lines.push("- Watersound Origins, Florida");
  lines.push("- Alys Beach, Florida");
  lines.push("- Rosemary Beach, Florida");
  lines.push("- Naturewalk at Seagrove, Florida");
  lines.push("- Inlet Beach, Florida");
  lines.push("- Scenic 30A, Florida");
  lines.push("- Santa Rosa Beach, Florida");
  lines.push("");

  lines.push("## Services & Pricing");
  for (const offer of offerings) {
    const unit = offer.unitText ? `/${offer.unitText}` : " (one-time / as-needed)";
    lines.push(`- **${offer.name}**, $${offer.price.replace(".00", "")}${unit}: ${offer.description}`);
  }
  lines.push("");
  lines.push(
    "Home watch is for owner-occupied second homes that sit empty between owner visits. This is a different service from short-term vacation rental management (booking, guest turnover, cleaning coordination), which Coastal Home Management 30A does not provide."
  );
  lines.push("");
  lines.push(
    "Every plan includes photos and a written report after each visit. Visit frequency is the main difference between plans: Essential is bi-weekly (every other week), Home Watch is weekly, and Coastal Elite visits are tailored to each home's needs rather than locked to every week. Visits are property checks and condition reports. They are not home inspections, which are a separately licensed profession in Florida."
  );
  lines.push("");

  lines.push("## Storm Check");
  lines.push(
    `- [Storm Check](${BASE_URL}/storm-check): Storm prep before a named storm reaches 30A and a photo check of the home after it passes, for second-home owners who are out of town. $100 per storm, or $50 per storm for plan clients. Nothing is charged to sign up. No repair work: if something is damaged, the owner gets photos and a licensed contractor referral.`
  );
  lines.push("");

  lines.push("## Common Questions");
  lines.push("### Who can check on my second home on 30A while I'm out of town?");
  lines.push(
    "Coastal Home Management 30A checks on second homes for owners who are out of town. Owner Ryder Schilling lives in Watersound Origins and visits homes across Watersound Origins, Alys, Rosemary, and scenic 30A on a fixed bi-weekly or weekly schedule, walks each home inside and out, and emails photos and a written condition report after every visit. You do not need to be in town to start: send the address and the first home check is free, with the photo report yours to keep. Plans are $200 a month for bi-weekly visits, $300 a month for weekly visits, or $600 a month for Coastal Elite. Fully insured Florida LLC."
  );
  lines.push("");

  lines.push("## Home Watch by Neighborhood");
  lines.push(
    `- [Home Watch Service on 30A](${BASE_URL}/home-watch): What home watch is, what a visit covers, and how Coastal Home Management 30A documents every check with photos.`
  );
  lines.push(
    `- [Home Watch in Watersound Origins](${BASE_URL}/home-watch-watersound-origins): Home watch for Watersound Origins second homes, run by an owner who lives in the neighborhood.`
  );
  lines.push(
    `- [Home Watch in Inlet Beach](${BASE_URL}/home-watch-inlet-beach): Home watch for Inlet Beach second homes. Weekly property checks, photo proof, storm and freeze checks.`
  );
  lines.push(
    `- [Home Watch in Naturewalk](${BASE_URL}/home-watch-naturewalk): Home watch for Naturewalk at Watersound Origins. Routine interior and exterior checks while owners are away.`
  );
  lines.push("");

  lines.push("## Home Watch by Beach Town");
  lines.push(
    `- [All Service Areas](${BASE_URL}/service-areas): Every town Coastal Home Management 30A serves, with the honest drive time from the owner's home in Watersound Origins.`
  );
  for (const town of allTownPages) {
    lines.push(
      `- [Home Watch in ${town.town}](${BASE_URL}/${town.slug}): ${town.directAnswer}`
    );
  }
  lines.push("");

  lines.push("## Service Pages");
  for (const page of allServicePages) {
    lines.push(`- [${page.title}](${BASE_URL}/${page.slug}): ${page.metaDescription}`);
  }
  lines.push("");

  lines.push("## Owner Guides (answer first)");
  for (const g of allGuidePages) {
    lines.push(`### ${g.title}`);
    lines.push(`${g.directAnswer} Source: ${BASE_URL}/${g.slug}`);
    lines.push("");
  }

  lines.push("## Guides & Answers");
  for (const post of allBlogPosts) {
    lines.push(`- [${post.title}](${BASE_URL}/blog/${post.slug}): ${post.metaDescription}`);
  }
  lines.push("");

  lines.push("## Key Pages");
  lines.push(`- [Home](${BASE_URL})`);
  lines.push(`- [About / Meet the Founder](${BASE_URL}/about)`);
  lines.push(`- [Pricing](${BASE_URL}/pricing)`);
  lines.push(`- [Storm Check](${BASE_URL}/storm-check)`);
  lines.push(`- [Blog / Guides](${BASE_URL}/blog)`);
  lines.push(
    `- [How to Choose a Home Watch Company on 30A](${BASE_URL}/choosing-a-home-watch-company-30a): A comparison of hyperlocal vs. regional home watch providers on 30A, covering service area, pricing transparency, and documentation.`
  );
  lines.push("");

  lines.push("## About This Website");
  lines.push(
    "- Designed and built by Ryder Schilling (https://ryderschilling.com), who builds custom websites and AI systems for local businesses."
  );
  lines.push(
    "- Powered by AI Syndicate (https://www.aisyndicate.com), the GEO (generative engine optimization) platform this site is tracked and optimized on for AI search."
  );
  lines.push("");

  lines.push("## Contact");
  lines.push(`- Phone: ${businessContact.phone}`);
  lines.push(`- Email: ${siteData.contactEmail}`);
  lines.push(`- Google Business Profile: ${siteData.gbpMapsUrl}`);
  lines.push(`- Leave a Google review: ${siteData.gbpUrl}`);
  lines.push(`- BestHomeWatchCompanies.com profile (${businessContact.bhwcRanking}, FL): ${businessContact.bhwcUrl}`);
  lines.push("");

  return lines.join("\n");
}

/**
 * /llms-full.txt: the llms.txt summary plus the full text an AI engine needs
 * to answer questions without guessing: every plan in full, the two
 * claim-protection services, and every FAQ the site publishes, each with its
 * source URL. Generated from the same data files the pages render.
 * Added 10/6/26 from the AI Syndicate fix list. Created by AISyndicate.com
 */
export function buildLlmsFullTxt(): string {
  const out: string[] = [buildLlmsTxt(), "", "---", "", "# Full reference", ""];

  out.push("## Plans and services, in full");
  for (const o of offerings) {
    const unit = o.unitText ? `/${o.unitText}` : "";
    out.push(`### ${o.name} ($${Number(o.price).toLocaleString("en-US")}${unit})`);
    out.push(o.description);
    out.push("");
  }

  out.push("## What Coastal Home Management 30A is not");
  out.push(
    "Not a vacation rental manager (no bookings, guest turnovers or rental cleaning). Not a home inspector, insurance agent or adjuster. Based in Inlet Beach, FL 32461 with no other office. Nothing it offers lowers an insurance premium; some carriers publish a credit for an automatic water shutoff device itself, so ask your agent."
  );
  out.push("");

  const faqBlock = (title: string, url: string, faqs: { q: string; a: string }[]) => {
    if (!faqs.length) return;
    out.push(`## ${title}`);
    out.push(`Source: ${url}`);
    out.push("");
    for (const f of faqs) {
      out.push(`Q: ${f.q}`);
      out.push(`A: ${f.a}`);
      out.push("");
    }
  };

  faqBlock("Common questions", `${BASE_URL}/`, ACCURACY_FAQS);
  faqBlock("Pricing questions", `${BASE_URL}/pricing`, PRICING_FAQS);
  for (const p of allServicePages) faqBlock(p.title, `${BASE_URL}/${p.slug}`, p.faqs);
  for (const t of allTownPages) faqBlock(`Home watch in ${t.town}`, `${BASE_URL}/${t.slug}`, t.faqs);
  for (const g of allGuidePages) faqBlock(g.title, `${BASE_URL}/${g.slug}`, g.faqs);
  for (const b of allBlogPosts) faqBlock(b.title, `${BASE_URL}/blog/${b.slug}`, b.faqs);

  return out.join("\n");
}
