import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/server/stripe";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { sendPipePhotoEmail } from "@/lib/server/email";

export const runtime = "nodejs";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function addressToString(addr: any): string {
  if (!addr) return "";
  const parts = [
    addr.line1,
    addr.line2,
    addr.city,
    addr.state,
    addr.postal_code,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
}

async function ensureReferralColumns() {
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_code TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_coupon_id TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_promotion_code_id TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_promo_code_id TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_created_at TIMESTAMPTZ`;
}

function makeReferralCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `CHM-${s}`;
}

async function createOneTime20OffPromotionCode() {
    const coupon = await stripe.coupons.create({
        percent_off: 15,
        duration: "once",
        name: "CHM 15% Off (Referral)",
      });

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeReferralCode();

    try {
      const promo = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: coupon.id },
        code,
        max_redemptions: 1,
      });

      return {
        code: promo.code ?? code,
        couponId: coupon.id,
        promotionCodeId: promo.id,
      };
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
      if (msg.includes("already exists")) continue;
      throw e;
    }
  }

  throw new Error("Failed to create a unique referral code.");
}

async function upsertClientAndOrderFromSession(session: Stripe.Checkout.Session) {
  await ensureAdminTables();
  await ensureReferralColumns();

  const orgId = env.DEFAULT_ORGANIZATION_ID;

  const rockColor = safe(session.metadata?.rock_color || (session.metadata as any)?.color || "unknown");
  const productKey = safe(session.metadata?.product_key || "artificial_rock_installation");

  const email = safe(session.customer_details?.email).toLowerCase();
  const phone = safe(session.customer_details?.phone);

  const shippingAddr = addressToString((session as any).shipping_details?.address);
  const billingAddr = addressToString(session.customer_details?.address);
  const serviceAddress = safe(shippingAddr || billingAddr);

  const fullName = safe(session.customer_details?.name) || safe(session.metadata?.customer_name);

  const stripeSessionId = safe(session.id);
  const stripeCustomerId = (session.customer as string | null) ?? null;
  const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;

  const totalCents = typeof session.amount_total === "number" ? session.amount_total : 0;

  const campaignId = safe(session.metadata?.campaign_id);
  const campaignCode = safe(session.metadata?.campaign_code);
  const landingPath = safe(session.metadata?.landing_path || "/qr");
  const browserSessionKey = safe(session.metadata?.browser_session_key);

  const hydrated = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["total_details.breakdown.discounts.discount.promotion_code"],
  });

  const discountEntry = (hydrated as any).total_details?.breakdown?.discounts?.[0];
  const promotionCode = safe(discountEntry?.discount?.promotion_code?.code);
  const discountAmountCents =
    typeof (hydrated as any).total_details?.amount_discount === "number"
      ? (hydrated as any).total_details.amount_discount
      : 0;

  let clientId: string | null = null;

  if (email) {
    const existingClient = await sql`
      SELECT id, name, email, phone, address_text, stripe_customer_id
      FROM admin_clients
      WHERE organization_id = ${orgId} AND email = ${email}
      LIMIT 1
    `;

    if (existingClient.length === 0) {
      clientId = crypto.randomUUID();
      await sql`
        INSERT INTO admin_clients (
          id, organization_id, name, email, phone, notes, address_text, stripe_customer_id
        )
        VALUES (
          ${clientId},
          ${orgId},
          ${fullName || "—"},
          ${email},
          ${phone || null},
          ${null},
          ${serviceAddress || null},
          ${stripeCustomerId || null}
        )
      `;
    } else {
      clientId = existingClient[0].id;
      await sql`
        UPDATE admin_clients
        SET
          name = ${fullName || existingClient[0].name},
          phone = ${phone || existingClient[0].phone},
          address_text = ${serviceAddress || existingClient[0].address_text},
          stripe_customer_id = ${stripeCustomerId || existingClient[0].stripe_customer_id},
          updated_at = NOW()
        WHERE organization_id = ${orgId} AND id = ${clientId}
      `;
    }
  }

  const existingOrder = await sql`
    SELECT
      id,
      referral_code,
      referral_coupon_id,
      referral_promotion_code_id,
      referral_promo_code_id
    FROM admin_orders
    WHERE organization_id = ${orgId} AND stripe_session_id = ${stripeSessionId}
    LIMIT 1
  `;

  let orderId: string;

  if (existingOrder.length === 0) {
    orderId = crypto.randomUUID();

    await sql`
      INSERT INTO admin_orders (
        id,
        organization_id,
        client_id,
        status,
        fulfillment_status,
        total_amount_cents,
        stripe_session_id,
        stripe_customer_id,
        stripe_payment_intent_id,
        source,
        product_key,
        rock_color,
        customer_name,
        customer_email,
        customer_phone,
        service_address,
        campaign_id,
        campaign_code,
        landing_path,
        browser_session_key,
        first_touch_at,
        checkout_started_at,
        paid_at,
        used_promotion_code,
        promotion_code,
        discount_amount_cents
      )
      VALUES (
        ${orderId},
        ${orgId},
        ${clientId},
        ${"PAID"},
        ${"NEW"},
        ${totalCents},
        ${stripeSessionId},
        ${stripeCustomerId},
        ${stripePaymentIntentId},
        ${"qr"},
        ${productKey},
        ${rockColor},
        ${fullName || null},
        ${email || null},
        ${phone || null},
        ${serviceAddress || null},
        ${campaignId || null},
        ${campaignCode || null},
        ${landingPath || null},
        ${browserSessionKey || null},
        NOW(),
        NOW(),
        NOW(),
        ${discountAmountCents > 0},
        ${promotionCode || null},
        ${discountAmountCents}
      )
    `;
  } else {
    orderId = existingOrder[0].id;

    await sql`
      UPDATE admin_orders
      SET
        client_id = COALESCE(${clientId}, client_id),
        status = ${"PAID"},
        fulfillment_status = COALESCE(fulfillment_status, ${"NEW"}),
        total_amount_cents = ${totalCents},
        stripe_customer_id = ${stripeCustomerId},
        stripe_payment_intent_id = ${stripePaymentIntentId},
        source = ${"qr"},
        product_key = ${productKey},
        rock_color = ${rockColor},
        customer_name = ${fullName || null},
        customer_email = ${email || null},
        customer_phone = ${phone || null},
        service_address = ${serviceAddress || null},
        campaign_id = COALESCE(${campaignId || null}, campaign_id),
        campaign_code = COALESCE(${campaignCode || null}, campaign_code),
        landing_path = COALESCE(${landingPath || null}, landing_path),
        browser_session_key = COALESCE(${browserSessionKey || null}, browser_session_key),
        checkout_started_at = COALESCE(checkout_started_at, NOW()),
        paid_at = NOW(),
        used_promotion_code = ${discountAmountCents > 0},
        promotion_code = ${promotionCode || null},
        discount_amount_cents = ${discountAmountCents},
        updated_at = NOW()
      WHERE organization_id = ${orgId} AND stripe_session_id = ${stripeSessionId}
    `;
  }

  if (campaignId || campaignCode) {
    await sql`
      INSERT INTO marketing_campaign_events (
        id,
        organization_id,
        campaign_id,
        campaign_code,
        session_key,
        event_type,
        page_path,
        order_id,
        metadata_json
      )
      VALUES (
        ${crypto.randomUUID()},
        ${orgId},
        ${campaignId || null},
        ${campaignCode || null},
        ${browserSessionKey || null},
        ${"order_paid"},
        ${landingPath || "/qr"},
        ${orderId},
        ${JSON.stringify({
          totalCents,
          rockColor,
          usedPromotionCode: discountAmountCents > 0,
          promotionCode: promotionCode || null,
        })}
      )
    `;
  }

  const existingReferral = existingOrder.length ? safe(existingOrder[0].referral_code) : "";
  const existingCouponId = existingOrder.length ? safe(existingOrder[0].referral_coupon_id) : "";
  const existingPromoId = existingOrder.length
    ? safe(existingOrder[0].referral_promotion_code_id || existingOrder[0].referral_promo_code_id)
    : "";

  if (!existingReferral || !existingCouponId || !existingPromoId) {
    const { code, couponId, promotionCodeId } = await createOneTime20OffPromotionCode();

    await sql`
      UPDATE admin_orders
      SET
        referral_code = ${code},
        referral_coupon_id = ${couponId},
        referral_promotion_code_id = ${promotionCodeId},
        referral_promo_code_id = ${promotionCodeId},
        referral_created_at = NOW(),
        updated_at = NOW()
      WHERE organization_id = ${orgId} AND id = ${orderId}
    `;
  }

  await sendPipePhotoEmail({
    subject: `NEW PAID ORDER — ${rockColor.toUpperCase()}`,
    html: `
      <p><strong>Status:</strong> PAID (NEW)</p>
      <p><strong>Product:</strong> ${productKey.replaceAll("_", " ")}</p>
      <p><strong>Color:</strong> ${rockColor}</p>
      <p><strong>Name:</strong> ${fullName || "—"}</p>
      <p><strong>Email:</strong> ${email || "—"}</p>
      <p><strong>Phone:</strong> ${phone || "—"}</p>
      <p><strong>Campaign:</strong> ${campaignCode || "—"}</p>
      <p><strong>Discount used:</strong> ${discountAmountCents > 0 ? "Yes" : "No"}</p>
      <p><strong>Service address:</strong><br/>${(serviceAddress || "—")
        .replaceAll("\n", "<br/>")
        .replaceAll(", ", "<br/>")}</p>
      <p><strong>Total:</strong> $${(totalCents / 100).toFixed(2)}</p>
      <p><strong>Stripe session:</strong> ${stripeSessionId}</p>
      <p><strong>Payment intent:</strong> ${stripePaymentIntentId || "—"}</p>
    `,
    attachmentName: "no-attachment.txt",
    attachmentBase64: Buffer.from("Paid order received.").toString("base64"),
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: { message: "Missing STRIPE_WEBHOOK_SECRET" } },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { ok: false, error: { message: "Missing stripe-signature header" } },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Invalid signature" } },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if ((session.payment_status ?? "") === "paid") {
        await upsertClientAndOrderFromSession(session);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Webhook failed" } },
      { status: 500 }
    );
  }
}