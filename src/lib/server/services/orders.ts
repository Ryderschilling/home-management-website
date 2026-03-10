// src/lib/server/services/orders.ts
import { ensureAdminTables, sql } from "@/lib/server/db";

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

      -- QR/Stripe fields
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

      -- fulfillment
      o.fulfillment_status,
      o.ordered_at,
      o.installed_at,
      o.thank_you_sent_at,

      -- joined client fields
      c.name as client_name,
      c.email as client_email,
      c.phone as client_phone,
      c.address_text as client_address
    FROM admin_orders o
    LEFT JOIN admin_clients c
      ON c.id = o.client_id
      AND c.organization_id = o.organization_id
    WHERE o.organization_id = ${organizationId}
    ORDER BY o.created_at DESC
  `;
}

export async function getOrderById(organizationId: string, orderId: string) {
  await ensureAdminTables();

  const rows = await sql`
    SELECT *
    FROM admin_orders
    WHERE organization_id = ${organizationId} AND id = ${orderId}
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

type FulfillmentUpdate = {
  fulfillmentStatus?: "NEW" | "ORDERED" | "INSTALLED" | "CANCELED";
  thankYouSent?: boolean;
};

export async function updateOrderFulfillment(
  organizationId: string,
  orderId: string,
  update: FulfillmentUpdate
) {
  await ensureAdminTables();

  // Fetch current state (for timestamps)
  const existing = await sql`
    SELECT id, fulfillment_status, ordered_at, installed_at, thank_you_sent_at
    FROM admin_orders
    WHERE organization_id = ${organizationId} AND id = ${orderId}
    LIMIT 1
  `;

  const row = existing[0];
  if (!row) return null;

  const nextStatus = update.fulfillmentStatus ?? (row.fulfillment_status as string);

  const orderedAt =
    nextStatus === "ORDERED" && !row.ordered_at ? new Date().toISOString() : row.ordered_at;

  const installedAt =
    nextStatus === "INSTALLED" && !row.installed_at ? new Date().toISOString() : row.installed_at;

  const thankYouSentAt =
    update.thankYouSent && !row.thank_you_sent_at ? new Date().toISOString() : row.thank_you_sent_at;

  const updated = await sql`
    UPDATE admin_orders
    SET
      fulfillment_status = ${nextStatus},
      ordered_at = ${orderedAt},
      installed_at = ${installedAt},
      thank_you_sent_at = ${thankYouSentAt},
      updated_at = NOW()
    WHERE organization_id = ${organizationId} AND id = ${orderId}
    RETURNING *
  `;

  return updated[0] ?? null;
}