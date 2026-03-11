import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

function addInterval(date: Date, frequency: string, interval: number) {
  const d = new Date(date);

  if (frequency === "DAILY") d.setDate(d.getDate() + interval);
  else if (frequency === "WEEKLY") d.setDate(d.getDate() + interval * 7);
  else if (frequency === "MONTHLY") d.setMonth(d.getMonth() + interval);
  else throw new Error("Invalid recurrence frequency");

  return d;
}

export async function listJobs(organizationId: string) {
  await ensureAdminTables();

  return sql`
    SELECT
      j.id,
      j.organization_id,
      j.client_id,
      j.property_id,
      j.service_id,
      j.order_id,
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
      j.created_at,
      j.updated_at,
      COALESCE(photo_summary.photo_count, 0) AS photo_count,
      COALESCE(photo_summary.photos, '[]'::json) AS photos
    FROM admin_jobs j
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
    ORDER BY j.scheduled_for ASC
  `;
}

export async function getJobById(organizationId: string, jobId: string) {
  await ensureAdminTables();

  const rows = await sql`
    SELECT
      j.id,
      j.organization_id,
      j.client_id,
      j.property_id,
      j.service_id,
      j.order_id,
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
      j.created_at,
      j.updated_at,
      COALESCE(photo_summary.photo_count, 0) AS photo_count,
      COALESCE(photo_summary.photos, '[]'::json) AS photos
    FROM admin_jobs j
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

export async function createJob(
  organizationId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const clientId = asOptionalString(body.clientId);
  const propertyId = asOptionalString(body.propertyId);
  const serviceId = asOptionalString(body.serviceId);
  const notes = asOptionalString(body.notes);

  const scheduledForRaw = asNonEmptyString(body.scheduledFor, "scheduledFor");
  const scheduledFor = new Date(scheduledForRaw);
  if (Number.isNaN(scheduledFor.getTime())) {
    throw new Error("Invalid scheduledFor");
  }

  let title = asOptionalString(body.title);
  let priceCents =
    body.priceCents === undefined || body.priceCents === null || body.priceCents === ""
      ? null
      : Number(body.priceCents);

  if (priceCents !== null && (!Number.isFinite(priceCents) || priceCents < 0)) {
    throw new Error("Invalid priceCents");
  }

  const hours =
    body.hours === undefined || body.hours === null || body.hours === ""
      ? null
      : Number(body.hours);

  if (hours !== null && (!Number.isFinite(hours) || hours < 0)) {
    throw new Error("Invalid hours");
  }

  if (serviceId) {
    const serviceRows = await sql`
      SELECT id, name, unit_price_cents
      FROM admin_services
      WHERE id = ${serviceId} AND organization_id = ${organizationId}
      LIMIT 1
    `;

    const service = serviceRows[0];
    if (!service) throw new Error("Selected service not found");

    if (!title) title = service.name;
    if (priceCents === null) priceCents = service.unit_price_cents;
  }

  if (!title) {
    throw new Error("Title is required when no service is selected");
  }

  const recurrenceEnabled = Boolean(body.recurrenceEnabled);
  const recurrenceFrequency = recurrenceEnabled
    ? asNonEmptyString(body.recurrenceFrequency, "recurrenceFrequency")
    : null;

  const recurrenceInterval = recurrenceEnabled
    ? Math.max(1, Number(body.recurrenceInterval ?? 1))
    : null;

  const recurrenceEndDate =
    recurrenceEnabled && body.recurrenceEndDate
      ? new Date(String(body.recurrenceEndDate))
      : null;

  if (recurrenceEnabled && recurrenceEndDate && Number.isNaN(recurrenceEndDate.getTime())) {
    throw new Error("Invalid recurrenceEndDate");
  }

  const createdRows = await sql`
    INSERT INTO admin_jobs (
      id,
      organization_id,
      client_id,
      property_id,
      service_id,
      title,
      notes,
      status,
      scheduled_for,
      hours_numeric,
      price_cents,
      recurrence_enabled,
      recurrence_frequency,
      recurrence_interval,
      recurrence_end_date
    )
    VALUES (
      ${id},
      ${organizationId},
      ${clientId},
      ${propertyId},
      ${serviceId},
      ${title},
      ${notes},
      ${"SCHEDULED"},
      ${scheduledFor.toISOString()},
      ${hours},
      ${priceCents},
      ${recurrenceEnabled},
      ${recurrenceFrequency},
      ${recurrenceInterval},
      ${recurrenceEndDate ? recurrenceEndDate.toISOString() : null}
    )
    RETURNING *
  `;

  const parent = createdRows[0];

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
          title,
          notes,
          status,
          scheduled_for,
          hours_numeric,
          price_cents,
          recurrence_enabled,
          recurrence_frequency,
          recurrence_interval,
          recurrence_end_date,
          parent_job_id
        )
        VALUES (
          ${crypto.randomUUID()},
          ${organizationId},
          ${clientId},
          ${propertyId},
          ${serviceId},
          ${title},
          ${notes},
          ${"SCHEDULED"},
          ${cursor.toISOString()},
          ${hours},
          ${priceCents},
          ${true},
          ${recurrenceFrequency},
          ${recurrenceInterval},
          ${recurrenceEndDate.toISOString()},
          ${parent.id}
        )
      `;

      safety += 1;
    }
  }

  return parent;
}

export async function updateJob(
  organizationId: string,
  jobId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existingRows = await sql`
    SELECT *
    FROM admin_jobs
    WHERE organization_id = ${organizationId} AND id = ${jobId}
    LIMIT 1
  `;

  const existing = existingRows[0];
  if (!existing) return null;

  const nextStatus =
    typeof body.status === "string" && body.status.trim()
      ? body.status.trim().toUpperCase()
      : existing.status;

  const nextNotes =
    body.notes === undefined
      ? existing.notes
      : typeof body.notes === "string"
      ? body.notes.trim() || null
      : null;

  const nextTitle =
    body.title === undefined
      ? existing.title
      : typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : existing.title;

  const nextScheduledFor =
    body.scheduledFor === undefined || body.scheduledFor === null || body.scheduledFor === ""
      ? existing.scheduled_for
      : new Date(String(body.scheduledFor)).toISOString();

  const nextPriceCents =
    body.priceCents === undefined || body.priceCents === null || body.priceCents === ""
      ? existing.price_cents
      : Number(body.priceCents);

  if (
    nextPriceCents !== null &&
    nextPriceCents !== undefined &&
    (!Number.isFinite(nextPriceCents) || nextPriceCents < 0)
  ) {
    throw new Error("Invalid priceCents");
  }

  const nextHours =
    body.hours === undefined || body.hours === null || body.hours === ""
      ? existing.hours_numeric
      : Number(body.hours);

  if (
    nextHours !== null &&
    nextHours !== undefined &&
    (!Number.isFinite(nextHours) || nextHours < 0)
  ) {
    throw new Error("Invalid hours");
  }

  const completedAt =
    nextStatus === "COMPLETED"
      ? existing.completed_at ?? new Date().toISOString()
      : nextStatus === "CANCELED"
      ? null
      : existing.completed_at;

  const updatedRows = await sql`
    UPDATE admin_jobs
    SET
      title = ${nextTitle},
      notes = ${nextNotes},
      status = ${nextStatus},
      scheduled_for = ${nextScheduledFor},
      hours_numeric = ${nextHours},
      price_cents = ${nextPriceCents},
      completed_at = ${completedAt},
      updated_at = NOW()
    WHERE organization_id = ${organizationId} AND id = ${jobId}
    RETURNING *
  `;

  return updatedRows[0] ?? null;
}