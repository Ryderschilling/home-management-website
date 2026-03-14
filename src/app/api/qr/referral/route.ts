import { NextRequest, NextResponse } from "next/server";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { stripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

async function ensureReferralColumns() {
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_code TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_coupon_id TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_promotion_code_id TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_promo_code_id TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_created_at TIMESTAMPTZ`;
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CHM-${suffix}`;
}

async function createReferral() {
  const coupon = await stripe.coupons.create({
    percent_off: 15,
    duration: "once",
    name: "CHM 15% Off (Referral)",
  });

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

      return {
        code: promo.code ?? candidate,
        couponId: coupon.id,
        promotionCodeId: promo.id,
      };
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
      if (attempt < 4 && msg.includes("already exists")) continue;
      throw e;
    }
  }

  throw new Error("Failed to generate a unique referral code");
}

export async function GET(req: NextRequest) {
  try {
    await ensureAdminTables();
    await ensureReferralColumns();

    const url = new URL(req.url);
    const sessionId = safe(url.searchParams.get("session_id"));

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing session_id" } },
        { status: 400 }
      );
    }

    const orgId = env.DEFAULT_ORGANIZATION_ID;

    const rows = await sql`
      SELECT
        id,
        referral_code,
        referral_coupon_id,
        referral_promotion_code_id,
        referral_promo_code_id
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

    const existingCode = safe(order.referral_code);
    const existingCouponId = safe(order.referral_coupon_id);
    const existingPromoId = safe(order.referral_promotion_code_id || order.referral_promo_code_id);

    if (existingCode && existingCouponId && existingPromoId) {
      if (!safe(order.referral_promotion_code_id) && safe(order.referral_promo_code_id)) {
        await sql`
          UPDATE admin_orders
          SET
            referral_promotion_code_id = ${existingPromoId},
            updated_at = NOW()
          WHERE organization_id = ${orgId}
            AND id = ${order.id}
        `;
      }

      return NextResponse.json({
        ok: true,
        data: {
          code: existingCode,
          alreadyCreated: true,
        },
      });
    }

    const { code, couponId, promotionCodeId } = await createReferral();

    await sql`
      UPDATE admin_orders
      SET
        referral_code = ${code},
        referral_coupon_id = ${couponId},
        referral_promotion_code_id = ${promotionCodeId},
        referral_promo_code_id = ${promotionCodeId},
        referral_created_at = NOW(),
        updated_at = NOW()
      WHERE organization_id = ${orgId}
        AND id = ${order.id}
    `;

    return NextResponse.json({
      ok: true,
      data: {
        code,
        alreadyCreated: false,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: err instanceof Error ? err.message : "Referral generation failed" },
      },
      { status: 400 }
    );
  }
}