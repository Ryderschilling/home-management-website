import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/server/stripe";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

const TOS_VERSION = "2026-03-12";
const TOS_TEXT_HASH = "tos-2026-03-12";

function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "";
  return "";
}

function safe(v: unknown) {
  return String(v ?? "").trim();
}

export async function POST(req: NextRequest) {
  try {
    await ensureAdminTables();

    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const color = safe(body.color || "unknown") || "unknown";
    const tosAccepted = Boolean(body.tosAccepted);

    const campaignCode = safe(body.campaignCode);
    const sessionKey = safe(body.sessionKey);
    const landingPath = safe(body.landingPath || "/qr") || "/qr";

    if (!tosAccepted) {
      return NextResponse.json(
        { ok: false, error: { message: "You must accept the Terms to continue." } },
        { status: 400 }
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID_PIPE;
    const appUrl = process.env.APP_URL;

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing STRIPE_PRICE_ID_PIPE" } },
        { status: 500 }
      );
    }

    if (!appUrl) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing APP_URL" } },
        { status: 500 }
      );
    }

    const ua = req.headers.get("user-agent") ?? "";
    const ip = getClientIp(req);

    let campaignId = "";
    let normalizedCampaignCode = "";

    if (campaignCode) {
      const rows = await sql`
        SELECT id, campaign_code
        FROM marketing_campaigns
        WHERE organization_id = ${env.DEFAULT_ORGANIZATION_ID}
          AND campaign_code = ${campaignCode}
        LIMIT 1
      `;

      if (rows[0]) {
        campaignId = String(rows[0].id);
        normalizedCampaignCode = String(rows[0].campaign_code);
      }
    }

    if (campaignId) {
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
          ${env.DEFAULT_ORGANIZATION_ID},
          ${campaignId},
          ${normalizedCampaignCode},
          ${sessionKey || null},
          ${"checkout_started"},
          ${landingPath},
          ${JSON.stringify({ color })}
        )
      `;
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",

      allow_promotion_codes: true,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },

      success_url: `${appUrl}/qr/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/qr`,

      metadata: {
        source: "qr",
        product_key: "artificial_rock_installation",
        rock_color: color,

        campaign_id: campaignId,
        campaign_code: normalizedCampaignCode,
        landing_path: landingPath,
        browser_session_key: sessionKey,

        tos_version: TOS_VERSION,
        tos_url: `${appUrl}/qr/terms`,
        tos_text_hash: TOS_TEXT_HASH,
        tos_accepted_at: new Date().toISOString(),

        tos_ip: ip.slice(0, 64),
        tos_user_agent: ua.slice(0, 180),
      },
    };

    const session = await stripe.checkout.sessions.create(params);

    return NextResponse.json({
      ok: true,
      data: { url: session.url },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Checkout failed" } },
      { status: 400 }
    );
  }
}