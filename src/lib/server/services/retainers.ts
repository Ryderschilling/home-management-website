import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

type RetainerStatus = "ACTIVE" | "PAUSED" | "CANCELED";
type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";

const VALID_FREQUENCIES = new Set<Frequency>(["DAILY", "WEEKLY", "MONTHLY"]);
const VALID_STATUSES = new Set<RetainerStatus>(["ACTIVE", "PAUSED", "CANCELED"]);

function addFrequency(date: Date, frequency: Frequency, interval: number) {
  const next = new Date(date);

  if (frequency === "DAILY") next.setDate(next.getDate() + interval);
  else if (frequency === "WEEKLY") next.setDate(next.getDate() + interval * 7);
  else if (frequency === "MONTHLY") next.setMonth(next.getMonth() + interval);
  else throw new Error("Invalid service frequency");

  return next;
}

function normalizeAnchorDate(value: string | null | undefined) {
  if (!value) return new Date();

  const date = new Date(`${value}T09:00:00`);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

function normalizeFrequency(value: unknown, label: string, fallback?: Frequency) {
  const frequency = String(value ?? fallback ?? "").trim().toUpperCase() as Frequency;
  if (!VALID_FREQUENCIES.has(frequency)) {
    throw new Error(`${label} must be DAILY, WEEKLY, or MONTHLY`);
  }
  return frequency;
}

function normalizeStatus(value: unknown, fallback: RetainerStatus = "ACTIVE") {
  const status = String(value ?? fallback).trim().toUpperCase() as RetainerStatus;
  if (!VALID_STATUSES.has(status)) {
    throw new Error("status must be ACTIVE, PAUSED, or CANCELED");
  }
  return status;
}

function parsePositiveInteger(value: unknown, label: string, fallback = 1) {
  const parsed = Math.max(1, Number(value ?? fallback));
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${label} must be at least 1`);
  }
  return parsed;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatSourceKey(retainerId: string, occurrence: Date) {
  return `plan:${retainerId}:${occurrence.toISOString().slice(0, 16)}`;
}

export type DeleteRetainerResult = {
  deleted: boolean;
  deletedFutureVisitCount: number;
};

async function assertClientExists(organizationId: string, clientId: string) {
  const rows = await sql`
    SELECT id
    FROM admin_clients
    WHERE id = ${clientId} AND organization_id = ${organizationId}
    LIMIT 1
  `;

  if (!rows[0]) throw new Error("Selected client not found");
}

async function assertPropertyExists(
  organizationId: string,
  propertyId: string | null,
  clientId: string
) {
  if (!propertyId) return;

  const rows = await sql`
    SELECT id, client_id
    FROM admin_properties
    WHERE id = ${propertyId} AND organization_id = ${organizationId}
    LIMIT 1
  `;

  const property = rows[0];
  if (!property) throw new Error("Selected property not found");
  if (property.client_id && property.client_id !== clientId) {
    throw new Error("Selected property does not belong to the selected client");
  }
}

async function fetchRetainerRecord(organizationId: string, retainerId: string) {
  const rows = await sql`
    SELECT
      r.id,
      r.organization_id,
      r.client_id,
      r.property_id,
      r.name,
      r.amount_cents,
      r.billing_frequency,
      r.billing_interval,
      r.billing_anchor_date,
      r.service_frequency,
      r.service_interval,
      r.service_anchor_date,
      r.status,
      r.notes,
      r.created_at,
      r.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      COALESCE(job_summary.future_visit_count, 0) AS future_visit_count,
      job_summary.next_visit_at
    FROM admin_retainers r
    LEFT JOIN admin_clients c
      ON c.id = r.client_id
      AND c.organization_id = r.organization_id
    LEFT JOIN admin_properties p
      ON p.id = r.property_id
      AND p.organization_id = r.organization_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS future_visit_count,
        MIN(j.scheduled_for) AS next_visit_at
      FROM admin_jobs j
      WHERE j.organization_id = r.organization_id
        AND j.retainer_id = r.id
        AND j.scheduled_for >= NOW()
        AND UPPER(j.status) <> 'CANCELED'
    ) AS job_summary ON true
    WHERE r.organization_id = ${organizationId} AND r.id = ${retainerId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listRetainers(organizationId: string) {
  await ensureAdminTables();

  return sql`
    SELECT
      r.id,
      r.organization_id,
      r.client_id,
      r.property_id,
      r.name,
      r.amount_cents,
      r.billing_frequency,
      r.billing_interval,
      r.billing_anchor_date,
      r.service_frequency,
      r.service_interval,
      r.service_anchor_date,
      r.status,
      r.notes,
      r.created_at,
      r.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      COALESCE(job_summary.future_visit_count, 0) AS future_visit_count,
      job_summary.next_visit_at
    FROM admin_retainers r
    LEFT JOIN admin_clients c
      ON c.id = r.client_id
      AND c.organization_id = r.organization_id
    LEFT JOIN admin_properties p
      ON p.id = r.property_id
      AND p.organization_id = r.organization_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS future_visit_count,
        MIN(j.scheduled_for) AS next_visit_at
      FROM admin_jobs j
      WHERE j.organization_id = r.organization_id
        AND j.retainer_id = r.id
        AND j.scheduled_for >= NOW()
        AND UPPER(j.status) <> 'CANCELED'
    ) AS job_summary ON true
    WHERE r.organization_id = ${organizationId}
    ORDER BY r.created_at DESC
  `;
}

export async function getRetainerById(organizationId: string, id: string) {
  await ensureAdminTables();
  return fetchRetainerRecord(organizationId, id);
}

export async function createRetainer(
  organizationId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const clientId = asNonEmptyString(body.clientId, "clientId");
  const propertyId = asOptionalString(body.propertyId);
  const name = asNonEmptyString(body.name, "name");
  const notes = asOptionalString(body.notes);
  const amountCents = Number(body.amountCents);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("amountCents must be greater than 0");
  }

  const billingFrequency = normalizeFrequency(
    body.billingFrequency,
    "billingFrequency"
  );
  const billingInterval = parsePositiveInteger(
    body.billingInterval,
    "billingInterval"
  );
  const billingAnchorDate = asOptionalString(body.billingAnchorDate);
  const serviceFrequency = normalizeFrequency(
    asOptionalString(body.serviceFrequency) ?? "WEEKLY",
    "serviceFrequency"
  );
  const serviceInterval = parsePositiveInteger(
    body.serviceInterval,
    "serviceInterval"
  );
  const serviceAnchorDate =
    asOptionalString(body.serviceAnchorDate) ?? billingAnchorDate;
  const status = normalizeStatus(body.status);

  await assertClientExists(organizationId, clientId);
  await assertPropertyExists(organizationId, propertyId, clientId);

  await sql`
    INSERT INTO admin_retainers (
      id,
      organization_id,
      client_id,
      property_id,
      name,
      amount_cents,
      billing_frequency,
      billing_interval,
      billing_anchor_date,
      service_frequency,
      service_interval,
      service_anchor_date,
      status,
      notes
    )
    VALUES (
      ${id},
      ${organizationId},
      ${clientId},
      ${propertyId},
      ${name},
      ${Math.round(amountCents)},
      ${billingFrequency},
      ${billingInterval},
      ${billingAnchorDate},
      ${serviceFrequency},
      ${serviceInterval},
      ${serviceAnchorDate},
      ${status},
      ${notes}
    )
  `;

  return fetchRetainerRecord(organizationId, id);
}

export async function updateRetainer(
  organizationId: string,
  id: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existing = await getRetainerById(organizationId, id);
  if (!existing) return null;

  const clientId =
    body.clientId !== undefined
      ? asNonEmptyString(body.clientId, "clientId")
      : String(existing.client_id);
  const propertyId =
    body.propertyId !== undefined
      ? asOptionalString(body.propertyId)
      : (existing.property_id as string | null);
  const name =
    body.name !== undefined ? asNonEmptyString(body.name, "name") : String(existing.name);
  const notes =
    body.notes !== undefined ? asOptionalString(body.notes) : existing.notes;
  const amountCents =
    body.amountCents !== undefined ? Number(body.amountCents) : Number(existing.amount_cents);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("amountCents must be greater than 0");
  }

  const billingFrequency =
    body.billingFrequency !== undefined
      ? normalizeFrequency(body.billingFrequency, "billingFrequency")
      : normalizeFrequency(existing.billing_frequency, "billingFrequency");
  const billingInterval =
    body.billingInterval !== undefined
      ? parsePositiveInteger(body.billingInterval, "billingInterval")
      : parsePositiveInteger(existing.billing_interval, "billingInterval");
  const billingAnchorDate =
    body.billingAnchorDate !== undefined
      ? asOptionalString(body.billingAnchorDate)
      : (existing.billing_anchor_date as string | null);
  const serviceFrequency =
    body.serviceFrequency !== undefined
      ? normalizeFrequency(body.serviceFrequency, "serviceFrequency")
      : normalizeFrequency(existing.service_frequency, "serviceFrequency");
  const serviceInterval =
    body.serviceInterval !== undefined
      ? parsePositiveInteger(body.serviceInterval, "serviceInterval")
      : parsePositiveInteger(existing.service_interval, "serviceInterval");
  const serviceAnchorDate =
    body.serviceAnchorDate !== undefined
      ? asOptionalString(body.serviceAnchorDate)
      : (existing.service_anchor_date as string | null);
  const status =
    body.status !== undefined
      ? normalizeStatus(body.status)
      : normalizeStatus(existing.status);

  await assertClientExists(organizationId, clientId);
  await assertPropertyExists(organizationId, propertyId, clientId);

  await sql`
    UPDATE admin_retainers
    SET
      client_id = ${clientId},
      property_id = ${propertyId},
      name = ${name},
      amount_cents = ${Math.round(amountCents)},
      billing_frequency = ${billingFrequency},
      billing_interval = ${billingInterval},
      billing_anchor_date = ${billingAnchorDate},
      service_frequency = ${serviceFrequency},
      service_interval = ${serviceInterval},
      service_anchor_date = ${serviceAnchorDate},
      status = ${status},
      notes = ${notes},
      updated_at = NOW()
    WHERE id = ${id} AND organization_id = ${organizationId}
  `;

  return fetchRetainerRecord(organizationId, id);
}

export async function deleteRetainer(organizationId: string, retainerId: string) {
  await ensureAdminTables();

  const existing = await fetchRetainerRecord(organizationId, retainerId);
  if (!existing) return null;

  const historicalJobRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM admin_jobs
    WHERE organization_id = ${organizationId}
      AND retainer_id = ${retainerId}
      AND NOT (
        source_type = 'PLAN'
        AND completed_at IS NULL
        AND scheduled_for >= NOW()
      )
  `;
  const invoiceRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM admin_invoices
    WHERE organization_id = ${organizationId}
      AND retainer_id = ${retainerId}
  `;
  const invoiceLineItemRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM admin_invoice_line_items
    WHERE organization_id = ${organizationId}
      AND retainer_id = ${retainerId}
  `;

  const historicalJobCount = Number(historicalJobRows[0]?.count ?? 0);
  const invoiceCount = Number(invoiceRows[0]?.count ?? 0);
  const invoiceLineItemCount = Number(invoiceLineItemRows[0]?.count ?? 0);

  if (historicalJobCount > 0 || invoiceCount > 0 || invoiceLineItemCount > 0) {
    const blockers: string[] = [];
    if (historicalJobCount > 0) {
      blockers.push(`${historicalJobCount} historical job${historicalJobCount === 1 ? "" : "s"}`);
    }
    if (invoiceCount > 0) {
      blockers.push(`${invoiceCount} invoice${invoiceCount === 1 ? "" : "s"}`);
    }
    if (invoiceLineItemCount > 0) {
      blockers.push(`${invoiceLineItemCount} invoice line item${invoiceLineItemCount === 1 ? "" : "s"}`);
    }

    throw new Error(
      `This plan can't be deleted because it still has ${blockers.join(", ")}. Delete is only allowed for unused plans or plans with only future uncompleted plan-generated visits.`
    );
  }

  return sql.begin(async (tx) => {
    const futureVisitDelete = await tx`
      DELETE FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND retainer_id = ${retainerId}
        AND source_type = 'PLAN'
        AND completed_at IS NULL
        AND scheduled_for >= NOW()
    `;

    const retainerDelete = await tx`
      DELETE FROM admin_retainers
      WHERE organization_id = ${organizationId}
        AND id = ${retainerId}
    `;

    return {
      deleted: Number(retainerDelete.count ?? 0) > 0,
      deletedFutureVisitCount: Number(futureVisitDelete.count ?? 0),
    } satisfies DeleteRetainerResult;
  });
}

export async function syncRetainerJobs(
  organizationId: string,
  retainerId: string,
  options: { regenerate?: boolean } = {}
) {
  await ensureAdminTables();

  const retainer = await fetchRetainerRecord(organizationId, retainerId);
  if (!retainer) return null;

  if (options.regenerate) {
    await sql`
      DELETE FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND retainer_id = ${retainerId}
        AND source_type = 'PLAN'
        AND completed_at IS NULL
        AND scheduled_for >= NOW()
    `;
  }

  if (String(retainer.status).toUpperCase() !== "ACTIVE") {
    return fetchRetainerRecord(organizationId, retainerId);
  }

  const serviceFrequency = normalizeFrequency(
    retainer.service_frequency,
    "serviceFrequency"
  );
  const serviceInterval = parsePositiveInteger(
    retainer.service_interval,
    "serviceInterval"
  );

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 90);

  let cursor = normalizeAnchorDate(retainer.service_anchor_date);
  let safety = 0;
  while (cursor < now && safety < 500) {
    cursor = addFrequency(cursor, serviceFrequency, serviceInterval);
    safety += 1;
  }

  let insertSafety = 0;
  while (cursor <= horizon && insertSafety < 240) {
    const occurrenceDate = formatDateOnly(cursor);
    const sourceKey = formatSourceKey(retainerId, cursor);

    const existingRows = await sql`
      SELECT id
      FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND retainer_id = ${retainerId}
        AND scheduled_for >= NOW() - INTERVAL '1 day'
        AND (
          source_key = ${sourceKey}
          OR source_plan_occurrence_date = ${occurrenceDate}
          OR DATE(scheduled_for) = ${occurrenceDate}
        )
      LIMIT 1
    `;

    if (!existingRows[0]) {
      await sql`
        INSERT INTO admin_jobs (
          id,
          organization_id,
          client_id,
          property_id,
          retainer_id,
          title,
          notes,
          status,
          scheduled_for,
          duration_minutes,
          price_cents,
          source_type,
          source_key,
          source_plan_occurrence_date,
          plan_visit_modified
        )
        VALUES (
          ${crypto.randomUUID()},
          ${organizationId},
          ${retainer.client_id},
          ${retainer.property_id},
          ${retainerId},
          ${retainer.name},
          ${retainer.notes},
          ${"SCHEDULED"},
          ${cursor.toISOString()},
          ${60},
          ${null},
          ${"PLAN"},
          ${sourceKey},
          ${occurrenceDate},
          ${false}
        )
        ON CONFLICT DO NOTHING
      `;
    }

    cursor = addFrequency(cursor, serviceFrequency, serviceInterval);
    insertSafety += 1;
  }

  return fetchRetainerRecord(organizationId, retainerId);
}
