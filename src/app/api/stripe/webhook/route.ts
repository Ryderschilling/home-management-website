import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/server/stripe";
import { ensureAdminTables, ensureQrAddonColumns, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { sendPipePhotoEmail } from "@/lib/server/email";
import { syncInvoiceFromStripeEvent } from "@/lib/server/services/invoices";
import {
  QR_MAIN_PRODUCT_KEY,
  QR_UPSELL_ADDON_KEY,
  QR_UPSELL_ADDON_NAME,
  QR_UPSELL_ADDON_PRICE_CENTS,
  parseBooleanFlag,
} from "@/lib/qr-funnel";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";

type StripeAddressLike = Stripe.Address | null | undefined;
type CheckoutDiscountRef = { code?: string | null } | string | null | undefined;
type HydratedCheckoutSession = Stripe.Checkout.Session & {
  shipping_details?: {
    address?: StripeAddressLike;
  } | null;
  total_details?: {
    amount_discount?: number | null;
    breakdown?: {
      discounts?: Array<{
        discount?: {
          promotion_code?: CheckoutDiscountRef;
        } | null;
      }>;
    };
  } | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function addressToString(addr: StripeAddressLike): string {
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

async function ensureOrderWebhookColumns() {
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_code TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_coupon_id TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_promotion_code_id TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_promo_code_id TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_created_at TIMESTAMPTZ`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS paid_notification_sent_at TIMESTAMPTZ`;
  await ensureQrAddonColumns();
}

function makeReferralCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `CHM-${s}`;
}

async function createOneTimeReferralPromotionCode(percentOff = 15) {
  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: "once",
    name: `CHM ${percentOff}% Off (Referral)`,
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

async function getDiscountDetailsFromSession(sessionId: string) {
  const hydrated = (await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["total_details.breakdown.discounts.discount"],
  })) as HydratedCheckoutSession;

  const discountEntry = hydrated.total_details?.breakdown?.discounts?.[0];
  const discountObj =
    discountEntry?.discount && typeof discountEntry.discount === "object"
      ? discountEntry.discount
      : null;

  const discountAmountCents =
    typeof hydrated.total_details?.amount_discount === "number"
      ? hydrated.total_details.amount_discount
      : 0;

  let promotionCode: string | null = null;
  const promotionCodeRef = discountObj?.promotion_code;

  if (typeof promotionCodeRef === "string" && promotionCodeRef.trim()) {
    try {
      const promo = await stripe.promotionCodes.retrieve(promotionCodeRef.trim());
      promotionCode = safe(promo.code) || null;
    } catch (err) {
      console.error("Failed to retrieve Stripe promotion code:", err);
    }
  } else if (promotionCodeRef && typeof promotionCodeRef === "object") {
    promotionCode = safe(promotionCodeRef.code) || null;
  }

  return {
    discountAmountCents,
    promotionCode,
  };
}

async function upsertClientAndOrderFromSession(session: Stripe.Checkout.Session) {
  await ensureAdminTables();
  await ensureOrderWebhookColumns();

  const orgId = env.DEFAULT_ORGANIZATION_ID;

  const rockColor = safe(
    session.metadata?.rock_color || session.metadata?.color || "unknown"
  );
  const productKey = safe(session.metadata?.product_key || QR_MAIN_PRODUCT_KEY);
  const addonSelected = parseBooleanFlag(session.metadata?.addon_selected);
  const addonProductKey = addonSelected
    ? safe(session.metadata?.addon_product_key || QR_UPSELL_ADDON_KEY)
    : null;
  const addonProductName = addonSelected
    ? safe(session.metadata?.addon_product_name || QR_UPSELL_ADDON_NAME)
    : null;
  const addonPriceRaw = Number(session.metadata?.addon_price_cents);
  const addonPriceCents = addonSelected
    ? Number.isFinite(addonPriceRaw) && addonPriceRaw > 0
      ? Math.round(addonPriceRaw)
      : QR_UPSELL_ADDON_PRICE_CENTS
    : null;

  const email = safe(session.customer_details?.email).toLowerCase();
  const phone = safe(session.customer_details?.phone);

  const hydratedSession = session as HydratedCheckoutSession;
  const shippingAddr = addressToString(hydratedSession.shipping_details?.address);
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

  const { discountAmountCents, promotionCode } = await getDiscountDetailsFromSession(session.id);

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
      referral_promo_code_id,
      paid_notification_sent_at
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
        addon_product_key,
        addon_product_name,
        addon_price_cents,
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
        ${addonProductKey},
        ${addonProductName},
        ${addonPriceCents},
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
        addon_product_key = ${addonProductKey},
        addon_product_name = ${addonProductName},
        addon_price_cents = ${addonPriceCents},
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
    const existingPaidEvent = await sql`
      SELECT id
      FROM marketing_campaign_events
      WHERE organization_id = ${orgId}
        AND order_id = ${orderId}
        AND event_type = ${"order_paid"}
      LIMIT 1
    `;

    if (existingPaidEvent.length === 0) {
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
            addonSelected,
            addonProductName,
            usedPromotionCode: discountAmountCents > 0,
            promotionCode: promotionCode || null,
          })}
        )
      `;
    }
  }

  const existingReferral = existingOrder.length ? safe(existingOrder[0].referral_code) : "";
  const existingCouponId = existingOrder.length ? safe(existingOrder[0].referral_coupon_id) : "";
  const existingPromoId = existingOrder.length
    ? safe(existingOrder[0].referral_promotion_code_id || existingOrder[0].referral_promo_code_id)
    : "";

  if (!existingReferral || !existingCouponId || !existingPromoId) {
    const { code, couponId, promotionCodeId } = await createOneTimeReferralPromotionCode(15);

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

  const alreadySentPaidNotification =
    existingOrder.length > 0 && !!existingOrder[0].paid_notification_sent_at;

  if (!alreadySentPaidNotification) {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: email || stripeSessionId,
      event: "order_completed",
      properties: {
        rock_color: rockColor,
        product_key: productKey,
        addon_selected: addonSelected,
        addon_product_key: addonProductKey ?? null,
        total_cents: totalCents,
        campaign_code: campaignCode || null,
        used_promotion_code: discountAmountCents > 0,
        promotion_code: promotionCode || null,
        stripe_session_id: stripeSessionId,
      },
    });

    await sendPipePhotoEmail({
      subject: `NEW PAID ORDER — ${rockColor.toUpperCase()}`,
      html: `
        <p><strong>Status:</strong> PAID (NEW)</p>
        <p><strong>Product:</strong> ${productKey.replaceAll("_", " ")}</p>
        <p><strong>Color:</strong> ${rockColor}</p>
        <p><strong>Add-on:</strong> ${
          addonSelected
            ? `${addonProductName} ($${((addonPriceCents ?? 0) / 100).toFixed(2)})`
            : "—"
        }</p>
        <p><strong>Name:</strong> ${fullName || "—"}</p>
        <p><strong>Email:</strong> ${email || "—"}</p>
        <p><strong>Phone:</strong> ${phone || "—"}</p>
        <p><strong>Campaign:</strong> ${campaignCode || "—"}</p>
        <p><strong>Discount used:</strong> ${discountAmountCents > 0 ? "Yes" : "No"}</p>
        <p><strong>Promotion code:</strong> ${promotionCode || "—"}</p>
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

    await sql`
      UPDATE admin_orders
      SET
        paid_notification_sent_at = NOW(),
        updated_at = NOW()
      WHERE organization_id = ${orgId} AND id = ${orderId}
    `;
  }
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
    if (
      event.type === "invoice.finalized" ||
      event.type === "invoice.sent" ||
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed" ||
      event.type === "invoice.voided" ||
      event.type === "invoice.finalization_failed"
    ) {
      await syncInvoiceFromStripeEvent(env.DEFAULT_ORGANIZATION_ID, event);
    }

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
