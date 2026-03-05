import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

function asCents(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${field} must be a number >= 0`);
  return Math.round(n);
}

function asBool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${field} must be true or false`);
  return value;
}

export async function listServices(organizationId: string) {
  await ensureAdminTables();

  return sql`
    SELECT
      id,
      organization_id,
      name,
      description,
      unit_price_cents,
      cost_cents,
      active,
      created_at,
      updated_at
    FROM admin_services
    WHERE organization_id = ${organizationId}
    ORDER BY created_at DESC
  `;
}

export async function getServiceById(organizationId: string, id: string) {
  await ensureAdminTables();

  const rows = await sql`
    SELECT
      id,
      organization_id,
      name,
      description,
      unit_price_cents,
      cost_cents,
      active,
      created_at,
      updated_at
    FROM admin_services
    WHERE id = ${id} AND organization_id = ${organizationId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createService(organizationId: string, body: Record<string, unknown>) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const name = asNonEmptyString(body.name, "name");
  const description = asOptionalString(body.description);

  const unitPriceCents =
    body.unitPriceCents === undefined || body.unitPriceCents === null || body.unitPriceCents === ""
      ? 0
      : asCents(body.unitPriceCents, "unitPriceCents");

  const costCents =
    body.costCents === undefined || body.costCents === null || body.costCents === ""
      ? 0
      : asCents(body.costCents, "costCents");

  const active =
    body.active === undefined || body.active === null
      ? true
      : asBool(body.active, "active");

  const rows = await sql`
    INSERT INTO admin_services (
      id,
      organization_id,
      name,
      description,
      unit_price_cents,
      cost_cents,
      active
    )
    VALUES (
      ${id},
      ${organizationId},
      ${name},
      ${description},
      ${unitPriceCents},
      ${costCents},
      ${active}
    )
    RETURNING
      id,
      organization_id,
      name,
      description,
      unit_price_cents,
      cost_cents,
      active,
      created_at,
      updated_at
  `;

  return rows[0];
}

export async function updateService(
  organizationId: string,
  id: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existing = await sql`
    SELECT *
    FROM admin_services
    WHERE id = ${id} AND organization_id = ${organizationId}
    LIMIT 1
  `;
  if (existing.length === 0) return null;

  const current = existing[0];

  const name =
    body.name !== undefined ? asNonEmptyString(body.name, "name") : current.name;

  const description =
    body.description !== undefined ? asOptionalString(body.description) : current.description;

  const unitPriceCents =
    body.unitPriceCents !== undefined
      ? asCents(body.unitPriceCents, "unitPriceCents")
      : current.unit_price_cents;

  const costCents =
    body.costCents !== undefined
      ? asCents(body.costCents, "costCents")
      : current.cost_cents;

  const active =
    body.active !== undefined ? asBool(body.active, "active") : current.active;

  const rows = await sql`
    UPDATE admin_services
    SET
      name = ${name},
      description = ${description},
      unit_price_cents = ${unitPriceCents},
      cost_cents = ${costCents},
      active = ${active},
      updated_at = NOW()
    WHERE id = ${id} AND organization_id = ${organizationId}
    RETURNING
      id,
      organization_id,
      name,
      description,
      unit_price_cents,
      cost_cents,
      active,
      created_at,
      updated_at
  `;

  return rows[0] ?? null;
}

export async function deleteService(organizationId: string, id: string) {
  await ensureAdminTables();

  const deleted = await sql`
    DELETE FROM admin_services
    WHERE id = ${id} AND organization_id = ${organizationId}
  `;
  return deleted.count > 0;
}