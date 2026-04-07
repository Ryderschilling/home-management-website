/**
 * GET  /api/admin/leads   — list all marketing email leads
 * POST /api/admin/leads   — suppress a lead's drip sequence  { email: string }
 */

import { NextRequest, NextResponse } from "next/server";

import { ok, fail } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { getOrganizationId } from "@/lib/server/request";
import { suppressLeadDrip } from "@/lib/server/lead-drip";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const organizationId = getOrganizationId(request);
    await ensureAdminTables();

    const rows = await sql`
      SELECT
        id,
        first_name,
        email,
        status,
        source_page,
        campaign_code,
        consent_at,
        drip_suppressed_at,
        created_at,
        updated_at,
        CASE
          WHEN drip_suppressed_at IS NOT NULL THEN 'suppressed'
          WHEN status = 'active' THEN 'active'
          ELSE status
        END AS drip_status
      FROM marketing_email_leads
      WHERE organization_id = ${organizationId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(ok(rows));
  } catch (error) {
    return NextResponse.json(
      fail("LEADS_LIST_FAILED", error instanceof Error ? error.message : "Failed to list leads"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const organizationId = getOrganizationId(request);
    await ensureAdminTables();

    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(fail("MISSING_EMAIL", "email is required"), { status: 400 });
    }

    const result = await suppressLeadDrip(email, organizationId);

    return NextResponse.json(ok({ email, ...result }));
  } catch (error) {
    return NextResponse.json(
      fail("SUPPRESS_FAILED", error instanceof Error ? error.message : "Failed to suppress lead"),
      { status: 500 }
    );
  }
}
