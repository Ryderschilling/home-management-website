import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { normalizeCampaignCode } from "@/lib/campaigns";
import { resolveCampaignByCode } from "@/lib/server/campaigns";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { scheduleDripSequence } from "@/lib/server/lead-drip";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";

const resend = new Resend(env.RESEND_API_KEY);

/**
 * GET /api/marketing/lead
 * Returns all email leads for the org, sorted by most recent.
 * Requires x-admin-password header.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-admin-password");
    if (authHeader !== env.ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    await ensureAdminTables();

    const orgId = env.DEFAULT_ORGANIZATION_ID;

    const leads = await sql`
      SELECT
        id,
        email,
        first_name,
        status,
        source_page,
        campaign_code,
        drip_suppressed_at,
        created_at
      FROM marketing_email_leads
      WHERE organization_id = ${orgId}
      ORDER BY created_at DESC
      LIMIT 200
    `;

    return NextResponse.json({ ok: true, data: { leads } });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Failed to fetch leads" } },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(firstName: string | null, email: string) {
  const name = firstName || "there";
  const displayName = firstName || "there";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Coastal Home Management 30A</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f3;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#fafaf8;border-top:3px solid #0b0b0b;">

          <!-- Header -->
          <tr>
            <td style="padding:36px 44px 0;">
              <p style="margin:0 0 28px 0;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(0,0,0,0.4);">
                Watersound Origins · Naturewalk · 30A
              </p>
              <h1 style="margin:0 0 16px 0;font-family:ui-serif,Georgia,'Times New Roman',Times,serif;font-size:26px;font-weight:600;line-height:1.1;letter-spacing:-0.02em;color:#0b0b0b;">
                Hey ${displayName} — thanks for reaching out.
              </h1>
              <div style="width:40px;height:1px;background:rgba(0,0,0,0.15);margin:20px 0;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 44px 32px;">
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:rgba(0,0,0,0.7);">
                I'm Ryder — founder of Coastal Home Management 30A. You asked about protecting
                your property, and that's exactly what I do.
              </p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:rgba(0,0,0,0.7);">
                Here's what typically goes wrong in 30A homes when owners are away:
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;width:100%;">
                ${["Storm damage that sits undetected for weeks",
                   "HVAC failures that cause mold before anyone notices",
                   "Packages sitting on the porch for days",
                   "Contractors who show up — and no one's there to let them in",
                   "Pipes, leaks, and small issues that become expensive ones"].map(item => `
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="display:inline-block;width:16px;font-size:13px;color:rgba(0,0,0,0.35);">—</span>
                    <span style="font-size:14px;color:rgba(0,0,0,0.7);line-height:1.5;">${item}</span>
                  </td>
                </tr>`).join("")}
              </table>
              <p style="margin:0 0 32px 0;font-size:15px;line-height:1.65;color:rgba(0,0,0,0.7);">
                I'll be in touch within 24 hours to schedule a free walkthrough of your property.
                No commitment — just a conversation and a real look at what your home needs.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="mailto:coastalhomemanagement30a@gmail.com?subject=Property%20Walkthrough%20Request"
                       style="display:inline-block;background:#0b0b0b;color:#fafaf8;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:14px 28px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
                      Reply to this email
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:24px 44px 36px;border-top:1px solid rgba(0,0,0,0.08);">
              <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(0,0,0,0.6);">
                — Ryder<br />
                <span style="font-size:12px;color:rgba(0,0,0,0.4);">Coastal Home Management 30A</span><br />
                <a href="tel:3094158793" style="font-size:12px;color:rgba(0,0,0,0.4);text-decoration:none;">(309) 415-8793</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 44px 24px;background:#f0efed;">
              <p style="margin:0;font-size:11px;color:rgba(0,0,0,0.35);line-height:1.5;">
                You received this because you requested information at coastalhomemanagement30a.com.
                We won't spam you — this is a real person reaching out.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: env.FROM_EMAIL,
      to: email,
      replyTo: env.REPLY_TO_EMAIL || "coastalhomemanagement30a@gmail.com",
      subject: "Your 30A home — let's talk.",
      html,
    });
  } catch (err) {
    // Log but don't fail the lead capture if email sending fails
    console.error("[CHM] Welcome email failed to send:", err);
  }
}

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
    const phone = safe(body.phone) || null;
    const neighborhood = safe(body.neighborhood) || null;
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
          phone = COALESCE(${phone}, phone),
          neighborhood = COALESCE(${neighborhood}, neighborhood),
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

      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: email,
        event: "lead_captured",
        properties: {
          source_page: sourcePage,
          campaign_code: normalizedCampaignCode || null,
          is_new_lead: false,
        },
      });

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
        phone,
        neighborhood,
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
        ${phone},
        ${neighborhood},
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

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: email,
      event: "lead_captured",
      properties: {
        source_page: sourcePage,
        campaign_code: normalizedCampaignCode || null,
        is_new_lead: true,
      },
    });

    // Fire welcome email + schedule drip sequence — truly non-blocking.
    // Do NOT await these. Return the 200 immediately; email delivery happens in the background.
    // Errors are caught and logged inside each function — they will never block or fail the response.
    void sendWelcomeEmail(firstName || null, email);
    void scheduleDripSequence(
      firstName || null,
      email,
      env.APP_URL,
      env.FROM_EMAIL,
      env.REPLY_TO_EMAIL,
      orgId
    );

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
