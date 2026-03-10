import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

function normalizeColor(color: unknown) {
  const c = String(color ?? "").trim().toLowerCase();
  if (c === "beige" || c === "sand" || c === "grey") return c;
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const { color } = await req.json();

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

    const rockColor = normalizeColor(color);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],

      // Always capture contact info for your list:
      customer_creation: "always",
      phone_number_collection: { enabled: true },

      // Capture address (use shipping address as "service address"):
      shipping_address_collection: { allowed_countries: ["US"] },
      billing_address_collection: "auto",

      success_url: `${appUrl}/qr/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/qr`,

      metadata: {
        source: "qr",
        product_key: "artificial_rock_installation",
        rock_color: rockColor,
      },

      payment_intent_data: {
        description: `Artificial Rock Installation — ${rockColor}`,
        metadata: {
          source: "qr",
          product_key: "artificial_rock_installation",
          rock_color: rockColor,
        },
      },
    });

    return NextResponse.json({ ok: true, data: { url: session.url } });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Checkout failed" } },
      { status: 400 }
    );
  }
}