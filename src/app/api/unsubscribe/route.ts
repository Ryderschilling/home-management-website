import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * One-click unsubscribe (RFC 8058). Gmail and Apple Mail POST here from the
 * List-Unsubscribe header on CHM Ops follow-up emails and email list mail. A GET (someone pasting
 * the link) goes to the confirm page instead.
 */
async function optOut(token: string | null): Promise<boolean> {
  if (!token || token.length > 64) return false;
  const r = await prisma.client.updateMany({ where: { unsubToken: token }, data: { emailOptOut: true } });
  // Email list signups (storm alerts / homeowner news) carry their own token.
  const s = await prisma.subscriber.updateMany({ where: { unsubToken: token, optedOutAt: null }, data: { optedOutAt: new Date() } });
  return r.count + s.count > 0;
}

export async function POST(req: NextRequest) {
  await optOut(req.nextUrl.searchParams.get("t")).catch(() => false);
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/unsubscribe";
  return NextResponse.redirect(url);
}
