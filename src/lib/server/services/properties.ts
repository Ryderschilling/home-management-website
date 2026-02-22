import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

export async function listProperties(organizationId: string) {
  await ensureAdminTables();
  return sql`SELECT id, organization_id, client_id, name, address_line1, city, state, postal_code, notes, created_at, updated_at FROM admin_properties WHERE organization_id = ${organizationId} ORDER BY created_at DESC`;
}

export async function createProperty(organizationId: string, body: Record<string, unknown>) {
  await ensureAdminTables();
  const id = crypto.randomUUID();
  const name = asNonEmptyString(body.name, "name");
  const addressLine1 = asNonEmptyString(body.addressLine1, "addressLine1");
  const clientId = asOptionalString(body.clientId);
  const city = asOptionalString(body.city);
  const state = asOptionalString(body.state);
  const postalCode = asOptionalString(body.postalCode);
  const notes = asOptionalString(body.notes);

  const rows = await sql`INSERT INTO admin_properties (id, organization_id, client_id, name, address_line1, city, state, postal_code, notes) VALUES (${id}, ${organizationId}, ${clientId}, ${name}, ${addressLine1}, ${city}, ${state}, ${postalCode}, ${notes}) RETURNING id, organization_id, client_id, name, address_line1, city, state, postal_code, notes, created_at, updated_at`;
  return rows[0];
}

export async function updateProperty(organizationId: string, id: string, body: Record<string, unknown>) {
  await ensureAdminTables();
  const existing = await sql`SELECT * FROM admin_properties WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1`;
  if (existing.length === 0) return null;
  const current = existing[0];

  const name = body.name !== undefined ? asNonEmptyString(body.name, "name") : current.name;
  const addressLine1 = body.addressLine1 !== undefined ? asNonEmptyString(body.addressLine1, "addressLine1") : current.address_line1;
  const clientId = body.clientId !== undefined ? asOptionalString(body.clientId) : current.client_id;
  const city = body.city !== undefined ? asOptionalString(body.city) : current.city;
  const state = body.state !== undefined ? asOptionalString(body.state) : current.state;
  const postalCode = body.postalCode !== undefined ? asOptionalString(body.postalCode) : current.postal_code;
  const notes = body.notes !== undefined ? asOptionalString(body.notes) : current.notes;

  const updated = await sql`UPDATE admin_properties SET client_id = ${clientId}, name = ${name}, address_line1 = ${addressLine1}, city = ${city}, state = ${state}, postal_code = ${postalCode}, notes = ${notes}, updated_at = NOW() WHERE id = ${id} AND organization_id = ${organizationId} RETURNING id, organization_id, client_id, name, address_line1, city, state, postal_code, notes, created_at, updated_at`;
  return updated[0] ?? null;
}

export async function deleteProperty(organizationId: string, id: string) {
  await ensureAdminTables();
  const deleted = await sql`DELETE FROM admin_properties WHERE id = ${id} AND organization_id = ${organizationId}`;
  return deleted.count > 0;
}
