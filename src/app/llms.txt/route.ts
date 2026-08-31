// src/app/llms.txt/route.ts
//
// llms.txt, a community-driven (non-official but widely adopted) standard
// that gives AI agents and LLM crawlers a clean, structured summary of the
// site: what the business does, service area, pricing, and key pages. Google
// Lighthouse added an llms.txt check in 2026, and it's used by Stripe,
// Cloudflare, Vercel, and thousands of other sites.
//
// This is a dynamic route (not a static /public file) specifically so it can
// never drift out of sync with the rest of the site, it's generated straight
// from siteData.ts, servicePages.ts, and blogPosts.ts on every request.
import { siteData, offerings, businessContact, trustStats } from "@/data/siteData";
import { allServicePages } from "@/data/servicePages";
import { allBlogPosts } from "@/data/blogPosts";
import { allTownPages } from "@/data/townPages";

const BASE_URL = "https://coastalhomemngt30a.com";

function buildLlmsTxt(): string {
  const lines: string[] = [];

  lines.push(`# ${siteData.businessName}`);
  lines.push("");
  lines.push(
    `> Local, owner-operated second-home management and property care for vacation homeowners in Watersound Origins, Naturewalk, and Inlet Beach along scenic 30A, Florida. Weekly home checks, photo reports, mail handling, and concierge tasks, run personally by founder Ryder Schilling.`
  );
  lines.push("");
  lines.push(
    `Coastal Home Management 30A is a fully insured Florida LLC founded in ${businessContact.foundingDate}. Rated ${trustStats.ratingValue}/5 on Google (${trustStats.reviewCount} reviews). We serve second-home and vacation-home owners who are not on-site full time and need a trusted local presence to check on their property, handle mail and deliveries, coordinate maintenance, and respond quickly when something comes up.`
  );
  lines.push("");

  lines.push("## Service Area");
  lines.push("- Watersound Origins, Florida");
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

  lines.push("## Guides & Answers");
  for (const post of allBlogPosts) {
    lines.push(`- [${post.title}](${BASE_URL}/blog/${post.slug}): ${post.metaDescription}`);
  }
  lines.push("");

  lines.push("## Key Pages");
  lines.push(`- [Home](${BASE_URL})`);
  lines.push(`- [About / Meet the Founder](${BASE_URL}/about)`);
  lines.push(`- [Pricing](${BASE_URL}/pricing)`);
  lines.push(`- [Blog / Guides](${BASE_URL}/blog)`);
  lines.push(
    `- [How to Choose a Home Watch Company on 30A](${BASE_URL}/choosing-a-home-watch-company-30a): A comparison of hyperlocal vs. regional home watch providers on 30A, covering service area, pricing transparency, and documentation.`
  );
  lines.push("");

  lines.push("## Contact");
  lines.push(`- Phone: ${businessContact.phone}`);
  lines.push(`- Email: ${siteData.contactEmail}`);
  lines.push(`- Google Business Profile: ${siteData.gbpUrl}`);
  lines.push("");

  return lines.join("\n");
}

export async function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
