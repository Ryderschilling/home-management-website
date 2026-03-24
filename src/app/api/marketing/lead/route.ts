import { NextRequest, NextResponse } from "next/server";
import { normalizeCampaignCode } from "@/lib/campaigns";
import { resolveCampaignByCode } from "@/lib/server/campaigns";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

const CONSENT_TEXT =
  "I agree to receive marketing emails, offers, and updates from Coastal Home Management 30A.";

export async function POST(req: NextRequest) {
  try {
    await ensureAdminTables();

    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const firstName = safe(body.firstName);
    const email = safe(body.email).toLowerCase();
    const campaignCode = normalizeCampaignCode(body.campaignCode);
    const sessionKey = safe(body.sessionKey);
    const sourcePage = safe(body.sourcePage || "/qr") || "/qr";
    const consent = body.consent === true;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing email" } },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { ok: false, error: { message: "Consent is required" } },
        { status: 400 }
      );
    }

    const orgId = env.DEFAULT_ORGANIZATION_ID;

    let campaignId: string | null = null;
    let normalizedCampaignCode: string | null = null;

    if (campaignCode) {
      const campaign = await resolveCampaignByCode(orgId, campaignCode);

      if (campaign) {
        campaignId = campaign.id;
        normalizedCampaignCode = campaign.campaignCode;
      }
    }

    const existingLead = await sql`
      SELECT id
      FROM marketing_email_leads
      WHERE organization_id = ${orgId}
        AND lower(email) = ${email}
      LIMIT 1
    `;

    if (existingLead[0]) {
      await sql`
        UPDATE marketing_email_leads
        SET
          first_name = COALESCE(${firstName || null}, first_name),
          campaign_id = COALESCE(${campaignId}, campaign_id),
          campaign_code = COALESCE(${normalizedCampaignCode}, campaign_code),
          session_key = COALESCE(${sessionKey || null}, session_key),
          consent_text = ${CONSENT_TEXT},
          consent_at = COALESCE(consent_at, NOW()),
          source_page = COALESCE(${sourcePage || null}, source_page),
          status = 'active',
          updated_at = NOW()
        WHERE organization_id = ${orgId}
          AND id = ${existingLead[0].id}
      `;

      if (campaignId || normalizedCampaignCode) {
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
            ${campaignId},
            ${normalizedCampaignCode},
            ${sessionKey || null},
            ${"email_opt_in"},
            ${sourcePage},
            ${JSON.stringify({ email, firstName, deduped: true })}
          )
        `;
      }

      return NextResponse.json({
        ok: true,
        data: {
          alreadyExists: true,
        },
      });
    }

    const leadId = crypto.randomUUID();

    await sql`
      INSERT INTO marketing_email_leads (
        id,
        organization_id,
        campaign_id,
        campaign_code,
        session_key,
        first_name,
        email,
        consent_text,
        consent_at,
        source_page,
        status
      )
      VALUES (
        ${leadId},
        ${orgId},
        ${campaignId},
        ${normalizedCampaignCode},
        ${sessionKey || null},
        ${firstName || null},
        ${email},
        ${CONSENT_TEXT},
        NOW(),
        ${sourcePage},
        ${"active"}
      )
    `;

    if (campaignId || normalizedCampaignCode) {
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
          ${campaignId},
          ${normalizedCampaignCode},
          ${sessionKey || null},
          ${"email_opt_in"},
          ${sourcePage},
          ${JSON.stringify({ email, firstName, deduped: false })}
        )
      `;
    }

    return NextResponse.json({
      ok: true,
      data: {
        alreadyExists: false,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: e instanceof Error ? e.message : "Lead capture failed" },
      },
      { status: 500 }
    );
  }
}
