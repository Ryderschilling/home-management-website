// src/app/api/qr/prefill/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/server/stripe";
import { ensureAdminTables, ensureQrAddonColumns, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import {
  QR_MAIN_PRODUCT_NAME,
  QR_UPSELL_ADDON_NAME,
  QR_UPSELL_ADDON_PRICE_CENTS,
  parseBooleanFlag,
} from "@/lib/qr-funnel";

export const runtime = "nodejs";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function addressToParts(address: StripeAddressLike | null | undefined) {
  return {
    address1: safe(address?.line1),
    address2: safe(address?.line2),
    city: safe(address?.city),
    state: safe(address?.state),
    postalCode: safe(address?.postal_code),
  };
}

function splitStoredAddress(value: string | null | undefined) {
  const text = safe(value);
  if (!text) {
    return {
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
    };
  }

  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length < 4) {
    return {
      address1: text,
      address2: "",
      city: "",
      state: "",
      postalCode: "",
    };
  }

  const postalCode = parts.pop() ?? "";
  const state = parts.pop() ?? "";
  const city = parts.pop() ?? "";
  const address1 = parts.shift() ?? "";
  const address2 = parts.join(", ");

  return {
    address1,
    address2,
    city,
    state,
    postalCode,
  };
}

export async function GET(req: NextRequest) {
  try {
    await ensureAdminTables();
    await ensureQrAddonColumns();

    const sessionId = safe(req.nextUrl.searchParams.get("session_id"));

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing session_id" } },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    let lineItems:
      | Awaited<ReturnType<typeof stripe.checkout.sessions.listLineItems>>
      | null = null;

    try {
      lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
        limit: 10,
      });
    } catch {
      lineItems = null;
    }

    const orderRows = await sql`
      SELECT
        customer_name,
        customer_email,
        customer_phone,
        service_address,
        rock_color,
        product_key,
        addon_product_key,
        addon_product_name,
        addon_price_cents,
        total_amount_cents,
        pipe_height_inches,
        pipe_width_inches,
        electrical_box_width,
        electrical_box_depth,
        electrical_box_height
      FROM admin_orders
      WHERE organization_id = ${env.DEFAULT_ORGANIZATION_ID}
        AND stripe_session_id = ${sessionId}
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    const order = orderRows[0] ?? null;

    const address =
      (session as { shipping_details?: { address?: StripeAddressLike | null } })
        .shipping_details?.address ??
      session.customer_details?.address ??
      null;

    const stripeAddress = addressToParts(address);
    const storedAddress = splitStoredAddress(order?.service_address ?? null);

    const addonSelectedFromSession = parseBooleanFlag(session.metadata?.addon_selected);
    const addonSelected =
      Boolean(order?.addon_product_key || order?.addon_product_name) || addonSelectedFromSession;

    const addonProductName =
      safe(order?.addon_product_name) ||
      safe(session.metadata?.addon_product_name) ||
      (addonSelected ? QR_UPSELL_ADDON_NAME : "");

    const addonPriceFromOrder =
      order?.addon_price_cents === null || order?.addon_price_cents === undefined
        ? null
        : Number(order.addon_price_cents);
    const addonPriceFromMetadata = Number(session.metadata?.addon_price_cents);

    const addonPriceCents =
      addonSelected && Number.isFinite(addonPriceFromOrder) && addonPriceFromOrder !== null
        ? Math.round(addonPriceFromOrder)
        : addonSelected && Number.isFinite(addonPriceFromMetadata) && addonPriceFromMetadata > 0
          ? Math.round(addonPriceFromMetadata)
          : addonSelected
            ? QR_UPSELL_ADDON_PRICE_CENTS
            : 0;

    const addonLineItem = lineItems?.data.find((item) =>
      addonProductName ? item.description === addonProductName : false
    );

    const mainLineItem = lineItems?.data.find((item) =>
      addonLineItem ? item.description !== addonLineItem.description : true
    );

    const totalAmountFromOrder =
      order?.total_amount_cents === null || order?.total_amount_cents === undefined
        ? null
        : Number(order.total_amount_cents);
    const totalAmountCents =
      Number.isFinite(totalAmountFromOrder) && totalAmountFromOrder !== null
        ? Math.round(totalAmountFromOrder)
        : typeof session.amount_total === "number"
          ? session.amount_total
          : 0;

    const productPriceFromLineItem =
      typeof mainLineItem?.amount_total === "number" ? mainLineItem.amount_total : null;

    const productPriceCents =
      productPriceFromLineItem !== null
        ? productPriceFromLineItem
        : addonSelected
          ? Math.max(totalAmountCents - addonPriceCents, 0)
          : totalAmountCents;

    return NextResponse.json({
      ok: true,
      data: {
        fullName: safe(order?.customer_name) || safe(session.customer_details?.name),
        email:
          safe(order?.customer_email).toLowerCase() ||
          safe(session.customer_details?.email).toLowerCase(),
        phone: safe(order?.customer_phone) || safe(session.customer_details?.phone),
        address1: storedAddress.address1 || stripeAddress.address1,
        address2: storedAddress.address2 || stripeAddress.address2,
        city: storedAddress.city || stripeAddress.city,
        state: storedAddress.state || stripeAddress.state,
        postalCode: storedAddress.postalCode || stripeAddress.postalCode,
        rockColor: safe(order?.rock_color) || safe(session.metadata?.rock_color),
        productName:
          mainLineItem?.description ||
          safe(session.metadata?.product_name) ||
          safe(order?.product_key).replaceAll("_", " ") ||
          QR_MAIN_PRODUCT_NAME,
        productPriceCents,
        addonSelected,
        addonProductName: addonProductName || QR_UPSELL_ADDON_NAME,
        addonPriceCents:
          typeof addonLineItem?.amount_total === "number"
            ? addonLineItem.amount_total
            : addonPriceCents,
        totalAmountCents,
        pipeHeight: safe(order?.pipe_height_inches),
        pipeWidth: safe(order?.pipe_width_inches),
        electricalBoxWidth: safe(order?.electrical_box_width),
        electricalBoxDepth: safe(order?.electrical_box_depth),
        electricalBoxHeight: safe(order?.electrical_box_height),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: error instanceof Error ? error.message : "Unable to load prefill" },
      },
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
