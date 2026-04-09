import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { getOrganizationId } from "@/lib/server/request";

export const runtime = "nodejs";

/**
 * POST /api/admin/reset-stats
 *
 * Wipes all marketing event / lead data so campaign and visitor stats
 * start fresh. Use this before a new outreach wave (e.g. postcard drop).
 *
 * What gets cleared:
 *  - marketing_campaign_events   (visit/checkout/conversion funnel events)
 *  - marketing_email_leads       (lead capture signups)
 *  - admin_orders.campaign_id    (unlinks past orders from campaigns so
 *                                 paid-order counts start at 0 too)
 *
 * What is NOT touched:
 *  - admin_orders themselves (orders, clients, invoices all stay intact)
 *  - PostHog visitor data     (external — use the 7D date filter to see
 *                              fresh visitor stats after the reset)
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { ok: false, error: { message: "Admin authentication required." } },
      { status: 401 }
    );
  }

  const orgId = getOrganizationId(request);

  try {
    // 1. Clear all funnel/visit events
    const eventsResult = await sql`
      DELETE FROM marketing_campaign_events
      WHERE organization_id = ${orgId}
      RETURNING id
    `;

    // 2. Clear email lead captures
    const leadsResult = await sql`
      DELETE FROM marketing_email_leads
      WHERE organization_id = ${orgId}
      RETURNING id
    `;

    // 3. Unlink campaign attribution from orders so paid-order counts reset
    const ordersResult = await sql`
      UPDATE admin_orders
      SET
        campaign_id   = NULL,
        campaign_code = NULL,
        updated_at    = NOW()
      WHERE organization_id = ${orgId}
        AND campaign_id IS NOT NULL
      RETURNING id
    `;

    return NextResponse.json({
      ok: true,
      data: {
        deleted_events:       eventsResult.length,
        deleted_leads:        leadsResult.length,
        unlinked_orders:      ordersResult.length,
        reset_at:             new Date().toISOString(),
        note: "Campaign stats reset to zero. PostHog visitor stats are external — use the 7D date filter in the visitors dashboard to see fresh data from today forward.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: error instanceof Error ? error.message : "Stats reset failed",
        },
      },
      { status: 500 }
    );
  }
}
