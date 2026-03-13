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
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean);
  return parts.join(", ");
}

async function ensureReferralColumns() {
  // Adds columns only if missing (safe to run every webhook)
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_code TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_promotion_code_id TEXT`;
}

function makeReferralCode() {
  // CHM-XXXXXX (A-Z + 0-9) length 6
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // avoids confusing 0/O, 1/I
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CHM-${s}`;
}

async function createOneTime20OffPromotionCode() {
  // Create a fresh "once" coupon per referral code.
  const coupon = await stripe.coupons.create({
    percent_off: 20,
    duration: "once",
    name: "CHM 20% Off (Referral)",
  });

  // Retry a few times in case of a rare code collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeReferralCode();

    try {
      const promo = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: coupon.id }, // ✅ Stripe v20+
        code,
        max_redemptions: 1,
      });

      return { code: promo.code ?? code, promotionCodeId: promo.id };
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();

      // Only retry on actual "code already exists" style errors
      if (msg.includes("already exists") || msg.includes("promotion code already exists")) {
        continue;
      }

      // Anything else is real — throw it
      throw e;
    }
  }

  throw new Error("Failed to create a unique referral code. Try again.");
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

  // ✅ Upsert client by email
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

  // ✅ Upsert order by stripe_session_id
  const existingOrder = await sql`
    SELECT id, referral_code, referral_promotion_code_id
    FROM admin_orders
    WHERE organization_id = ${orgId} AND stripe_session_id = ${stripeSessionId}
    LIMIT 1
  `;

  const baseOrderFields = {
    status: "PAID",
    fulfillment_status: "NEW",
  };

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
        notes
      )
      VALUES (
        ${orderId},
        ${orgId},
        ${clientId},
        ${baseOrderFields.status},
        ${baseOrderFields.fulfillment_status},
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
        ${null}
      )
    `;
  } else {
    orderId = existingOrder[0].id;

    await sql`
      UPDATE admin_orders
      SET
        client_id = COALESCE(${clientId}, client_id),
        status = ${baseOrderFields.status},
        fulfillment_status = COALESCE(fulfillment_status, ${baseOrderFields.fulfillment_status}),
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
        updated_at = NOW()
      WHERE organization_id = ${orgId} AND stripe_session_id = ${stripeSessionId}
    `;
  }

  // ✅ Create referral code ONLY if not already created for this order
  const existingReferral = existingOrder.length ? safe(existingOrder[0].referral_code) : "";
  const existingPromoId = existingOrder.length ? safe(existingOrder[0].referral_promotion_code_id) : "";

  if (!existingReferral || !existingPromoId) {
    const { code, promotionCodeId } = await createOneTime20OffPromotionCode();

    await sql`
      UPDATE admin_orders
      SET
        referral_code = ${code},
        referral_promotion_code_id = ${promotionCodeId},
        updated_at = NOW()
      WHERE organization_id = ${orgId} AND id = ${orderId}
    `;
  }

  // ✅ Email you immediately that a paid order came in
  await sendPipePhotoEmail({
    subject: `NEW PAID ORDER — ${rockColor.toUpperCase()}`,
    html: `
      <p><strong>Status:</strong> PAID (NEW)</p>
      <p><strong>Product:</strong> ${productKey.replaceAll("_", " ")}</p>
      <p><strong>Color:</strong> ${rockColor}</p>
      <p><strong>Name:</strong> ${fullName || "—"}</p>
      <p><strong>Email:</strong> ${email || "—"}</p>
      <p><strong>Phone:</strong> ${phone || "—"}</p>
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
    return NextResponse.json({ ok: false, error: { message: "Missing STRIPE_WEBHOOK_SECRET" } }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: { message: "Missing stripe-signature header" } }, { status: 400 });
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