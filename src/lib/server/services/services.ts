import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

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
      (unit_price_cents - cost_cents) AS gross_profit_cents,
      active,
      created_at,
      updated_at
    FROM admin_services
    WHERE organization_id = ${organizationId}
    ORDER BY created_at DESC
  `;
}

export async function createService(
  organizationId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const name = asNonEmptyString(body.name, "name");
  const description = asOptionalString(body.description);

  const unitPriceCents = Number(body.unitPriceCents);
  if (!Number.isFinite(unitPriceCents) || unitPriceCents <= 0) {
    throw new Error("unitPriceCents must be > 0");
  }

  const costCents =
    body.costCents === undefined || body.costCents === null || body.costCents === ""
      ? 0
      : Number(body.costCents);

  if (!Number.isFinite(costCents) || costCents < 0) {
    throw new Error("costCents must be >= 0");
  }

  const rows = await sql`
    INSERT INTO admin_services (
      id,
      organization_id,
      name,
      description,
      unit_price_cents,
      cost_cents
    )
    VALUES (
      ${id},
      ${organizationId},
      ${name},
      ${description},
      ${Math.round(unitPriceCents)},
      ${Math.round(costCents)}
    )
    RETURNING
      id,
      organization_id,
      name,
      description,
      unit_price_cents,
      cost_cents,
      (unit_price_cents - cost_cents) AS gross_profit_cents,
      active,
      created_at,
      updated_at
  `;

  return rows[0];
}