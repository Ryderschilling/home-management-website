import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { normalizeCampaignCode } from "@/lib/campaigns";
import { stripe } from "@/lib/server/stripe";
import { resolveCampaignByCode } from "@/lib/server/campaigns";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import {
  QR_MAIN_PRODUCT_KEY,
  QR_MAIN_PRODUCT_NAME,
  QR_UPSELL_ADDON_KEY,
  QR_UPSELL_ADDON_NAME,
  QR_UPSELL_ADDON_PRICE_CENTS,
  parseBooleanFlag,
  safeString,
} from "@/lib/qr-funnel";

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

    const campaignCode = normalizeCampaignCode(body.campaignCode);
    const sessionKey = safe(body.sessionKey);
    const landingPath = safe(body.landingPath || "/qr") || "/qr";
    const addonSelected = parseBooleanFlag(body.addonSelected);
    const addonProductKey = safeString(body.addonProductKey) || QR_UPSELL_ADDON_KEY;
    const addonProductName = safeString(body.addonProductName) || QR_UPSELL_ADDON_NAME;
    const addonPriceCentsRaw = Number(body.addonPriceCents);
    const addonPriceCents =
      addonSelected && Number.isFinite(addonPriceCentsRaw) && addonPriceCentsRaw > 0
        ? Math.round(addonPriceCentsRaw)
        : QR_UPSELL_ADDON_PRICE_CENTS;

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
      const campaign = await resolveCampaignByCode(
        env.DEFAULT_ORGANIZATION_ID,
        campaignCode
      );

      if (campaign) {
        campaignId = campaign.id;
        normalizedCampaignCode = campaign.campaignCode;
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
          ${JSON.stringify({ color, addonSelected })}
        )
      `;
    }

    const upgradeParams = new URLSearchParams({
      color,
      campaignCode,
      sessionKey,
      landingPath,
      addon: addonSelected ? "1" : "0",
    });

    const successParams = new URLSearchParams({
      color,
      addon: addonSelected ? "1" : "0",
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    if (addonSelected) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: {
            name: addonProductName,
          },
          unit_amount: addonPriceCents,
        },
      });
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      customer_creation: "always",

      allow_promotion_codes: true,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },

      success_url: `${appUrl}/qr/success?session_id={CHECKOUT_SESSION_ID}&${successParams.toString()}`,
      cancel_url: `${appUrl}/qr/upgrade?${upgradeParams.toString()}`,

      metadata: {
        source: "qr",
        product_key: QR_MAIN_PRODUCT_KEY,
        product_name: QR_MAIN_PRODUCT_NAME,
        rock_color: color,
        addon_selected: addonSelected ? "true" : "false",
        addon_product_key: addonSelected ? addonProductKey : "",
        addon_product_name: addonSelected ? addonProductName : "",
        addon_price_cents: addonSelected ? String(addonPriceCents) : "0",

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
