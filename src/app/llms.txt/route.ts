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
import { buildLlmsTxt } from "@/lib/llms";

export async function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
