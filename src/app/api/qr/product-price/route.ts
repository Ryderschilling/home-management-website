import { NextResponse } from "next/server";
import { stripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

export async function GET() {
  try {
    const priceId = process.env.STRIPE_PRICE_ID_PIPE;

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing STRIPE_PRICE_ID_PIPE" } },
        { status: 500 }
      );
    }

    const price = await stripe.prices.retrieve(priceId);
    const productPriceCents =
      typeof price.unit_amount === "number" && price.unit_amount > 0
        ? Math.round(price.unit_amount)
        : 0;

    return NextResponse.json(
      {
        ok: true,
        data: { productPriceCents },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: error instanceof Error ? error.message : "Unable to load price" },
      },
      { status: 500 }
    );
  }
}
