/**
 * GET   /api/admin/leads               — list all marketing email leads
 * POST  /api/admin/leads               — suppress a lead's drip sequence  { email: string }
 * PATCH /api/admin/leads               — update pipeline status / notes  { id, pipeline_status, pipeline_notes? }
 */

import { NextRequest, NextResponse } from "next/server";

import { ok, fail } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { getOrganizationId } from "@/lib/server/request";
import { suppressLeadDrip } from "@/lib/server/lead-drip";

export const runtime = "nodejs";

const VALID_PIPELINE_STATUSES = ["new", "contacted", "quoted", "converted", "dead"] as const;
type PipelineStatus = (typeof VALID_PIPELINE_STATUSES)[number];

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
        phone,
        neighborhood,
        status,
        source_page,
        campaign_code,
        consent_at,
        drip_suppressed_at,
        qualification_json,
        lead_score,
        lead_grade,
        qualified_at,
        pipeline_status,
        pipeline_notes,
        pipeline_updated_at,
        created_at,
        updated_at,
        CASE
          WHEN drip_suppressed_at IS NOT NULL THEN 'suppressed'
          WHEN status = 'active' THEN 'active'
          ELSE status
        END AS drip_status
      FROM marketing_email_leads
      WHERE organization_id = ${organizationId}
      ORDER BY
        CASE WHEN lead_grade = 'A' THEN 0
             WHEN lead_grade = 'B' THEN 1
             WHEN lead_grade = 'C' THEN 2
             WHEN lead_grade = 'D' THEN 3
             ELSE 4 END ASC,
        created_at DESC
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

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const organizationId = getOrganizationId(request);
    await ensureAdminTables();

    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const id = String(body.id ?? "").trim();
    const pipelineStatus = String(body.pipeline_status ?? "").trim() as PipelineStatus;
    const pipelineNotes = body.pipeline_notes !== undefined
      ? String(body.pipeline_notes ?? "").trim() || null
      : undefined;

    if (!id) {
      return NextResponse.json(fail("MISSING_ID", "id is required"), { status: 400 });
    }

    if (!VALID_PIPELINE_STATUSES.includes(pipelineStatus)) {
      return NextResponse.json(
        fail("INVALID_STATUS", `pipeline_status must be one of: ${VALID_PIPELINE_STATUSES.join(", ")}`),
        { status: 400 }
      );
    }

    // If converting, also suppress the drip sequence
    if (pipelineStatus === "converted") {
      const lead = await sql`
        SELECT email FROM marketing_email_leads
        WHERE id = ${id} AND organization_id = ${organizationId}
        LIMIT 1
      `;
      if (lead[0]?.email) {
        await suppressLeadDrip(lead[0].email, organizationId).catch(() => {/* non-blocking */});
      }
    }

    if (pipelineNotes !== undefined) {
      await sql`
        UPDATE marketing_email_leads
        SET
          pipeline_status = ${pipelineStatus},
          pipeline_notes = ${pipelineNotes},
          pipeline_updated_at = NOW(),
          updated_at = NOW()
        WHERE id = ${id}
          AND organization_id = ${organizationId}
      `;
    } else {
      await sql`
        UPDATE marketing_email_leads
        SET
          pipeline_status = ${pipelineStatus},
          pipeline_updated_at = NOW(),
          updated_at = NOW()
        WHERE id = ${id}
          AND organization_id = ${organizationId}
      `;
    }

    return NextResponse.json(ok({ id, pipeline_status: pipelineStatus }));
  } catch (error) {
    return NextResponse.json(
      fail("PIPELINE_UPDATE_FAILED", error instanceof Error ? error.message : "Failed to update pipeline status"),
      { status: 500 }
    );
  }
}
