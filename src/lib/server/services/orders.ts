import { ensureAdminTables, sql } from "@/lib/server/db";
import { asOptionalString, asPositiveInt } from "@/lib/server/validation";

const allowedOrderStatuses = new Set(["PENDING", "CONFIRMED", "COMPLETED", "CANCELED"]);

type ItemInput = {
  serviceId: string;
  quantity: number;
};

function parseItems(value: unknown): ItemInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("items must be a non-empty array");
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`items[${index}] must be an object`);
    }

    const serviceId = (item as Record<string, unknown>).serviceId;
    const quantity = (item as Record<string, unknown>).quantity;

    if (typeof serviceId !== "string" || serviceId.trim() === "") {
      throw new Error(`items[${index}].serviceId must be a non-empty string`);
    }

    return {
      serviceId: serviceId.trim(),
      quantity: asPositiveInt(quantity, `items[${index}].quantity`),
    };
  });
}

export async function listOrders(organizationId: string) {
  await ensureAdminTables();
  const orders = await sql`SELECT id, organization_id, client_id, property_id, status, notes, total_amount_cents, created_at, updated_at FROM admin_orders WHERE organization_id = ${organizationId} ORDER BY created_at DESC`;

  const orderIds = orders.map((row) => row.id);
  const items =
    orderIds.length > 0
      ? await sql`SELECT id, order_id, service_id, quantity, unit_price_cents, created_at FROM admin_order_items WHERE order_id = ANY(${orderIds}) ORDER BY created_at ASC`
      : [];

  const itemsByOrder = new Map<string, unknown[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((order) => ({ ...order, items: itemsByOrder.get(order.id) ?? [] }));
}

export async function createOrder(organizationId: string, body: Record<string, unknown>) {
  await ensureAdminTables();
  const id = crypto.randomUUID();
  const clientId = asOptionalString(body.clientId);
  const propertyId = asOptionalString(body.propertyId);
  const notes = asOptionalString(body.notes);
  const items = parseItems(body.items);

  const created = await sql.begin(async (tx) => {
    const serviceIds = items.map((item) => item.serviceId);
    const services = await tx`SELECT id, unit_price_cents FROM admin_services WHERE organization_id = ${organizationId} AND id = ANY(${serviceIds})`;

    if (services.length !== serviceIds.length) {
      throw new Error("One or more services are invalid for this organization");
    }

    const servicePriceMap = new Map<string, number>();
    services.forEach((row) => servicePriceMap.set(row.id, row.unit_price_cents));

    let totalAmountCents = 0;
    for (const item of items) {
      totalAmountCents += servicePriceMap.get(item.serviceId)! * item.quantity;
    }

    const orderRows = await tx`INSERT INTO admin_orders (id, organization_id, client_id, property_id, status, notes, total_amount_cents) VALUES (${id}, ${organizationId}, ${clientId}, ${propertyId}, ${"PENDING"}, ${notes}, ${totalAmountCents}) RETURNING id, organization_id, client_id, property_id, status, notes, total_amount_cents, created_at, updated_at`;

    for (const item of items) {
      await tx`INSERT INTO admin_order_items (id, order_id, service_id, quantity, unit_price_cents) VALUES (${crypto.randomUUID()}, ${id}, ${item.serviceId}, ${item.quantity}, ${servicePriceMap.get(item.serviceId)!})`;
    }

    const orderItems = await tx`SELECT id, order_id, service_id, quantity, unit_price_cents, created_at FROM admin_order_items WHERE order_id = ${id} ORDER BY created_at ASC`;

    return { ...orderRows[0], items: orderItems };
  });

  return created;
}

export async function updateOrderStatus(organizationId: string, orderId: string, body: Record<string, unknown>) {
  await ensureAdminTables();
  const status = body.status;

  if (typeof status !== "string" || !allowedOrderStatuses.has(status)) {
    throw new Error("status must be one of: PENDING, CONFIRMED, COMPLETED, CANCELED");
  }

  const updated = await sql`UPDATE admin_orders SET status = ${status}, updated_at = NOW() WHERE id = ${orderId} AND organization_id = ${organizationId} RETURNING id, organization_id, client_id, property_id, status, notes, total_amount_cents, created_at, updated_at`;
  return updated[0] ?? null;
}
