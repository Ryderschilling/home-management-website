// src/app/api/qr/referral/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { stripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function makeCode() {
  // Example: CHM20-A1B2C3
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `CHM20-${suffix}`;
}

export async function GET(req: NextRequest) {
  try {
    await ensureAdminTables();

    const url = new URL(req.url);
    const sessionId = safe(url.searchParams.get("session_id"));

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: { message: "Missing session_id" } }, { status: 400 });
    }

    const orgId = env.DEFAULT_ORGANIZATION_ID;

    // Load the order
    const rows = await sql`
      SELECT id, referral_code, referral_coupon_id, referral_promo_code_id
      FROM admin_orders
      WHERE organization_id = ${orgId}
        AND stripe_session_id = ${sessionId}
      LIMIT 1
    `;

    const order = rows[0];
    if (!order) {
      return NextResponse.json(
        { ok: false, error: { message: "Order not found for this session_id" } },
        { status: 404 }
      );
    }

    // If already generated, just return it
    if (order.referral_code && String(order.referral_code).trim()) {
      return NextResponse.json({
        ok: true,
        data: { code: order.referral_code, alreadyCreated: true },
      });
    }

    // 1) Create coupon (20% off, one-time)
    const coupon = await stripe.coupons.create({
      percent_off: 20,
      duration: "once",
      name: "CHM 20% Off (Referral)",
    });

    // 2) Create promotion code (Stripe API now requires `promotion: { ... }`)
    let promoCodeId: string | null = null;
    let code: string | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = makeCode();
      try {
        const promo = await stripe.promotionCodes.create({
          promotion: {
            type: "coupon",
            coupon: coupon.id,
          },
          code: candidate,
          max_redemptions: 1,
        });

        promoCodeId = promo.id;
        code = promo.code ?? candidate;
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // code collision: try again
        if (attempt < 4 && msg.toLowerCase().includes("already exists")) continue;
        throw e;
      }
    }

    if (!promoCodeId || !code) {
      return NextResponse.json(
        { ok: false, error: { message: "Failed to generate a unique referral code" } },
        { status: 500 }
      );
    }

    // 3) Persist to DB
    await sql`
      UPDATE admin_orders
      SET
        referral_code = ${code},
        referral_coupon_id = ${coupon.id},
        referral_promo_code_id = ${promoCodeId},
        referral_created_at = NOW(),
        updated_at = NOW()
      WHERE organization_id = ${orgId}
        AND id = ${order.id}
    `;

    return NextResponse.json({
      ok: true,
      data: { code, alreadyCreated: false },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Referral generation failed" } },
      { status: 400 }
    );
  }
}