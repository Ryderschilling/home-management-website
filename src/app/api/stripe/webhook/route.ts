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

async function upsertClientAndOrderFromSession(session: Stripe.Checkout.Session) {
  await ensureAdminTables();

  const orgId = env.DEFAULT_ORGANIZATION_ID;

  const rockColor = safe(session.metadata?.rock_color || session.metadata?.color || "unknown");
  const productKey = safe(session.metadata?.product_key || "artificial_rock_installation");

  const email = safe(session.customer_details?.email).toLowerCase();
  const phone = safe(session.customer_details?.phone);

  // prefer shipping if present, else customer_details.address
  const shippingAddr = addressToString((session as any).shipping_details?.address);
  const billingAddr = addressToString(session.customer_details?.address);
  const serviceAddress = safe(shippingAddr || billingAddr);

  const fullName = safe(session.customer_details?.name) || safe(session.metadata?.customer_name);

  const stripeSessionId = safe(session.id);
  const stripeCustomerId = (session.customer as string | null) ?? null;
  const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;

  const totalCents = typeof session.amount_total === "number" ? session.amount_total : 0;

  // If Stripe didn’t collect email (shouldn’t happen if you set it), bail safely.
  if (!email) {
    // Still store order by session id so you don’t lose it.
    // But cannot build an email list without an email.
  }

  // ✅ Upsert client by email (best identifier)
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
    SELECT id
    FROM admin_orders
    WHERE organization_id = ${orgId} AND stripe_session_id = ${stripeSessionId}
    LIMIT 1
  `;

  const baseOrderFields = {
    status: "PAID",
    fulfillment_status: "NEW", // NEW -> ORDERED -> INSTALLED -> THANKED (later)
  };

  if (existingOrder.length === 0) {
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
        ${crypto.randomUUID()},
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
    // no attachment here — reuse function with empty attachment
    // (if you want a cleaner email function split later, we can do that)
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
    // Only handle the event you care about right now
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only act if payment actually succeeded
      // (Stripe usually sends completed for successful payments, but safe guard)
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