// src/app/llms-full.txt/route.ts
// Full-text companion to /llms.txt for AI engines. See buildLlmsFullTxt.
import { buildLlmsFullTxt } from "@/lib/llms";

export async function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
