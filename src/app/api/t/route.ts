import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/t  -  first-party event sink for src/components/AdTracker.tsx.
 * Writes TrackEvent rows into the CHM Ops database, where /ads reads them.
 * Always answers 204 fast; a tracking failure must never touch the visitor.
 */
const TYPES = new Set(["pageview", "click", "scroll", "form_step", "lead"]);
const s = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 20_000) return new NextResponse(null, { status: 204 });
    const b = JSON.parse(raw) as Record<string, unknown>;
    const visitorId = s(b.v, 64);
    if (!visitorId || !/^[a-z0-9]+$/i.test(visitorId) || !Array.isArray(b.e)) return new NextResponse(null, { status: 204 });
    if (/bot|crawl|spider|headless|lighthouse/i.test(req.headers.get("user-agent") || "")) return new NextResponse(null, { status: 204 });

    const aid = s(b.aid, 40);
    const shared = {
      visitorId,
      sessionId: s(b.s, 64),
      utmSource: s(b.src, 80),
      utmCampaign: s(b.camp, 160),
      utmContent: s(b.cont, 160),
      metaAdId: aid && /^\d+$/.test(aid) ? aid : null,
      referrer: s(b.ref, 300),
      device: s(b.d, 16),
    };
    const known = await prisma.client.findFirst({ where: { visitorId }, select: { id: true } }).catch(() => null);

    const rows = (b.e as Record<string, unknown>[]).slice(0, 25).flatMap((e) => {
      const type = s(e.type, 20);
      const path = s(e.path, 200);
      if (!type || !TYPES.has(type) || !path) return [];
      return [{ ...shared, clientId: known?.id ?? null, type, path, label: s(e.label, 120), target: s(e.target, 200) }];
    });
    if (rows.length) await prisma.trackEvent.createMany({ data: rows });
  } catch (err) {
    console.error("[t] dropped", err instanceof Error ? err.message : err);
  }
  return new NextResponse(null, { status: 204 });
}
