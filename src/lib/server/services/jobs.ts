import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";
type JobStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

export type JobListFilters = {
  start?: string | null;
  end?: string | null;
  status?: string | null;
  clientId?: string | null;
  propertyId?: string | null;
  includeCompleted?: boolean;
};

const VALID_JOB_STATUSES = new Set<JobStatus>([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
]);

function addInterval(date: Date, frequency: Frequency, interval: number) {
  const next = new Date(date);

  if (frequency === "DAILY") next.setDate(next.getDate() + interval);
  else if (frequency === "WEEKLY") next.setDate(next.getDate() + interval * 7);
  else if (frequency === "MONTHLY") next.setMonth(next.getMonth() + interval);
  else throw new Error("Invalid recurrence frequency");

  return next;
}

function parseDateInput(value: unknown, label: string) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return date;
}

function parseOptionalMoney(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid priceCents");
  }
  return Math.round(amount);
}

function parseOptionalHours(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours < 0) {
    throw new Error("Invalid hours");
  }
  return hours;
}

function parseOptionalDuration(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const duration = Math.round(Number(value));
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Invalid durationMinutes");
  }
  return duration;
}

function normalizeStatus(value: unknown, fallback: JobStatus = "SCHEDULED"): JobStatus {
  const status = String(value ?? fallback).trim().toUpperCase() as JobStatus;
  if (!VALID_JOB_STATUSES.has(status)) {
    throw new Error("Invalid job status");
  }
  return status;
}

async function assertClientExists(organizationId: string, clientId: string | null) {
  if (!clientId) return;
  const rows = await sql`
    SELECT id
    FROM admin_clients
    WHERE organization_id = ${organizationId} AND id = ${clientId}
    LIMIT 1
  `;

  if (!rows[0]) throw new Error("Selected client not found");
}

async function assertPropertyExists(
  organizationId: string,
  propertyId: string | null,
  clientId: string | null
) {
  if (!propertyId) return;

  const rows = await sql`
    SELECT id, client_id
    FROM admin_properties
    WHERE organization_id = ${organizationId} AND id = ${propertyId}
    LIMIT 1
  `;

  const property = rows[0];
  if (!property) throw new Error("Selected property not found");
  if (clientId && property.client_id && property.client_id !== clientId) {
    throw new Error("Selected property does not belong to the selected client");
  }
}

async function assertServiceExists(organizationId: string, serviceId: string | null) {
  if (!serviceId) return null;

  const rows = await sql`
    SELECT id, name, unit_price_cents
    FROM admin_services
    WHERE organization_id = ${organizationId} AND id = ${serviceId}
    LIMIT 1
  `;

  const service = rows[0];
  if (!service) throw new Error("Selected service not found");
  return service;
}

async function assertRetainerExists(organizationId: string, retainerId: string | null) {
  if (!retainerId) return null;

  const rows = await sql`
    SELECT id
    FROM admin_retainers
    WHERE organization_id = ${organizationId} AND id = ${retainerId}
    LIMIT 1
  `;

  if (!rows[0]) throw new Error("Selected plan not found");
  return rows[0];
}

async function fetchJobRecord(organizationId: string, jobId: string) {
  const rows = await sql`
    SELECT
      j.id,
      j.organization_id,
      j.client_id,
      j.property_id,
      j.service_id,
      j.order_id,
      j.retainer_id,
      j.title,
      j.notes,
      j.status,
      j.scheduled_for,
      j.duration_minutes,
      j.hours_numeric,
      j.price_cents,
      j.completed_at,
      j.recurrence_enabled,
      j.recurrence_frequency,
      j.recurrence_interval,
      j.recurrence_end_date,
      j.parent_job_id,
      j.source_type,
      j.source_key,
      j.source_plan_occurrence_date,
      j.plan_visit_modified,
      j.created_at,
      j.updated_at,
      c.name AS client_name,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      r.name AS plan_name,
      COALESCE(photo_summary.photo_count, 0) AS photo_count,
      COALESCE(photo_summary.photos, '[]'::json) AS photos
    FROM admin_jobs j
    LEFT JOIN admin_clients c
      ON c.id = j.client_id
      AND c.organization_id = j.organization_id
    LEFT JOIN admin_properties p
      ON p.id = j.property_id
      AND p.organization_id = j.organization_id
    LEFT JOIN admin_retainers r
      ON r.id = j.retainer_id
      AND r.organization_id = j.organization_id
    LEFT JOIN (
      SELECT
        jp.job_id,
        COUNT(*)::int AS photo_count,
        json_agg(
          json_build_object(
            'id', jp.id,
            'url', jp.url,
            'caption', jp.caption,
            'uploaded_at', jp.uploaded_at
          )
          ORDER BY jp.uploaded_at DESC
        ) AS photos
      FROM admin_job_photos jp
      GROUP BY jp.job_id
    ) AS photo_summary
      ON photo_summary.job_id = j.id
    WHERE j.organization_id = ${organizationId} AND j.id = ${jobId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listJobs(organizationId: string, filters: JobListFilters = {}) {
  await ensureAdminTables();

  const start = filters.start
    ? parseDateInput(filters.start, "start")
    : new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
  const end = filters.end
    ? parseDateInput(filters.end, "end")
    : new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);

  if (end <= start) {
    throw new Error("end must be after start");
  }

  const status =
    filters.status && filters.status !== "ALL"
      ? normalizeStatus(filters.status)
      : null;
  const clientId = filters.clientId ? String(filters.clientId) : null;
  const propertyId = filters.propertyId ? String(filters.propertyId) : null;
  const includeCompleted = Boolean(filters.includeCompleted);

  return sql`
    SELECT
      j.id,
      j.organization_id,
      j.client_id,
      j.property_id,
      j.service_id,
      j.order_id,
      j.retainer_id,
      j.title,
      j.notes,
      j.status,
      j.scheduled_for,
      j.duration_minutes,
      j.hours_numeric,
      j.price_cents,
      j.completed_at,
      j.recurrence_enabled,
      j.recurrence_frequency,
      j.recurrence_interval,
      j.recurrence_end_date,
      j.parent_job_id,
      j.source_type,
      j.source_key,
      j.source_plan_occurrence_date,
      j.plan_visit_modified,
      j.created_at,
      j.updated_at,
      c.name AS client_name,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      r.name AS plan_name,
      COALESCE(photo_summary.photo_count, 0) AS photo_count,
      COALESCE(photo_summary.photos, '[]'::json) AS photos
    FROM admin_jobs j
    LEFT JOIN admin_clients c
      ON c.id = j.client_id
      AND c.organization_id = j.organization_id
    LEFT JOIN admin_properties p
      ON p.id = j.property_id
      AND p.organization_id = j.organization_id
    LEFT JOIN admin_retainers r
      ON r.id = j.retainer_id
      AND r.organization_id = j.organization_id
    LEFT JOIN (
      SELECT
        jp.job_id,
        COUNT(*)::int AS photo_count,
        json_agg(
          json_build_object(
            'id', jp.id,
            'url', jp.url,
            'caption', jp.caption,
            'uploaded_at', jp.uploaded_at
          )
          ORDER BY jp.uploaded_at DESC
        ) AS photos
      FROM admin_job_photos jp
      GROUP BY jp.job_id
    ) AS photo_summary
      ON photo_summary.job_id = j.id
    WHERE j.organization_id = ${organizationId}
      AND j.scheduled_for >= ${start.toISOString()}
      AND j.scheduled_for < ${end.toISOString()}
      ${status ? sql`AND UPPER(j.status) = ${status}` : sql``}
      ${clientId ? sql`AND j.client_id = ${clientId}` : sql``}
      ${propertyId ? sql`AND j.property_id = ${propertyId}` : sql``}
      ${!includeCompleted && status !== "COMPLETED"
        ? sql`AND UPPER(j.status) <> 'COMPLETED'`
        : sql``}
    ORDER BY j.scheduled_for ASC, j.created_at ASC
  `;
}

export async function getJobById(organizationId: string, jobId: string) {
  await ensureAdminTables();
  return fetchJobRecord(organizationId, jobId);
}

export async function createJob(
  organizationId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const clientId = asOptionalString(body.clientId);
  const propertyId = asOptionalString(body.propertyId);
  const serviceId = asOptionalString(body.serviceId);
  const retainerId = asOptionalString(body.retainerId);
  const notes = asOptionalString(body.notes);
  const scheduledFor = parseDateInput(
    asNonEmptyString(body.scheduledFor, "scheduledFor"),
    "scheduledFor"
  );

  await assertClientExists(organizationId, clientId);
  await assertPropertyExists(organizationId, propertyId, clientId);
  const service = await assertServiceExists(organizationId, serviceId);
  await assertRetainerExists(organizationId, retainerId);

  let title = asOptionalString(body.title);
  let priceCents = parseOptionalMoney(body.priceCents);
  const hours = parseOptionalHours(body.hours ?? body.hoursNumeric);
  const durationMinutes = parseOptionalDuration(
    body.durationMinutes ?? body.duration_minutes
  );
  const status = normalizeStatus(body.status, "SCHEDULED");

  if (service) {
    if (!title) title = service.name;
    if (priceCents === null) priceCents = Number(service.unit_price_cents ?? 0);
  }

  if (!title) {
    throw new Error("Title is required when no service is selected");
  }

  const recurrenceEnabled = Boolean(body.recurrenceEnabled);
  const recurrenceFrequency = recurrenceEnabled
    ? (asNonEmptyString(body.recurrenceFrequency, "recurrenceFrequency").toUpperCase() as Frequency)
    : null;
  const recurrenceInterval = recurrenceEnabled
    ? Math.max(1, Number(body.recurrenceInterval ?? 1))
    : null;
  const recurrenceEndDate =
    recurrenceEnabled && body.recurrenceEndDate
      ? parseDateInput(body.recurrenceEndDate, "recurrenceEndDate")
      : null;

  const completedAt = status === "COMPLETED" ? new Date().toISOString() : null;

  await sql`
    INSERT INTO admin_jobs (
      id,
      organization_id,
      client_id,
      property_id,
      service_id,
      retainer_id,
      title,
      notes,
      status,
      scheduled_for,
      duration_minutes,
      hours_numeric,
      price_cents,
      completed_at,
      recurrence_enabled,
      recurrence_frequency,
      recurrence_interval,
      recurrence_end_date,
      source_type
    )
    VALUES (
      ${id},
      ${organizationId},
      ${clientId},
      ${propertyId},
      ${serviceId},
      ${retainerId},
      ${title},
      ${notes},
      ${status},
      ${scheduledFor.toISOString()},
      ${durationMinutes},
      ${hours},
      ${priceCents},
      ${completedAt},
      ${recurrenceEnabled},
      ${recurrenceFrequency},
      ${recurrenceInterval},
      ${recurrenceEndDate ? recurrenceEndDate.toISOString() : null},
      ${"MANUAL"}
    )
  `;

  if (recurrenceEnabled && recurrenceFrequency && recurrenceInterval && recurrenceEndDate) {
    let cursor = new Date(scheduledFor);
    let safety = 0;

    while (safety < 365) {
      cursor = addInterval(cursor, recurrenceFrequency, recurrenceInterval);
      if (cursor > recurrenceEndDate) break;

      await sql`
        INSERT INTO admin_jobs (
          id,
          organization_id,
          client_id,
          property_id,
          service_id,
          retainer_id,
          title,
          notes,
          status,
          scheduled_for,
          duration_minutes,
          hours_numeric,
          price_cents,
          recurrence_enabled,
          recurrence_frequency,
          recurrence_interval,
          recurrence_end_date,
          parent_job_id,
          source_type
        )
        VALUES (
          ${crypto.randomUUID()},
          ${organizationId},
          ${clientId},
          ${propertyId},
          ${serviceId},
          ${retainerId},
          ${title},
          ${notes},
          ${"SCHEDULED"},
          ${cursor.toISOString()},
          ${durationMinutes},
          ${hours},
          ${priceCents},
          ${true},
          ${recurrenceFrequency},
          ${recurrenceInterval},
          ${recurrenceEndDate.toISOString()},
          ${id},
          ${"MANUAL"}
        )
      `;

      safety += 1;
    }
  }

  return fetchJobRecord(organizationId, id);
}

export async function updateJob(
  organizationId: string,
  jobId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existing = await fetchJobRecord(organizationId, jobId);
  if (!existing) return null;

  const nextClientId =
    body.clientId !== undefined ? asOptionalString(body.clientId) : existing.client_id;
  const nextPropertyId =
    body.propertyId !== undefined
      ? asOptionalString(body.propertyId)
      : existing.property_id;
  const nextServiceId =
    body.serviceId !== undefined ? asOptionalString(body.serviceId) : existing.service_id;
  const nextRetainerId =
    body.retainerId !== undefined
      ? asOptionalString(body.retainerId)
      : existing.retainer_id;

  await assertClientExists(organizationId, nextClientId);
  await assertPropertyExists(organizationId, nextPropertyId, nextClientId);
  const service = await assertServiceExists(organizationId, nextServiceId);
  await assertRetainerExists(organizationId, nextRetainerId);

  let nextTitle =
    body.title === undefined
      ? String(existing.title)
      : asOptionalString(body.title) ?? String(existing.title);
  let nextPriceCents =
    body.priceCents === undefined
      ? parseOptionalMoney(existing.price_cents)
      : parseOptionalMoney(body.priceCents);

  if (service) {
    if (!nextTitle) nextTitle = service.name;
    if (nextPriceCents === null) nextPriceCents = Number(service.unit_price_cents ?? 0);
  }

  if (!nextTitle) {
    throw new Error("Title is required");
  }

  const nextNotes =
    body.notes === undefined ? existing.notes : asOptionalString(body.notes);
  const nextStatus =
    body.status === undefined ? normalizeStatus(existing.status) : normalizeStatus(body.status);
  const nextScheduledFor =
    body.scheduledFor === undefined || body.scheduledFor === null || body.scheduledFor === ""
      ? new Date(String(existing.scheduled_for))
      : parseDateInput(body.scheduledFor, "scheduledFor");
  const nextDurationMinutes =
    body.durationMinutes === undefined && body.duration_minutes === undefined
      ? parseOptionalDuration(existing.duration_minutes)
      : parseOptionalDuration(body.durationMinutes ?? body.duration_minutes);
  const nextHours =
    body.hours === undefined && body.hoursNumeric === undefined
      ? parseOptionalHours(existing.hours_numeric)
      : parseOptionalHours(body.hours ?? body.hoursNumeric);

  const completedAt =
    nextStatus === "COMPLETED"
      ? existing.completed_at ?? new Date().toISOString()
      : null;

  const planVisitModified =
    Boolean(existing.plan_visit_modified) ||
    (String(existing.source_type ?? "MANUAL").toUpperCase() === "PLAN" &&
      [
        body.clientId,
        body.propertyId,
        body.title,
        body.notes,
        body.status,
        body.scheduledFor,
        body.durationMinutes,
        body.duration_minutes,
        body.hours,
        body.hoursNumeric,
        body.priceCents,
      ].some((value) => value !== undefined));

  await sql`
    UPDATE admin_jobs
    SET
      client_id = ${nextClientId},
      property_id = ${nextPropertyId},
      service_id = ${nextServiceId},
      retainer_id = ${nextRetainerId},
      title = ${nextTitle},
      notes = ${nextNotes},
      status = ${nextStatus},
      scheduled_for = ${nextScheduledFor.toISOString()},
      duration_minutes = ${nextDurationMinutes},
      hours_numeric = ${nextHours},
      price_cents = ${nextPriceCents},
      completed_at = ${completedAt},
      plan_visit_modified = ${planVisitModified},
      updated_at = NOW()
    WHERE organization_id = ${organizationId} AND id = ${jobId}
  `;

  return fetchJobRecord(organizationId, jobId);
}

export async function deleteJob(organizationId: string, jobId: string) {
  await ensureAdminTables();

  const result = await sql`
    DELETE FROM admin_jobs
    WHERE organization_id = ${organizationId} AND id = ${jobId}
  `;

  return result.count > 0;
}
