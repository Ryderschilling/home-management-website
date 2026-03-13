// src/lib/server/services/orders.ts
import { ensureAdminTables, sql } from "@/lib/server/db";
import { sendThankYouEmail } from "@/lib/server/email-thankyou";

export type FulfillmentStatus = "NEW" | "ORDERED" | "INSTALLED" | "CANCELED";

function normalizeFulfillment(v: unknown): FulfillmentStatus | null {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return null;
  if (s === "NEW" || s === "ORDERED" || s === "INSTALLED" || s === "CANCELED") return s;
  return null;
}

export async function listOrders(organizationId: string) {
  await ensureAdminTables();

  return sql`
    SELECT
      o.id,
      o.organization_id,
      o.client_id,
      o.property_id,
      o.status,
      o.notes,
      o.total_amount_cents,
      o.created_at,
      o.updated_at,

      o.stripe_session_id,
      o.stripe_customer_id,
      o.stripe_payment_intent_id,
      o.source,
      o.product_key,
      o.rock_color,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.service_address,

      o.fulfillment_status,
      o.ordered_at,
      o.installed_at,
      o.thank_you_sent_at,

      o.tos_version,
      o.tos_url,
      o.tos_text_hash,
      o.tos_accepted_at,
      o.tos_ip,
      o.tos_user_agent,

      c.name as client_name,
      c.email as client_email,
      c.phone as client_phone,
      c.address_text as client_address,

      COALESCE(p.photos, 0) as photo_count,
      p.latest_url as latest_photo_url

    FROM admin_orders o
    LEFT JOIN admin_clients c
      ON c.id = o.client_id
      AND c.organization_id = o.organization_id

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS photos,
        MAX(uploaded_at) AS latest_uploaded_at,
        (
          SELECT url
          FROM admin_order_photos op2
          WHERE op2.organization_id = o.organization_id
            AND op2.order_id = o.id
          ORDER BY op2.uploaded_at DESC
          LIMIT 1
        ) AS latest_url
      FROM admin_order_photos op
      WHERE op.organization_id = o.organization_id
        AND op.order_id = o.id
    ) p ON true

    WHERE o.organization_id = ${organizationId}
    ORDER BY o.created_at DESC
  `;
}

export async function getOrderById(organizationId: string, orderId: string) {
  await ensureAdminTables();

  const rows = await sql`
    SELECT
      o.*,

      -- order photos (from admin_order_photos)
      COALESCE(p.photo_count, 0) as photo_count,
      p.latest_photo_url as latest_photo_url,

      c.name as client_name,
      c.email as client_email,
      c.phone as client_phone,
      c.address_text as client_address
    FROM admin_orders o
    LEFT JOIN admin_clients c
      ON c.id = o.client_id
      AND c.organization_id = o.organization_id
    LEFT JOIN (
      SELECT
        organization_id,
        order_id,
        COUNT(*)::int AS photo_count,
        (ARRAY_AGG(url ORDER BY uploaded_at DESC))[1] AS latest_photo_url
      FROM admin_order_photos
      WHERE organization_id = ${organizationId}
      GROUP BY organization_id, order_id
    ) p
      ON p.organization_id = o.organization_id
      AND p.order_id = o.id
    WHERE o.organization_id = ${organizationId}
      AND o.id = ${orderId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createOrder(organizationId: string, body: Record<string, unknown>) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const status =
    typeof body.status === "string" && body.status.trim() ? body.status.trim() : "OPEN";

  const total =
    body.totalAmountCents === undefined || body.totalAmountCents === null
      ? 0
      : Number(body.totalAmountCents);

  const notes = typeof body.notes === "string" ? body.notes : null;

  const rows = await sql`
    INSERT INTO admin_orders (id, organization_id, status, total_amount_cents, notes)
    VALUES (${id}, ${organizationId}, ${status}, ${Number.isFinite(total) ? total : 0}, ${notes})
    RETURNING *
  `;

  return rows[0];
}

export async function updateOrder(
  organizationId: string,
  orderId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existing = await getOrderById(organizationId, orderId);
  if (!existing) return null;

  const nextFulfillment = normalizeFulfillment(body.fulfillment_status);

  let fulfillmentStatus: FulfillmentStatus =
    (existing.fulfillment_status as FulfillmentStatus) || "NEW";
  if (nextFulfillment) fulfillmentStatus = nextFulfillment;

  const nowIso = new Date().toISOString();

  const orderedAt =
    fulfillmentStatus === "ORDERED"
      ? (existing.ordered_at ?? nowIso)
      : existing.ordered_at ?? null;

  const installedAt =
    fulfillmentStatus === "INSTALLED"
      ? (existing.installed_at ?? nowIso)
      : existing.installed_at ?? null;

  const rows = await sql`
    UPDATE admin_orders
    SET
      fulfillment_status = ${fulfillmentStatus},
      ordered_at = ${orderedAt},
      installed_at = ${installedAt},
      updated_at = NOW()
    WHERE organization_id = ${organizationId} AND id = ${orderId}
    RETURNING *
  `;

  return rows[0] ?? null;
}

export async function deleteOrder(organizationId: string, orderId: string) {
  await ensureAdminTables();

  const deleted = await sql`
    DELETE FROM admin_orders
    WHERE organization_id = ${organizationId} AND id = ${orderId}
  `;

  return deleted.count > 0;
}

export async function sendThankYouEmailAndMarkSent(organizationId: string, orderId: string) {
  await ensureAdminTables();

  const order = await getOrderById(organizationId, orderId);
  if (!order) return null;

  const to = (order.customer_email || order.client_email || "").toString().trim();
  const name = (order.customer_name || order.client_name || "there").toString().trim();

  if (!to) throw new Error("Order has no customer email to send thank-you.");

  if (order.thank_you_sent_at) {
    return { ok: true, alreadySent: true };
  }

  const productLabel =
    order.product_key ? String(order.product_key).replaceAll("_", " ") : "artificial rock installation";

  await sendThankYouEmail({
    to,
    customerName: name,
    productLabel,
  });

  await sql`
    UPDATE admin_orders
    SET thank_you_sent_at = NOW(), updated_at = NOW()
    WHERE organization_id = ${organizationId} AND id = ${orderId}
  `;

  return { ok: true, alreadySent: false };
}