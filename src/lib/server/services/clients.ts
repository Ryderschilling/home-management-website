import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

export async function listClients(organizationId: string) {
  await ensureAdminTables();

  return sql`
    SELECT
      c.id,
      c.organization_id,
      c.name,
      c.email,
      c.phone,
      c.notes,
      c.created_at,
      c.updated_at,
      COUNT(p.id)::int AS property_count
    FROM admin_clients c
    LEFT JOIN admin_properties p
      ON p.client_id = c.id
      AND p.organization_id = c.organization_id
    WHERE c.organization_id = ${organizationId}
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
}

export async function getClientById(organizationId: string, id: string) {
  await ensureAdminTables();

  const rows = await sql`
    SELECT id, organization_id, name, email, phone, notes, created_at, updated_at
    FROM admin_clients
    WHERE id = ${id} AND organization_id = ${organizationId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createClient(organizationId: string, body: Record<string, unknown>) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const name = asNonEmptyString(body.name, "name");
  const email = asOptionalString(body.email);
  const phone = asOptionalString(body.phone);
  const notes = asOptionalString(body.notes);

  const rows = await sql`
    INSERT INTO admin_clients (id, organization_id, name, email, phone, notes)
    VALUES (${id}, ${organizationId}, ${name}, ${email}, ${phone}, ${notes})
    RETURNING id, organization_id, name, email, phone, notes, created_at, updated_at
  `;

  return rows[0];
}

export async function updateClient(
  organizationId: string,
  id: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existing = await sql`
    SELECT *
    FROM admin_clients
    WHERE id = ${id} AND organization_id = ${organizationId}
    LIMIT 1
  `;

  if (existing.length === 0) return null;

  const current = existing[0];
  const name = body.name !== undefined ? asNonEmptyString(body.name, "name") : current.name;
  const email = body.email !== undefined ? asOptionalString(body.email) : current.email;
  const phone = body.phone !== undefined ? asOptionalString(body.phone) : current.phone;
  const notes = body.notes !== undefined ? asOptionalString(body.notes) : current.notes;

  const updated = await sql`
    UPDATE admin_clients
    SET
      name = ${name},
      email = ${email},
      phone = ${phone},
      notes = ${notes},
      updated_at = NOW()
    WHERE id = ${id} AND organization_id = ${organizationId}
    RETURNING id, organization_id, name, email, phone, notes, created_at, updated_at
  `;

  return updated[0] ?? null;
}

export async function deleteClient(organizationId: string, id: string) {
  await ensureAdminTables();
  const deleted = await sql`
    DELETE FROM admin_clients
    WHERE id = ${id} AND organization_id = ${organizationId}
  `;
  return deleted.count > 0;
}