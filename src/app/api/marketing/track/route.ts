import { NextRequest, NextResponse } from "next/server";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

export async function POST(req: NextRequest) {
  try {
    await ensureAdminTables();

    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const eventType = safe(body.eventType);
    const campaignCode = safe(body.campaignCode);
    const sessionKey = safe(body.sessionKey);
    const pagePath = safe(body.pagePath);
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : null;

    if (!eventType) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing eventType" } },
        { status: 400 }
      );
    }

    if (!campaignCode) {
      return NextResponse.json({
        ok: true,
        data: { ignored: true, reason: "No campaign code present" },
      });
    }

    const orgId = env.DEFAULT_ORGANIZATION_ID;

    const campaignRows = await sql`
      SELECT id, campaign_code
      FROM marketing_campaigns
      WHERE organization_id = ${orgId}
        AND campaign_code = ${campaignCode}
      LIMIT 1
    `;

    const campaign = campaignRows[0];
    if (!campaign) {
      return NextResponse.json({
        ok: true,
        data: { ignored: true, reason: "Campaign not found" },
      });
    }

    await sql`
      INSERT INTO marketing_campaign_events (
        id,
        organization_id,
        campaign_id,
        campaign_code,
        session_key,
        event_type,
        page_path,
        metadata_json
      )
      VALUES (
        ${crypto.randomUUID()},
        ${orgId},
        ${campaign.id},
        ${campaign.campaign_code},
        ${sessionKey || null},
        ${eventType},
        ${pagePath || null},
        ${metadata ? JSON.stringify(metadata) : null}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Tracking failed" } },
      { status: 500 }
    );
  }
}