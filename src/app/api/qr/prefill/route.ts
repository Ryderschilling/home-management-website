// src/app/api/qr/prefill/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = safe(req.nextUrl.searchParams.get("session_id"));

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing session_id" } },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const addr =
      (session as { shipping_details?: { address?: StripeAddressLike | null } })
        .shipping_details?.address ??
      session.customer_details?.address ??
      null;

    return NextResponse.json({
      ok: true,
      data: {
        fullName: safe(session.customer_details?.name),
        email: safe(session.customer_details?.email).toLowerCase(),
        phone: safe(session.customer_details?.phone),
        address1: safe(addr?.line1),
        address2: safe(addr?.line2),
        city: safe(addr?.city),
        state: safe(addr?.state),
        postalCode: safe(addr?.postal_code),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Unable to load prefill" } },
      { status: 500 }
    );
  }
}

type StripeAddressLike = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
};