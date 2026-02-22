import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalBoolean, asOptionalString, asPositiveInt } from "@/lib/server/validation";

export async function listServices(organizationId: string) {
  await ensureAdminTables();
  return sql`SELECT id, organization_id, name, description, unit_price_cents, active, created_at, updated_at FROM admin_services WHERE organization_id = ${organizationId} ORDER BY created_at DESC`;
}

export async function createService(organizationId: string, body: Record<string, unknown>) {
  await ensureAdminTables();
  const id = crypto.randomUUID();
  const name = asNonEmptyString(body.name, "name");
  const description = asOptionalString(body.description);
  const unitPriceCents = asPositiveInt(body.unitPriceCents, "unitPriceCents");
  const active = asOptionalBoolean(body.active, true);

  const rows = await sql`INSERT INTO admin_services (id, organization_id, name, description, unit_price_cents, active) VALUES (${id}, ${organizationId}, ${name}, ${description}, ${unitPriceCents}, ${active}) RETURNING id, organization_id, name, description, unit_price_cents, active, created_at, updated_at`;
  return rows[0];
}

export async function updateService(organizationId: string, id: string, body: Record<string, unknown>) {
  await ensureAdminTables();
  const existing = await sql`SELECT * FROM admin_services WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1`;
  if (existing.length === 0) return null;
  const current = existing[0];

  const name = body.name !== undefined ? asNonEmptyString(body.name, "name") : current.name;
  const description = body.description !== undefined ? asOptionalString(body.description) : current.description;
  const unitPriceCents = body.unitPriceCents !== undefined ? asPositiveInt(body.unitPriceCents, "unitPriceCents") : current.unit_price_cents;
  const active = body.active !== undefined ? asOptionalBoolean(body.active, true) : current.active;

  const updated = await sql`UPDATE admin_services SET name = ${name}, description = ${description}, unit_price_cents = ${unitPriceCents}, active = ${active}, updated_at = NOW() WHERE id = ${id} AND organization_id = ${organizationId} RETURNING id, organization_id, name, description, unit_price_cents, active, created_at, updated_at`;
  return updated[0] ?? null;
}

export async function deleteService(organizationId: string, id: string) {
  await ensureAdminTables();
  const deleted = await sql`DELETE FROM admin_services WHERE id = ${id} AND organization_id = ${organizationId}`;
  return deleted.count > 0;
}
