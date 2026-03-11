import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/server/stripe";
import { sendPipePhotoEmail } from "@/lib/server/email";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";

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

export async function POST(req: NextRequest) {
  try {
    await ensureAdminTables();

    const form = await req.formData();

    const sessionId = safe(form.get("sessionId"));
    const notes = safe(form.get("notes"));

    const fullName = safe(form.get("fullName"));
    const emailRaw = safe(form.get("email"));
    const phoneRaw = safe(form.get("phone"));

    const serviceAddressRaw = safe(form.get("serviceAddress"));

    const address1 = safe(form.get("address1"));
    const address2 = safe(form.get("address2"));
    const city = safe(form.get("city"));
    const stateRegion = safe(form.get("state"));
    const postalCode = safe(form.get("postalCode"));

    const file = form.get("photo");

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing sessionId" } },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing photo" } },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing full name" } },
        { status: 400 }
      );
    }

    if (!emailRaw) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing email" } },
        { status: 400 }
      );
    }

    if (!phoneRaw) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing phone" } },
        { status: 400 }
      );
    }

    const hasStructured =
      Boolean(address1) && Boolean(city) && Boolean(stateRegion) && Boolean(postalCode);

    if (!hasStructured && !serviceAddressRaw) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing service address" } },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: { message: "Photo must be an image" } },
        { status: 400 }
      );
    }

    const maxBytes = 7 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { ok: false, error: { message: "Photo too large (max 7MB)" } },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { ok: false, error: { message: "Payment not verified" } },
        { status: 403 }
      );
    }

    const orgId = env.DEFAULT_ORGANIZATION_ID;

    const rockColor = safe(session.metadata?.rock_color || session.metadata?.color || "unknown");
    const productKey = safe(session.metadata?.product_key || "artificial_rock_installation");

    const tosVersion = safe(session.metadata?.tos_version);
    const tosUrl = safe(session.metadata?.tos_url);
    const tosAcceptedAt = safe(session.metadata?.tos_accepted_at);
    const tosIp = safe(session.metadata?.tos_ip);
    const tosUserAgent = safe(session.metadata?.tos_user_agent);

    const stripeEmail = session.customer_details?.email ?? "";
    const stripePhone = session.customer_details?.phone ?? "";
    const stripeAddr = addressToString(session.customer_details?.address);
    const shipAddr = addressToString((session as any).shipping_details?.address);

    const email = (emailRaw || stripeEmail).trim().toLowerCase();
    const phone = (phoneRaw || stripePhone).trim();

    const serviceAddressFromParts = [address1, address2, city, stateRegion, postalCode]
      .filter(Boolean)
      .join(", ");

    const serviceAddress = (
      serviceAddressFromParts ||
      serviceAddressRaw ||
      shipAddr ||
      stripeAddr
    ).trim();

    const stripeCustomerId = (session.customer as string | null) ?? null;
    const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;

    const totalCents = typeof session.amount_total === "number" ? session.amount_total : 0;

    const existingClient = await sql`
      SELECT id, name, email, phone, address_text, stripe_customer_id
      FROM admin_clients
      WHERE organization_id = ${orgId} AND email = ${email}
      LIMIT 1
    `;

    let clientId: string;

    if (existingClient.length === 0) {
      clientId = crypto.randomUUID();
      await sql`
        INSERT INTO admin_clients (
          id, organization_id, name, email, phone, notes, address_text, stripe_customer_id
        )
        VALUES (
          ${clientId},
          ${orgId},
          ${fullName},
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

    const existingOrder = await sql`
      SELECT id
      FROM admin_orders
      WHERE organization_id = ${orgId} AND stripe_session_id = ${sessionId}
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
          notes,
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
          service_address
        )
        VALUES (
          ${orderId},
          ${orgId},
          ${clientId},
          ${"PAID"},
          ${notes || null},
          ${totalCents},
          ${sessionId},
          ${stripeCustomerId},
          ${stripePaymentIntentId},
          ${"qr"},
          ${productKey},
          ${rockColor},
          ${fullName},
          ${email},
          ${phone},
          ${serviceAddress}
        )
      `;
    } else {
      orderId = existingOrder[0].id;

      await sql`
        UPDATE admin_orders
        SET
          client_id = ${clientId},
          status = ${"PAID"},
          notes = ${notes || null},
          total_amount_cents = ${totalCents},
          stripe_customer_id = ${stripeCustomerId},
          stripe_payment_intent_id = ${stripePaymentIntentId},
          source = ${"qr"},
          product_key = ${productKey},
          rock_color = ${rockColor},
          customer_name = ${fullName},
          customer_email = ${email},
          customer_phone = ${phone},
          service_address = ${serviceAddress},
          updated_at = NOW()
        WHERE organization_id = ${orgId} AND stripe_session_id = ${sessionId}
      `;
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const base64 = buf.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    await sql`
      INSERT INTO admin_order_photos (
        id,
        organization_id,
        order_id,
        url,
        caption
      )
      VALUES (
        ${crypto.randomUUID()},
        ${orgId},
        ${orderId},
        ${dataUrl},
        ${notes || file.name || "Uploaded order photo"}
      )
    `;

    await sendPipePhotoEmail({
      subject: `New Rock Order — ${rockColor.toUpperCase()}`,
      html: `
        <p><strong>Product:</strong> Artificial Rock Installation</p>
        <p><strong>Color:</strong> ${rockColor}</p>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service address:</strong><br/>${serviceAddress
          .replaceAll("\n", "<br/>")
          .replaceAll(", ", "<br/>")}</p>
        <p><strong>Stripe session:</strong> ${sessionId}</p>
        <p><strong>Notes:</strong><br/>${notes ? notes.replaceAll("\n", "<br/>") : "—"}</p>
      `,
      attachmentName: file.name || "rock-photo.jpg",
      attachmentBase64: base64,
    });

    return NextResponse.json({ ok: true, data: { clientId, orderId } });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: e instanceof Error ? e.message : "Upload failed" },
      },
      { status: 500 }
    );
  }
}