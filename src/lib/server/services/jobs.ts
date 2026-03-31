import { ensureAdminTables, sql } from "@/lib/server/db";
import { queueJobCompletionSummaryDraft } from "@/lib/server/services/communications";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";
type JobStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
type RecurrenceScope =
  | "THIS"
  | "FUTURE"
  | "SERIES"
  | "THIS_VISIT_ONLY"
  | "FUTURE_PLAN_VISITS";
type JobRecord = {
  id: string;
  title: string;
  notes?: string | null;
  status: string;
  scheduled_for: string | Date;
  duration_minutes?: number | null;
  hours_numeric?: string | number | null;
  price_cents?: number | null;
  completed_at?: string | Date | null;
  client_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  retainer_id?: string | null;
  recurrence_enabled?: boolean | null;
  recurrence_frequency?: string | null;
  recurrence_interval?: number | null;
  recurrence_end_date?: string | Date | null;
  parent_job_id?: string | null;
  recurring_series_id?: string | null;
  source_type?: string | null;
  source_plan_occurrence_date?: string | Date | null;
  plan_visit_modified?: boolean | null;
};

export type JobListFilters = {
  start?: string | null;
  end?: string | null;
  status?: string | null;
  clientId?: string | null;
  propertyId?: string | null;
  includeCompleted?: boolean;
};

export type DeleteJobResult = {
  deleted: boolean;
  deletedCount: number;
  skippedCompletedCount: number;
  skippedModifiedCount: number;
  recurrenceScope: RecurrenceScope | "NONE";
};

const VALID_JOB_STATUSES = new Set<JobStatus>([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
]);
const VALID_RECURRENCE_SCOPES = new Set<RecurrenceScope>([
  "THIS",
  "FUTURE",
  "SERIES",
  "THIS_VISIT_ONLY",
  "FUTURE_PLAN_VISITS",
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

function normalizeRecurrenceScope(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const scope = String(value).trim().toUpperCase() as RecurrenceScope;
  if (!VALID_RECURRENCE_SCOPES.has(scope)) {
    throw new Error("Invalid recurrenceScope");
  }
  return scope;
}

function isPlanJob(job: JobRecord) {
  return String(job.source_type ?? "MANUAL").toUpperCase() === "PLAN";
}

function isManualRecurringJob(job: JobRecord) {
  return !isPlanJob(job) && Boolean(job.recurring_series_id || job.parent_job_id || job.recurrence_enabled);
}

function coerceDbString(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized === "" ? null : normalized;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
}

function coerceDbDate(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing ${label}`);
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return date;
}

function coerceDbIsoDateTime(value: unknown, label: string) {
  return coerceDbDate(value, label).toISOString();
}

function coerceDbDateOnly(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function getManualSeriesId(job: JobRecord) {
  return (
    coerceDbString(job.recurring_series_id) ??
    coerceDbString(job.parent_job_id) ??
    coerceDbString(job.id) ??
    (() => {
      throw new Error("Job record is missing a series identifier");
    })()
  );
}

function getPlanFutureBoundary(job: JobRecord) {
  return {
    occurrenceDate: coerceDbDateOnly(job.source_plan_occurrence_date),
    scheduledBoundary: coerceDbIsoDateTime(job.scheduled_for, "scheduled_for"),
  };
}

function assertManualScopedUpdateAllowed(body: Record<string, unknown>) {
  const restrictedKeys = [
    "clientId",
    "propertyId",
    "serviceId",
    "retainerId",
    "scheduledFor",
    "recurrenceEnabled",
    "recurrenceFrequency",
    "recurrenceInterval",
    "recurrenceEndDate",
  ];

  if (restrictedKeys.some((key) => body[key] !== undefined)) {
    throw new Error(
      "This and future / entire series edits currently support title, notes, status, duration, hours, and price only. Save this event only for schedule or ownership changes."
    );
  }
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
    SELECT
      id,
      name,
      billing_model,
      amount_cents,
      visit_rate_cents,
      on_call_base_fee_cents,
      hourly_rate_cents,
      service_type
    FROM admin_retainers
    WHERE organization_id = ${organizationId} AND id = ${retainerId}
    LIMIT 1
  `;

  if (!rows[0]) throw new Error("Selected plan not found");
  return rows[0];
}

function deriveRetainerLinkedPriceCents(
  retainer:
    | {
        billing_model?: string | null;
        amount_cents?: number | null;
        visit_rate_cents?: number | null;
        on_call_base_fee_cents?: number | null;
        hourly_rate_cents?: number | null;
      }
    | null,
  currentPriceCents: number | null,
  hours: number | null
) {
  if (currentPriceCents !== null) return currentPriceCents;
  if (!retainer) return currentPriceCents;

  const billingModel = String(retainer.billing_model ?? "FIXED_RECURRING").toUpperCase();
  const amountCents = Number(retainer.amount_cents ?? 0);
  const visitRateCents = Number(retainer.visit_rate_cents ?? 0);
  const onCallBaseFeeCents = Number(retainer.on_call_base_fee_cents ?? 0);
  const hourlyRateCents = Number(retainer.hourly_rate_cents ?? 0);

  if (billingModel === "USAGE_RECURRING") {
    return visitRateCents > 0 ? visitRateCents : null;
  }

  if (billingModel === "ONE_OFF_TIME") {
    const billableHours = Number.isFinite(hours ?? NaN) && (hours ?? 0) > 0 ? Number(hours) : 0;
    const hourlyComponent =
      hourlyRateCents > 0 && billableHours > 0 ? Math.round(hourlyRateCents * billableHours) : 0;
    const total = Math.max(0, onCallBaseFeeCents) + Math.max(0, hourlyComponent);
    return total > 0 ? total : null;
  }

  if (billingModel === "FLAT_ONE_OFF") {
    if (amountCents > 0) return amountCents;
    if (onCallBaseFeeCents > 0) return onCallBaseFeeCents;
  }

  return null;
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
      j.recurring_series_id,
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
      j.recurring_series_id,
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
  const retainer = await assertRetainerExists(organizationId, retainerId);

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
  if (retainer) {
    if (!title) title = String(retainer.name ?? "");
    priceCents = deriveRetainerLinkedPriceCents(retainer, priceCents, hours);
  }

  if (!title) {
    throw new Error("Title is required when no service is selected");
  }
  if (status === "COMPLETED" && !notes) {
    throw new Error("Completion notes are required before a job can be marked completed");
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
      recurring_series_id,
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
      ${recurrenceEnabled ? id : null},
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
          recurring_series_id,
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
          ${id},
          ${"MANUAL"}
        )
      `;

      safety += 1;
    }
  }

  const saved = await fetchJobRecord(organizationId, id);
  if (saved && status === "COMPLETED") {
    await queueJobCompletionSummaryDraft(organizationId, id);
  }
  return saved;
}

export async function updateJob(
  organizationId: string,
  jobId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existing = await fetchJobRecord(organizationId, jobId);
  if (!existing) return null;

  const scope = normalizeRecurrenceScope(body.recurrenceScope);
  if (scope === "FUTURE_PLAN_VISITS" && !isPlanJob(existing as JobRecord)) {
    throw new Error("Future plan visit scope is only available for plan-generated visits");
  }

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
  const retainer = await assertRetainerExists(organizationId, nextRetainerId);

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

  const nextNotes =
    body.notes === undefined ? existing.notes : asOptionalString(body.notes);
  const nextStatus =
    body.status === undefined ? normalizeStatus(existing.status) : normalizeStatus(body.status);
  const nextScheduledFor =
    body.scheduledFor === undefined || body.scheduledFor === null || body.scheduledFor === ""
      ? coerceDbDate(existing.scheduled_for, "scheduled_for")
      : parseDateInput(body.scheduledFor, "scheduledFor");
  const nextDurationMinutes =
    body.durationMinutes === undefined && body.duration_minutes === undefined
      ? parseOptionalDuration(existing.duration_minutes)
      : parseOptionalDuration(body.durationMinutes ?? body.duration_minutes);
  const nextHours =
    body.hours === undefined && body.hoursNumeric === undefined
      ? parseOptionalHours(existing.hours_numeric)
      : parseOptionalHours(body.hours ?? body.hoursNumeric);
  if (retainer) {
    if (!nextTitle) nextTitle = String(retainer.name ?? "");
    nextPriceCents = deriveRetainerLinkedPriceCents(retainer, nextPriceCents, nextHours);
  }

  if (!nextTitle) {
    throw new Error("Title is required");
  }

  const completedAt =
    nextStatus === "COMPLETED"
      ? existing.completed_at ?? new Date().toISOString()
      : null;
  if (nextStatus === "COMPLETED" && !nextNotes) {
    throw new Error("Completion notes are required before a job can be marked completed");
  }

  const effectiveScope =
    scope === "THIS_VISIT_ONLY" ? "THIS" : scope;

  async function updateSingleJob() {
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

    const updatedJob = await fetchJobRecord(organizationId, jobId);
    if (updatedJob && nextStatus === "COMPLETED") {
      await queueJobCompletionSummaryDraft(organizationId, jobId);
    }
    return updatedJob;
  }

  if (isPlanJob(existing as JobRecord)) {
    if (scope === "FUTURE_PLAN_VISITS") {
      if (!existing.retainer_id) {
        throw new Error("This plan-generated visit is missing its plan reference");
      }

      throw new Error(
        "Future plan visit edits are managed from Plans. Open the plan workspace to regenerate or adjust future visits safely."
      );
    }

    return updateSingleJob();
  }

  if ((effectiveScope === "FUTURE" || effectiveScope === "SERIES") && !isManualRecurringJob(existing as JobRecord)) {
    throw new Error("Scoped series edits are only available for manual recurring jobs");
  }

  if ((effectiveScope === "FUTURE" || effectiveScope === "SERIES") && isManualRecurringJob(existing as JobRecord)) {
    if (existing.completed_at) {
      throw new Error("Completed visits can only be edited individually");
    }

    assertManualScopedUpdateAllowed(body);

    const seriesId = getManualSeriesId(existing as JobRecord);
    const scheduledBoundary = coerceDbIsoDateTime(existing.scheduled_for, "scheduled_for");
    const bulkCompletedAt =
      nextStatus === "COMPLETED"
        ? existing.completed_at ?? new Date().toISOString()
        : null;

    await sql`
      UPDATE admin_jobs
      SET
        title = ${nextTitle},
        notes = ${nextNotes},
        status = ${nextStatus},
        duration_minutes = ${nextDurationMinutes},
        hours_numeric = ${nextHours},
        price_cents = ${nextPriceCents},
        completed_at = ${bulkCompletedAt},
        updated_at = NOW()
      WHERE organization_id = ${organizationId}
        AND recurring_series_id = ${seriesId}
        ${effectiveScope === "FUTURE" ? sql`AND scheduled_for >= ${scheduledBoundary}` : sql``}
        AND completed_at IS NULL
    `;

    const updatedJob = await fetchJobRecord(organizationId, jobId);
    if (updatedJob && nextStatus === "COMPLETED") {
      await queueJobCompletionSummaryDraft(organizationId, jobId);
    }
    return updatedJob;
  }

  return updateSingleJob();
}

export async function deleteJob(
  organizationId: string,
  jobId: string,
  body: Record<string, unknown> = {}
) {
  await ensureAdminTables();

  const existing = await fetchJobRecord(organizationId, jobId);
  if (!existing) return null;

  const scope = normalizeRecurrenceScope(body.recurrenceScope);
  if (scope === "FUTURE_PLAN_VISITS" && !isPlanJob(existing as JobRecord)) {
    throw new Error("Future plan visit scope is only available for plan-generated visits");
  }

  if (isPlanJob(existing as JobRecord) && scope === "FUTURE_PLAN_VISITS") {
    const retainerId = coerceDbString(existing.retainer_id);
    if (!retainerId) {
      throw new Error("This plan-generated visit is missing its plan reference");
    }

    const { occurrenceDate, scheduledBoundary } = getPlanFutureBoundary(existing as JobRecord);
    const matchingPlanVisits = await sql`
      SELECT
        id,
        completed_at,
        plan_visit_modified
      FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND retainer_id = ${retainerId}
        AND source_type = 'PLAN'
        AND (
          id = ${jobId}
          OR ${
            occurrenceDate
              ? sql`(
                  (source_plan_occurrence_date IS NOT NULL AND source_plan_occurrence_date >= ${occurrenceDate})
                  OR (source_plan_occurrence_date IS NULL AND scheduled_for >= ${scheduledBoundary})
                )`
              : sql`scheduled_for >= ${scheduledBoundary}`
          }
        )
    `;

    const skippedCompletedCount = matchingPlanVisits.filter((job) => Boolean(job.completed_at)).length;
    const skippedModifiedCount = matchingPlanVisits.filter(
      (job) => job.id !== jobId && !job.completed_at && Boolean(job.plan_visit_modified)
    ).length;
    const deletableIds = matchingPlanVisits
      .filter((job) => {
        if (job.completed_at) return false;
        if (job.id === jobId) return true;
        return !Boolean(job.plan_visit_modified);
      })
      .map((job) => String(job.id));

    if (deletableIds.length === 0) {
      return {
        deleted: false,
        deletedCount: 0,
        skippedCompletedCount,
        skippedModifiedCount,
        recurrenceScope: scope,
      } satisfies DeleteJobResult;
    }

    const result = await sql`
      DELETE FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND id = ANY(${deletableIds})
    `;

    return {
      deleted: Number(result.count ?? 0) > 0,
      deletedCount: Number(result.count ?? 0),
      skippedCompletedCount,
      skippedModifiedCount,
      recurrenceScope: scope,
    } satisfies DeleteJobResult;
  }

  const effectiveScope = scope === "THIS_VISIT_ONLY" ? "THIS" : scope;
  if ((effectiveScope === "FUTURE" || effectiveScope === "SERIES") && !isManualRecurringJob(existing as JobRecord)) {
    throw new Error("Scoped series deletes are only available for manual recurring jobs");
  }

  if ((effectiveScope === "FUTURE" || effectiveScope === "SERIES") && isManualRecurringJob(existing as JobRecord)) {
    if (existing.completed_at) {
      throw new Error("Completed visits can only be deleted individually");
    }

    const seriesId = getManualSeriesId(existing as JobRecord);
    const scheduledBoundary = coerceDbIsoDateTime(existing.scheduled_for, "scheduled_for");
    const skippedCompletedRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND recurring_series_id = ${seriesId}
        ${effectiveScope === "FUTURE" ? sql`AND scheduled_for >= ${scheduledBoundary}` : sql``}
        AND completed_at IS NOT NULL
    `;

    const result = await sql`
      DELETE FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND recurring_series_id = ${seriesId}
        ${effectiveScope === "FUTURE" ? sql`AND scheduled_for >= ${scheduledBoundary}` : sql``}
        AND completed_at IS NULL
    `;

    return {
      deleted: true,
      deletedCount: Number(result.count ?? 0),
      skippedCompletedCount: Number(skippedCompletedRows[0]?.count ?? 0),
      skippedModifiedCount: 0,
      recurrenceScope: effectiveScope,
    } satisfies DeleteJobResult;
  }

  const result = await sql`
    DELETE FROM admin_jobs
    WHERE organization_id = ${organizationId} AND id = ${jobId}
  `;

  return {
    deleted: Number(result.count ?? 0) > 0,
    deletedCount: Number(result.count ?? 0),
    skippedCompletedCount: 0,
    skippedModifiedCount: 0,
    recurrenceScope: scope ?? "NONE",
  } satisfies DeleteJobResult;
}
