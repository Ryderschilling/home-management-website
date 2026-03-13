// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

// bump these when you update /qr/terms
const TOS_VERSION = "2026-03-12";
const TOS_TEXT_HASH = "tos-2026-03-12";

function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "";
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const color = String(body?.color ?? "unknown").trim() || "unknown";
    const tosAccepted = Boolean(body?.tosAccepted);

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

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",

      // ✅ allow people to enter a promo code on Stripe Checkout
      allow_promotion_codes: true,

      success_url: `${appUrl}/qr/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/qr`,

      metadata: {
        source: "qr",
        product_key: "artificial_rock_installation",
        rock_color: color,

        tos_version: TOS_VERSION,
        tos_url: `${appUrl}/qr/terms`,
        tos_text_hash: TOS_TEXT_HASH,
        tos_accepted_at: new Date().toISOString(),

        // keep short (Stripe metadata has size limits)
        tos_ip: ip.slice(0, 64),
        tos_user_agent: ua.slice(0, 180),
      },
    };

    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ ok: true, data: { url: session.url } });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Checkout failed" } },
      { status: 400 }
    );
  }
}