import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/server/stripe";
import { sendPipePhotoEmail } from "@/lib/server/email";
import { ensureAdminTables, ensureQrAddonColumns, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import {
  QR_MAIN_PRODUCT_KEY,
  QR_UPSELL_ADDON_KEY,
  QR_UPSELL_ADDON_NAME,
  QR_UPSELL_ADDON_PRICE_CENTS,
  parseBooleanFlag,
} from "@/lib/qr-funnel";

export const runtime = "nodejs";

function safe(value: unknown) {
  return String(value ?? "").trim();
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

function parseIsoToTimestamptz(value: string): string | null {
  const normalized = safe(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;

  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();

  return null;
}

function isImageFile(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.type.startsWith("image/");
}

function imageDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  try {
    await ensureAdminTables();
    await ensureQrAddonColumns();

    const form = await req.formData();

    const sessionId = safe(form.get("sessionId"));
    const notes = safe(form.get("notes"));

    const fullName = safe(form.get("fullName"));
    const emailRaw = safe(form.get("email"));
    const phoneRaw = safe(form.get("phone"));

    const address1 = safe(form.get("address1"));
    const address2 = safe(form.get("address2"));
    const city = safe(form.get("city"));
    const stateRegion = safe(form.get("state"));
    const postalCode = safe(form.get("postalCode"));

    const pipeHeight = safe(form.get("pipeHeight"));
    const pipeWidth = safe(form.get("pipeWidth"));

    const electricalBoxWidth = safe(form.get("electricalBoxWidth"));
    const electricalBoxDepth = safe(form.get("electricalBoxDepth"));
    const electricalBoxHeight = safe(form.get("electricalBoxHeight"));

    const pipePhoto = form.get("photo");
    const electricalBoxPhoto = form.get("electricalBoxPhoto");

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing sessionId" } },
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

    if (!address1 || !city || !stateRegion || !postalCode) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing service address" } },
        { status: 400 }
      );
    }

    if (!pipeHeight || !pipeWidth) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing pipe height or width" } },
        { status: 400 }
      );
    }

    const maxBytes = 7 * 1024 * 1024;

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return NextResponse.json(
        { ok: false, error: { message: "Invalid or expired sessionId" } },
        { status: 400 }
      );
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { ok: false, error: { message: "Payment not verified" } },
        { status: 403 }
      );
    }

    const addonSelected = parseBooleanFlag(session.metadata?.addon_selected);
    const addonProductKey = addonSelected
      ? safe(session.metadata?.addon_product_key) || QR_UPSELL_ADDON_KEY
      : null;
    const addonProductName = addonSelected
      ? safe(session.metadata?.addon_product_name) || QR_UPSELL_ADDON_NAME
      : null;
    const addonPriceCentsRaw = Number(session.metadata?.addon_price_cents);
    const addonPriceCents = addonSelected
      ? Number.isFinite(addonPriceCentsRaw) && addonPriceCentsRaw > 0
        ? Math.round(addonPriceCentsRaw)
        : QR_UPSELL_ADDON_PRICE_CENTS
      : null;

    const orgId = env.DEFAULT_ORGANIZATION_ID;

    const existingOrder = await sql`
      SELECT
        id,
        electrical_box_photo_url,
        (
          SELECT url
          FROM admin_order_photos op
          WHERE op.organization_id = admin_orders.organization_id
            AND op.order_id = admin_orders.id
          ORDER BY op.uploaded_at DESC
          LIMIT 1
        ) AS pipe_photo_url
      FROM admin_orders
      WHERE organization_id = ${orgId} AND stripe_session_id = ${sessionId}
      LIMIT 1
    `;

    const existingOrderRow = existingOrder[0] ?? null;
    const existingPipePhotoUrl = safe(existingOrderRow?.pipe_photo_url);
    const existingElectricalBoxPhotoUrl = safe(existingOrderRow?.electrical_box_photo_url);

    if (!(pipePhoto instanceof File) && !existingPipePhotoUrl) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing photo" } },
        { status: 400 }
      );
    }

    if (pipePhoto instanceof File) {
      if (!isImageFile(pipePhoto)) {
        return NextResponse.json(
          { ok: false, error: { message: "Photo must be an image" } },
          { status: 400 }
        );
      }

      if (pipePhoto.size > maxBytes) {
        return NextResponse.json(
          { ok: false, error: { message: "Photo too large (max 7MB)" } },
          { status: 400 }
        );
      }
    }

    if (addonSelected) {
      if (!(electricalBoxPhoto instanceof File) && !existingElectricalBoxPhotoUrl) {
        return NextResponse.json(
          { ok: false, error: { message: "Missing electrical box photo" } },
          { status: 400 }
        );
      }

      if (electricalBoxPhoto instanceof File) {
        if (!isImageFile(electricalBoxPhoto)) {
          return NextResponse.json(
            { ok: false, error: { message: "Electrical box photo must be an image" } },
            { status: 400 }
          );
        }

        if (electricalBoxPhoto.size > maxBytes) {
          return NextResponse.json(
            { ok: false, error: { message: "Electrical box photo too large (max 7MB)" } },
            { status: 400 }
          );
        }
      }

      if (!electricalBoxWidth || !electricalBoxDepth || !electricalBoxHeight) {
        return NextResponse.json(
          {
            ok: false,
            error: { message: "Missing electrical box cover measurements" },
          },
          { status: 400 }
        );
      }
    }

    const rockColor = safe(session.metadata?.rock_color || session.metadata?.color || "unknown");
    const productKey = safe(session.metadata?.product_key || QR_MAIN_PRODUCT_KEY);

    const tosVersion = safe(session.metadata?.tos_version);
    const tosUrl = safe(session.metadata?.tos_url);
    const tosAcceptedAtIso = parseIsoToTimestamptz(
      String(session.metadata?.tos_accepted_at ?? "")
    );
    const tosTextHash = safe(session.metadata?.tos_text_hash) || "missing";

    const tosIp = getClientIp(req);
    const tosUserAgent = req.headers.get("user-agent")?.trim() || null;

    const stripeEmail = session.customer_details?.email ?? "";
    const stripePhone = session.customer_details?.phone ?? "";
    const stripeAddr = addressToString(session.customer_details?.address);
    const shipAddr = addressToString((session as any).shipping_details?.address);

    const email = (emailRaw || stripeEmail).trim().toLowerCase();
    const phone = (phoneRaw || stripePhone).trim();

    const serviceAddressFromParts = [address1, address2, city, stateRegion, postalCode]
      .filter(Boolean)
      .join(", ");

    const serviceAddress = (serviceAddressFromParts || shipAddr || stripeAddr).trim();

    const stripeCustomerId = (session.customer as string | null) ?? null;
    const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;
    const totalCents = typeof session.amount_total === "number" ? session.amount_total : 0;

    const campaignId = safe(session.metadata?.campaign_id);
    const campaignCode = safe(session.metadata?.campaign_code);
    const landingPath = safe(session.metadata?.landing_path || "/qr");
    const browserSessionKey = safe(session.metadata?.browser_session_key);

    const existingClient = await sql`
      SELECT id, name, email, phone, address_text, stripe_customer_id
      FROM admin_clients
      WHERE organization_id = ${orgId} AND lower(email) = ${email}
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

    let pipePhotoBase64 = "";
    let pipePhotoUrl = existingPipePhotoUrl || null;

    if (pipePhoto instanceof File) {
      const pipePhotoBuffer = Buffer.from(await pipePhoto.arrayBuffer());
      pipePhotoBase64 = pipePhotoBuffer.toString("base64");
      pipePhotoUrl = imageDataUrl(pipePhotoBuffer, pipePhoto.type);
    }

    let electricalBoxPhotoUrl: string | null = existingElectricalBoxPhotoUrl || null;

    if (addonSelected && electricalBoxPhoto instanceof File) {
      const electricalBoxBuffer = Buffer.from(await electricalBoxPhoto.arrayBuffer());
      electricalBoxPhotoUrl = imageDataUrl(electricalBoxBuffer, electricalBoxPhoto.type);
    }

    const orderId = existingOrderRow?.id ?? crypto.randomUUID();

    if (!existingOrderRow) {
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
          service_address,
          pipe_height_inches,
          pipe_width_inches,
          addon_product_key,
          addon_product_name,
          addon_price_cents,
          electrical_box_photo_url,
          electrical_box_width,
          electrical_box_depth,
          electrical_box_height,
          campaign_id,
          campaign_code,
          landing_path,
          browser_session_key,
          paid_at,
          tos_version,
          tos_url,
          tos_accepted_at,
          tos_ip,
          tos_user_agent,
          tos_text_hash
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
          ${serviceAddress},
          ${pipeHeight},
          ${pipeWidth},
          ${addonProductKey},
          ${addonProductName},
          ${addonPriceCents},
          ${electricalBoxPhotoUrl || null},
          ${addonSelected ? electricalBoxWidth : null},
          ${addonSelected ? electricalBoxDepth : null},
          ${addonSelected ? electricalBoxHeight : null},
          ${campaignId || null},
          ${campaignCode || null},
          ${landingPath || null},
          ${browserSessionKey || null},
          NOW(),
          ${tosVersion || null},
          ${tosUrl || null},
          ${tosAcceptedAtIso},
          ${tosIp},
          ${tosUserAgent},
          ${tosTextHash || null}
        )
      `;
    } else {
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
          pipe_height_inches = ${pipeHeight},
          pipe_width_inches = ${pipeWidth},
          addon_product_key = ${addonProductKey},
          addon_product_name = ${addonProductName},
          addon_price_cents = ${addonPriceCents},
          electrical_box_photo_url = COALESCE(
            ${electricalBoxPhotoUrl},
            electrical_box_photo_url
          ),
          electrical_box_width = ${addonSelected ? electricalBoxWidth : null},
          electrical_box_depth = ${addonSelected ? electricalBoxDepth : null},
          electrical_box_height = ${addonSelected ? electricalBoxHeight : null},
          campaign_id = COALESCE(${campaignId || null}, campaign_id),
          campaign_code = COALESCE(${campaignCode || null}, campaign_code),
          landing_path = COALESCE(${landingPath || null}, landing_path),
          browser_session_key = COALESCE(${browserSessionKey || null}, browser_session_key),
          paid_at = COALESCE(paid_at, NOW()),
          tos_version = ${tosVersion || null},
          tos_url = ${tosUrl || null},
          tos_accepted_at = ${tosAcceptedAtIso},
          tos_ip = ${tosIp},
          tos_user_agent = ${tosUserAgent},
          tos_text_hash = ${tosTextHash || null},
          updated_at = NOW()
        WHERE organization_id = ${orgId} AND stripe_session_id = ${sessionId}
      `;
    }

    const existingPhotos = await sql`
      SELECT COUNT(*)::int AS photo_count
      FROM admin_order_photos
      WHERE organization_id = ${orgId}
        AND order_id = ${orderId}
    `;

    const alreadySubmitted = Number(existingPhotos[0]?.photo_count ?? 0) > 0;

    if (alreadySubmitted) {
      return NextResponse.json({
        ok: true,
        data: {
          clientId,
          orderId,
          alreadySubmitted: true,
        },
      });
    }

    if (pipePhotoUrl && pipePhoto instanceof File) {
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
          ${pipePhotoUrl},
          ${"QR upload"}
        )
      `;
    }

    if (pipePhotoBase64) {
      await sendPipePhotoEmail({
        subject: `New Rock Order — ${rockColor.toUpperCase()}`,
        html: `
        <p><strong>Product:</strong> Artificial Rock Installation</p>
        <p><strong>Color:</strong> ${rockColor}</p>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Pipe height:</strong> ${pipeHeight} in</p>
        <p><strong>Pipe width:</strong> ${pipeWidth} in</p>
        ${
          addonSelected
            ? `
        <p><strong>Add-on:</strong> ${addonProductName} ($${((addonPriceCents ?? 0) / 100).toFixed(2)})</p>
        <p><strong>Electrical box width:</strong> ${electricalBoxWidth} in</p>
        <p><strong>Electrical box depth:</strong> ${electricalBoxDepth} in</p>
        <p><strong>Electrical box height:</strong> ${electricalBoxHeight} in</p>
        <p><strong>Electrical box photo received:</strong> Yes</p>
        `
            : ""
        }
        <p><strong>Service address:</strong><br/>${serviceAddress.replaceAll(", ", "<br/>")}</p>
        <p><strong>Stripe session:</strong> ${sessionId}</p>
        <p><strong>Order id:</strong> ${orderId}</p>
        <p><strong>Notes:</strong><br/>${notes ? notes.replaceAll("\n", "<br/>") : "—"}</p>
        <hr/>
        <p><strong>TOS accepted:</strong> ${tosAcceptedAtIso || "—"}</p>
        <p><strong>TOS version:</strong> ${tosVersion || "—"}</p>
        <p><strong>TOS url:</strong> ${tosUrl || "—"}</p>
        <p><strong>TOS ip:</strong> ${tosIp || "—"}</p>
        <p><strong>TOS user-agent:</strong> ${tosUserAgent || "—"}</p>
      `,
        attachmentName:
          pipePhoto instanceof File ? pipePhoto.name || "rock-photo.jpg" : "rock-photo.jpg",
        attachmentBase64: pipePhotoBase64,
      });
    }

    await sql`
      UPDATE admin_orders
      SET
        upload_completed_at = NOW(),
        updated_at = NOW()
      WHERE organization_id = ${orgId}
        AND id = ${orderId}
    `;

    const campaignRows = await sql`
      SELECT campaign_id, campaign_code, browser_session_key, landing_path
      FROM admin_orders
      WHERE organization_id = ${orgId}
        AND id = ${orderId}
      LIMIT 1
    `;

    const alreadyHasUploadEvent = await sql`
      SELECT id
      FROM marketing_campaign_events
      WHERE organization_id = ${orgId}
        AND order_id = ${orderId}
        AND event_type = ${"upload_completed"}
      LIMIT 1
    `;

    const campaignOrder = campaignRows[0];

    if (
      (campaignOrder?.campaign_id || campaignOrder?.campaign_code) &&
      !alreadyHasUploadEvent[0]
    ) {
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
          ${campaignOrder.campaign_id || null},
          ${campaignOrder.campaign_code || null},
          ${campaignOrder.browser_session_key || null},
          ${"upload_completed"},
          ${campaignOrder.landing_path || "/qr"},
          ${orderId},
          ${JSON.stringify({
            fullName,
            email,
            addonSelected,
            addonProductName,
          })}
        )
      `;
    }

    return NextResponse.json({
      ok: true,
      data: {
        clientId,
        orderId,
        alreadySubmitted: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Upload failed" } },
      { status: 500 }
    );
  }
}
