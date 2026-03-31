import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

function mapPropertyInput(body: Record<string, unknown>, current?: Record<string, unknown>) {
  const entry =
    body.entry !== undefined
      ? asOptionalString(body.entry)
      : ((current?.entry as string | null | undefined) ??
          (current?.gate_code as string | null | undefined) ??
          (current?.door_code as string | null | undefined) ??
          (current?.garage_code as string | null | undefined) ??
          (current?.alarm_code as string | null | undefined) ??
          null);

  return {
    name:
      body.name !== undefined
        ? asNonEmptyString(body.name, "name")
        : String(current?.name ?? ""),
    addressLine1:
      body.addressLine1 !== undefined
        ? asNonEmptyString(body.addressLine1, "addressLine1")
        : String(current?.address_line1 ?? ""),
    clientId:
      body.clientId !== undefined
        ? asOptionalString(body.clientId)
        : (current?.client_id as string | null | undefined) ?? null,
    city:
      body.city !== undefined
        ? asOptionalString(body.city)
        : (current?.city as string | null | undefined) ?? null,
    state:
      body.state !== undefined
        ? asOptionalString(body.state)
        : (current?.state as string | null | undefined) ?? null,
    postalCode:
      body.postalCode !== undefined
        ? asOptionalString(body.postalCode)
        : (current?.postal_code as string | null | undefined) ?? null,
    entry,
    irrigationNotes:
      body.irrigationNotes !== undefined
        ? asOptionalString(body.irrigationNotes)
        : (current?.irrigation_notes as string | null | undefined) ?? null,
    accessNotes:
      body.accessNotes !== undefined
        ? asOptionalString(body.accessNotes)
        : (current?.access_notes as string | null | undefined) ?? null,
    notes:
      body.notes !== undefined
        ? asOptionalString(body.notes)
        : (current?.notes as string | null | undefined) ?? null,
  };
}

async function fetchPropertyRecord(organizationId: string, propertyId: string) {
  const rows = await sql`
    SELECT
      p.id,
      p.organization_id,
      p.client_id,
      p.name,
      p.address_line1,
      p.city,
      p.state,
      p.postal_code,
      COALESCE(p.entry, p.gate_code, p.door_code, p.garage_code, p.alarm_code) AS entry,
      p.irrigation_notes,
      p.access_notes,
      p.notes,
      p.created_at,
      p.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      COALESCE(summary.active_plan_count, 0) AS active_plan_count,
      COALESCE(summary.recent_job_count, 0) AS recent_job_count,
      summary.next_job_at,
      summary.last_job_at
    FROM admin_properties p
    LEFT JOIN admin_clients c
      ON c.id = p.client_id
      AND c.organization_id = p.organization_id
    LEFT JOIN LATERAL (
      SELECT
        (
          SELECT COUNT(*)::int
          FROM admin_retainers r
          WHERE r.organization_id = p.organization_id
            AND r.property_id = p.id
            AND UPPER(r.status) = 'ACTIVE'
            AND r.archived_at IS NULL
        ) AS active_plan_count,
        (
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = p.organization_id
            AND j.property_id = p.id
            AND COALESCE(j.completed_at, j.scheduled_for) >= NOW() - INTERVAL '30 days'
        ) AS recent_job_count,
        (
          SELECT MIN(j.scheduled_for)
          FROM admin_jobs j
          WHERE j.organization_id = p.organization_id
            AND j.property_id = p.id
            AND j.scheduled_for >= NOW()
            AND UPPER(j.status) <> 'CANCELED'
        ) AS next_job_at,
        (
          SELECT MAX(COALESCE(j.completed_at, j.scheduled_for))
          FROM admin_jobs j
          WHERE j.organization_id = p.organization_id
            AND j.property_id = p.id
        ) AS last_job_at
    ) AS summary ON true
    WHERE p.id = ${propertyId}
      AND p.organization_id = ${organizationId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listProperties(organizationId: string) {
  await ensureAdminTables();

  return sql`
    SELECT
      p.id,
      p.organization_id,
      p.client_id,
      p.name,
      p.address_line1,
      p.city,
      p.state,
      p.postal_code,
      COALESCE(p.entry, p.gate_code, p.door_code, p.garage_code, p.alarm_code) AS entry,
      p.irrigation_notes,
      p.access_notes,
      p.notes,
      p.created_at,
      p.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      COALESCE(summary.active_plan_count, 0) AS active_plan_count,
      COALESCE(summary.recent_job_count, 0) AS recent_job_count,
      summary.next_job_at,
      summary.last_job_at
    FROM admin_properties p
    LEFT JOIN admin_clients c
      ON c.id = p.client_id
      AND c.organization_id = p.organization_id
    LEFT JOIN LATERAL (
      SELECT
        (
          SELECT COUNT(*)::int
          FROM admin_retainers r
          WHERE r.organization_id = p.organization_id
            AND r.property_id = p.id
            AND UPPER(r.status) = 'ACTIVE'
            AND r.archived_at IS NULL
        ) AS active_plan_count,
        (
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = p.organization_id
            AND j.property_id = p.id
            AND COALESCE(j.completed_at, j.scheduled_for) >= NOW() - INTERVAL '30 days'
        ) AS recent_job_count,
        (
          SELECT MIN(j.scheduled_for)
          FROM admin_jobs j
          WHERE j.organization_id = p.organization_id
            AND j.property_id = p.id
            AND j.scheduled_for >= NOW()
            AND UPPER(j.status) <> 'CANCELED'
        ) AS next_job_at,
        (
          SELECT MAX(COALESCE(j.completed_at, j.scheduled_for))
          FROM admin_jobs j
          WHERE j.organization_id = p.organization_id
            AND j.property_id = p.id
        ) AS last_job_at
    ) AS summary ON true
    WHERE p.organization_id = ${organizationId}
    ORDER BY p.created_at DESC
  `;
}

export async function listPropertiesByClient(organizationId: string, clientId: string) {
  await ensureAdminTables();

  return sql`
    SELECT
      p.id,
      p.organization_id,
      p.client_id,
      p.name,
      p.address_line1,
      p.city,
      p.state,
      p.postal_code,
      COALESCE(p.entry, p.gate_code, p.door_code, p.garage_code, p.alarm_code) AS entry,
      p.irrigation_notes,
      p.access_notes,
      p.notes,
      p.created_at,
      p.updated_at,
      COALESCE(summary.active_plan_count, 0) AS active_plan_count,
      COALESCE(summary.recent_job_count, 0) AS recent_job_count,
      summary.next_job_at,
      summary.last_job_at
    FROM admin_properties p
    LEFT JOIN LATERAL (
      SELECT
        (
          SELECT COUNT(*)::int
          FROM admin_retainers r
          WHERE r.organization_id = p.organization_id
            AND r.property_id = p.id
            AND UPPER(r.status) = 'ACTIVE'
            AND r.archived_at IS NULL
        ) AS active_plan_count,
        (
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = p.organization_id
            AND j.property_id = p.id
            AND COALESCE(j.completed_at, j.scheduled_for) >= NOW() - INTERVAL '30 days'
        ) AS recent_job_count,
        (
          SELECT MIN(j.scheduled_for)
          FROM admin_jobs j
          WHERE j.organization_id = p.organization_id
            AND j.property_id = p.id
            AND j.scheduled_for >= NOW()
            AND UPPER(j.status) <> 'CANCELED'
        ) AS next_job_at,
        (
          SELECT MAX(COALESCE(j.completed_at, j.scheduled_for))
          FROM admin_jobs j
          WHERE j.organization_id = p.organization_id
            AND j.property_id = p.id
        ) AS last_job_at
    ) AS summary ON true
    WHERE p.organization_id = ${organizationId} AND p.client_id = ${clientId}
    ORDER BY p.created_at ASC
  `;
}

export async function getPropertyById(organizationId: string, id: string) {
  await ensureAdminTables();
  return fetchPropertyRecord(organizationId, id);
}

export async function createProperty(organizationId: string, body: Record<string, unknown>) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const data = mapPropertyInput(body);

  await sql`
    INSERT INTO admin_properties (
      id,
      organization_id,
      client_id,
      name,
      address_line1,
      city,
      state,
      postal_code,
      entry,
      irrigation_notes,
      access_notes,
      notes
    )
    VALUES (
      ${id},
      ${organizationId},
      ${data.clientId},
      ${data.name},
      ${data.addressLine1},
      ${data.city},
      ${data.state},
      ${data.postalCode},
      ${data.entry},
      ${data.irrigationNotes},
      ${data.accessNotes},
      ${data.notes}
    )
  `;

  return fetchPropertyRecord(organizationId, id);
}

export async function updateProperty(
  organizationId: string,
  id: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existing = await sql`
    SELECT *
    FROM admin_properties
    WHERE id = ${id} AND organization_id = ${organizationId}
    LIMIT 1
  `;

  if (existing.length === 0) return null;

  const current = existing[0];
  const data = mapPropertyInput(body, current);

  await sql`
    UPDATE admin_properties
    SET
      client_id = ${data.clientId},
      name = ${data.name},
      address_line1 = ${data.addressLine1},
      city = ${data.city},
      state = ${data.state},
      postal_code = ${data.postalCode},
      entry = ${data.entry},
      irrigation_notes = ${data.irrigationNotes},
      access_notes = ${data.accessNotes},
      notes = ${data.notes},
      updated_at = NOW()
    WHERE id = ${id} AND organization_id = ${organizationId}
  `;

  return fetchPropertyRecord(organizationId, id);
}

export async function deleteProperty(organizationId: string, id: string) {
  await ensureAdminTables();
  const deleted = await sql`
    DELETE FROM admin_properties
    WHERE id = ${id} AND organization_id = ${organizationId}
  `;
  return deleted.count > 0;
}
