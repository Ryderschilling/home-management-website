import { NextRequest, NextResponse } from "next/server";
import { normalizeCampaignCode } from "@/lib/campaigns";
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

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { ok: false, error: { message: "Admin authentication required." } },
      { status: 401 }
    );
  }

  try {
    await ensureAdminTables();
    const orgId = getOrganizationId(request);

    const rows = await sql`
      SELECT
        c.id,
        c.name,
        c.campaign_code,
        c.channel,
        c.landing_path,
        c.flyers_sent,
        c.print_cost_cents,
        c.distribution_cost_cents,
        c.notes,
        c.active,
        c.created_at,
        c.updated_at,

        COALESCE(v.visits, 0) AS visits,
        COALESCE(v.unique_visitors, 0) AS unique_visitors,
        COALESCE(cs.checkout_starts, 0) AS checkout_starts,
        COALESCE(o.paid_orders, 0) AS paid_orders,
COALESCE(o.upload_completed, 0) AS upload_completed,
COALESCE(o.discount_uses, 0) AS discount_uses,
COALESCE(o.revenue_cents, 0) AS revenue_cents,
COALESCE(l.email_leads, 0) AS email_leads
      FROM marketing_campaigns c
      LEFT JOIN (
        SELECT
          campaign_id,
          COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS visits,
          COUNT(DISTINCT session_key) FILTER (
            WHERE event_type = 'page_view' AND session_key IS NOT NULL AND session_key <> ''
          )::int AS unique_visitors
        FROM marketing_campaign_events
        WHERE organization_id = ${orgId}
        GROUP BY campaign_id
      ) v ON v.campaign_id = c.id
      LEFT JOIN (
        SELECT
          campaign_id,
          COUNT(*) FILTER (WHERE event_type = 'checkout_started')::int AS checkout_starts
        FROM marketing_campaign_events
        WHERE organization_id = ${orgId}
        GROUP BY campaign_id
      ) cs ON cs.campaign_id = c.id
      LEFT JOIN (
  SELECT
    campaign_id,
    COUNT(*) FILTER (WHERE status = 'PAID')::int AS paid_orders,
    COUNT(*) FILTER (WHERE upload_completed_at IS NOT NULL)::int AS upload_completed,
    COUNT(*) FILTER (WHERE used_promotion_code = TRUE)::int AS discount_uses,
    COALESCE(SUM(total_amount_cents), 0)::int AS revenue_cents
  FROM admin_orders
  WHERE organization_id = ${orgId}
  GROUP BY campaign_id
) o ON o.campaign_id = c.id
LEFT JOIN (
  SELECT
    campaign_id,
    COUNT(*)::int AS email_leads
  FROM marketing_email_leads
  WHERE organization_id = ${orgId}
  GROUP BY campaign_id
) l ON l.campaign_id = c.id
WHERE c.organization_id = ${orgId}
      ORDER BY c.created_at DESC
    `;

    return NextResponse.json({ ok: true, data: rows });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: e instanceof Error ? e.message : "Failed to load campaigns",
        },
      },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { ok: false, error: { message: "Admin authentication required." } },
      { status: 401 }
    );
  }

  try {
    await ensureAdminTables();
    const orgId = getOrganizationId(request);
    const body = await request.json().catch(() => ({} as Record<string, unknown>));

    const name = safe(body.name);
    const campaignCode = normalizeCampaignCode(body.campaign_code);
    const channel = safe(body.channel || "flyer") || "flyer";
    const landingPath = safe(body.landing_path || "/qr") || "/qr";
    const flyersSent = intOrZero(body.flyers_sent);
    const printCostCents = dollarsToCents(body.print_cost_dollars);
    const distributionCostCents = dollarsToCents(body.distribution_cost_dollars);
    const notes = safe(body.notes);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing campaign name" } },
        { status: 400 }
      );
    }

    if (!campaignCode) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing campaign code" } },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM marketing_campaigns
      WHERE organization_id = ${orgId}
        AND campaign_code = ${campaignCode}
      LIMIT 1
    `;

    if (existing[0]) {
      return NextResponse.json(
        { ok: false, error: { message: "Campaign code already exists" } },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();

    await sql`
      INSERT INTO marketing_campaigns (
        id,
        organization_id,
        name,
        campaign_code,
        channel,
        landing_path,
        flyers_sent,
        print_cost_cents,
        distribution_cost_cents,
        notes
      )
      VALUES (
        ${id},
        ${orgId},
        ${name},
        ${campaignCode},
        ${channel},
        ${landingPath},
        ${flyersSent},
        ${printCostCents},
        ${distributionCostCents},
        ${notes || null}
      )
    `;

    return NextResponse.json(
      {
        ok: true,
        data: { id },
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: e instanceof Error ? e.message : "Failed to create campaign",
        },
      },
      { status: 400 }
    );
  }
}
