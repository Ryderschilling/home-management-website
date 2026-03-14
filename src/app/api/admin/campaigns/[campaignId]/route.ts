import { NextRequest, NextResponse } from "next/server";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";

export const runtime = "nodejs";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function dollarsToCents(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function intOrZero(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { ok: false, error: { message: "Admin authentication required." } },
      { status: 401 }
    );
  }

  try {
    await ensureAdminTables();

    const { campaignId } = await params;
    const orgId = getOrganizationId(request);
    const body = await request.json().catch(() => ({} as Record<string, unknown>));

    const name = safe(body.name);
    const channel = safe(body.channel || "flyer") || "flyer";
    const landingPath = safe(body.landing_path || "/qr") || "/qr";
    const flyersSent = intOrZero(body.flyers_sent);
    const printCostCents = dollarsToCents(body.print_cost_dollars);
    const distributionCostCents = dollarsToCents(body.distribution_cost_dollars);
    const notes = safe(body.notes);
    const active = body.active === false ? false : true;

    await sql`
      UPDATE marketing_campaigns
      SET
        name = ${name},
        channel = ${channel},
        landing_path = ${landingPath},
        flyers_sent = ${flyersSent},
        print_cost_cents = ${printCostCents},
        distribution_cost_cents = ${distributionCostCents},
        notes = ${notes || null},
        active = ${active},
        updated_at = NOW()
      WHERE organization_id = ${orgId}
        AND id = ${campaignId}
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: e instanceof Error ? e.message : "Failed to update campaign",
        },
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { ok: false, error: { message: "Admin authentication required." } },
      { status: 401 }
    );
  }

  try {
    await ensureAdminTables();

    const { campaignId } = await params;
    const orgId = getOrganizationId(request);

    const existing = await sql`
      SELECT id
      FROM marketing_campaigns
      WHERE organization_id = ${orgId}
        AND id = ${campaignId}
      LIMIT 1
    `;

    if (!existing[0]) {
      return NextResponse.json(
        { ok: false, error: { message: "Campaign not found" } },
        { status: 404 }
      );
    }

    await sql.begin(async (tx) => {
      await tx`
        DELETE FROM marketing_campaign_events
        WHERE organization_id = ${orgId}
          AND campaign_id = ${campaignId}
      `;

      await tx`
        UPDATE admin_orders
        SET
          campaign_id = NULL,
          campaign_code = NULL,
          landing_path = NULL,
          browser_session_key = NULL,
          first_touch_at = NULL,
          checkout_started_at = NULL,
          paid_at = CASE WHEN source = 'qr' THEN paid_at ELSE paid_at END,
          upload_completed_at = upload_completed_at,
          updated_at = NOW()
        WHERE organization_id = ${orgId}
          AND campaign_id = ${campaignId}
      `;

      await tx`
        DELETE FROM marketing_campaigns
        WHERE organization_id = ${orgId}
          AND id = ${campaignId}
      `;
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: e instanceof Error ? e.message : "Failed to delete campaign",
        },
      },
      { status: 400 }
    );
  }
}