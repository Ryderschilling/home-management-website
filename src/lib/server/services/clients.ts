import { ensureAdminTables, sql } from "@/lib/server/db";
import { queueWelcomeCommunicationForClient } from "@/lib/server/services/communications";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

function normalizeClientStatus(value: unknown, fallback = "ACTIVE") {
  const status = String(value ?? fallback).trim().toUpperCase();
  if (!status) {
    throw new Error("status must be a non-empty string");
  }
  return status;
}

function parseOptionalTimestamp(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return date.toISOString();
}

async function fetchClientRecord(organizationId: string, clientId: string) {
  const rows = await sql`
    SELECT
      c.id,
      c.organization_id,
      c.name,
      c.email,
      c.phone,
      c.notes,
      c.address_text,
      c.preferred_contact_method,
      c.service_address_text,
      c.entry_notes,
      c.billing_notes,
      c.status,
      c.last_contacted_at,
      c.welcome_email_sent_at,
      c.archived_at,
      c.created_at,
      c.updated_at,
      COALESCE(summary.property_count, 0) AS property_count,
      COALESCE(summary.active_plans_count, 0) AS active_plans_count,
      COALESCE(summary.upcoming_jobs_count, 0) AS upcoming_jobs_count,
      COALESCE(summary.recent_jobs_count, 0) AS recent_jobs_count,
      COALESCE(summary.unpaid_invoices_count, 0) AS unpaid_invoices_count,
      summary.next_job_at,
      summary.last_job_at
    FROM admin_clients c
    LEFT JOIN LATERAL (
      SELECT
        (
          SELECT COUNT(*)::int
          FROM admin_properties p
          WHERE p.organization_id = c.organization_id
            AND p.client_id = c.id
        ) AS property_count,
        (
          SELECT COUNT(*)::int
          FROM admin_retainers r
          WHERE r.organization_id = c.organization_id
            AND r.client_id = c.id
            AND UPPER(r.status) = 'ACTIVE'
            AND r.archived_at IS NULL
        ) AS active_plans_count,
        (
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = c.organization_id
            AND j.client_id = c.id
            AND j.scheduled_for >= NOW()
            AND UPPER(j.status) <> 'CANCELED'
        ) AS upcoming_jobs_count,
        (
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = c.organization_id
            AND j.client_id = c.id
            AND COALESCE(j.completed_at, j.scheduled_for) >= NOW() - INTERVAL '30 days'
        ) AS recent_jobs_count,
        (
          SELECT COUNT(*)::int
          FROM admin_invoices i
          WHERE i.organization_id = c.organization_id
            AND i.client_id = c.id
            AND UPPER(i.status) IN ('READY_TO_SEND', 'SCHEDULED', 'OUTSTANDING', 'OVERDUE', 'FINALIZATION_FAILED')
            AND COALESCE(i.amount_remaining_cents, i.total_cents, 0) > 0
        ) AS unpaid_invoices_count,
        (
          SELECT MIN(j.scheduled_for)
          FROM admin_jobs j
          WHERE j.organization_id = c.organization_id
            AND j.client_id = c.id
            AND j.scheduled_for >= NOW()
            AND UPPER(j.status) <> 'CANCELED'
        ) AS next_job_at,
        (
          SELECT MAX(COALESCE(j.completed_at, j.scheduled_for))
          FROM admin_jobs j
          WHERE j.organization_id = c.organization_id
            AND j.client_id = c.id
        ) AS last_job_at
    ) AS summary ON true
    WHERE c.organization_id = ${organizationId}
      AND c.id = ${clientId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

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
      c.address_text,
      c.preferred_contact_method,
      c.service_address_text,
      c.entry_notes,
      c.billing_notes,
      c.status,
      c.last_contacted_at,
      c.welcome_email_sent_at,
      c.archived_at,
      c.created_at,
      c.updated_at,
      COALESCE(summary.property_count, 0) AS property_count,
      COALESCE(summary.active_plans_count, 0) AS active_plans_count,
      COALESCE(summary.upcoming_jobs_count, 0) AS upcoming_jobs_count,
      COALESCE(summary.recent_jobs_count, 0) AS recent_jobs_count,
      COALESCE(summary.unpaid_invoices_count, 0) AS unpaid_invoices_count,
      summary.next_job_at,
      summary.last_job_at
    FROM admin_clients c
    LEFT JOIN LATERAL (
      SELECT
        (
          SELECT COUNT(*)::int
          FROM admin_properties p
          WHERE p.organization_id = c.organization_id
            AND p.client_id = c.id
        ) AS property_count,
        (
          SELECT COUNT(*)::int
          FROM admin_retainers r
          WHERE r.organization_id = c.organization_id
            AND r.client_id = c.id
            AND UPPER(r.status) = 'ACTIVE'
            AND r.archived_at IS NULL
        ) AS active_plans_count,
        (
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = c.organization_id
            AND j.client_id = c.id
            AND j.scheduled_for >= NOW()
            AND UPPER(j.status) <> 'CANCELED'
        ) AS upcoming_jobs_count,
        (
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = c.organization_id
            AND j.client_id = c.id
            AND COALESCE(j.completed_at, j.scheduled_for) >= NOW() - INTERVAL '30 days'
        ) AS recent_jobs_count,
        (
          SELECT COUNT(*)::int
          FROM admin_invoices i
          WHERE i.organization_id = c.organization_id
            AND i.client_id = c.id
            AND UPPER(i.status) IN ('READY_TO_SEND', 'SCHEDULED', 'OUTSTANDING', 'OVERDUE', 'FINALIZATION_FAILED')
            AND COALESCE(i.amount_remaining_cents, i.total_cents, 0) > 0
        ) AS unpaid_invoices_count,
        (
          SELECT MIN(j.scheduled_for)
          FROM admin_jobs j
          WHERE j.organization_id = c.organization_id
            AND j.client_id = c.id
            AND j.scheduled_for >= NOW()
            AND UPPER(j.status) <> 'CANCELED'
        ) AS next_job_at,
        (
          SELECT MAX(COALESCE(j.completed_at, j.scheduled_for))
          FROM admin_jobs j
          WHERE j.organization_id = c.organization_id
            AND j.client_id = c.id
        ) AS last_job_at
    ) AS summary ON true
    WHERE c.organization_id = ${organizationId}
    ORDER BY
      CASE
        WHEN c.archived_at IS NULL AND UPPER(c.status) = 'ACTIVE' THEN 0
        WHEN c.archived_at IS NULL THEN 1
        ELSE 2
      END,
      c.created_at DESC
  `;
}

export async function getClientById(organizationId: string, id: string) {
  await ensureAdminTables();
  return fetchClientRecord(organizationId, id);
}

export async function createClient(organizationId: string, body: Record<string, unknown>) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const name = asNonEmptyString(body.name, "name");
  const email = asOptionalString(body.email);
  const phone = asOptionalString(body.phone);
  const notes = asOptionalString(body.notes);
  const addressText = asOptionalString(body.addressText);
  const preferredContactMethod = asOptionalString(body.preferredContactMethod);
  const serviceAddressText =
    asOptionalString(body.serviceAddressText) ?? addressText;
  const entryNotes = asOptionalString(body.entryNotes);
  const billingNotes = asOptionalString(body.billingNotes);
  const status = normalizeClientStatus(body.status);
  const lastContactedAt = parseOptionalTimestamp(body.lastContactedAt, "lastContactedAt");
  const welcomeEmailSentAt = parseOptionalTimestamp(
    body.welcomeEmailSentAt,
    "welcomeEmailSentAt"
  );
  const archivedAt = parseOptionalTimestamp(body.archivedAt, "archivedAt");

  await sql`
    INSERT INTO admin_clients (
      id,
      organization_id,
      name,
      email,
      phone,
      notes,
      address_text,
      preferred_contact_method,
      service_address_text,
      entry_notes,
      billing_notes,
      status,
      last_contacted_at,
      welcome_email_sent_at,
      archived_at
    )
    VALUES (
      ${id},
      ${organizationId},
      ${name},
      ${email},
      ${phone},
      ${notes},
      ${addressText},
      ${preferredContactMethod},
      ${serviceAddressText},
      ${entryNotes},
      ${billingNotes},
      ${status},
      ${lastContactedAt},
      ${welcomeEmailSentAt},
      ${archivedAt}
    )
  `;

  await queueWelcomeCommunicationForClient(organizationId, id);
  return fetchClientRecord(organizationId, id);
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
  const addressText =
    body.addressText !== undefined ? asOptionalString(body.addressText) : current.address_text;
  const preferredContactMethod =
    body.preferredContactMethod !== undefined
      ? asOptionalString(body.preferredContactMethod)
      : current.preferred_contact_method;
  const serviceAddressText =
    body.serviceAddressText !== undefined
      ? asOptionalString(body.serviceAddressText)
      : current.service_address_text;
  const entryNotes =
    body.entryNotes !== undefined ? asOptionalString(body.entryNotes) : current.entry_notes;
  const billingNotes =
    body.billingNotes !== undefined ? asOptionalString(body.billingNotes) : current.billing_notes;
  const status =
    body.status !== undefined ? normalizeClientStatus(body.status) : String(current.status ?? "ACTIVE");
  const lastContactedAt =
    body.lastContactedAt !== undefined
      ? parseOptionalTimestamp(body.lastContactedAt, "lastContactedAt")
      : current.last_contacted_at;
  const welcomeEmailSentAt =
    body.welcomeEmailSentAt !== undefined
      ? parseOptionalTimestamp(body.welcomeEmailSentAt, "welcomeEmailSentAt")
      : current.welcome_email_sent_at;
  const archivedAt =
    body.archivedAt !== undefined
      ? parseOptionalTimestamp(body.archivedAt, "archivedAt")
      : current.archived_at;

  await sql`
    UPDATE admin_clients
    SET
      name = ${name},
      email = ${email},
      phone = ${phone},
      notes = ${notes},
      address_text = ${addressText},
      preferred_contact_method = ${preferredContactMethod},
      service_address_text = ${serviceAddressText},
      entry_notes = ${entryNotes},
      billing_notes = ${billingNotes},
      status = ${status},
      last_contacted_at = ${lastContactedAt},
      welcome_email_sent_at = ${welcomeEmailSentAt},
      archived_at = ${archivedAt},
      updated_at = NOW()
    WHERE id = ${id} AND organization_id = ${organizationId}
  `;

  return fetchClientRecord(organizationId, id);
}

export async function deleteClient(organizationId: string, id: string) {
  await ensureAdminTables();
  const deleted = await sql`
    DELETE FROM admin_clients
    WHERE id = ${id} AND organization_id = ${organizationId}
  `;
  return deleted.count > 0;
}
