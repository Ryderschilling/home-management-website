import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

type RetainerStatus = "ACTIVE" | "PAUSED" | "CANCELED";
type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";
type BillingModel =
  | "FIXED_RECURRING"
  | "USAGE_RECURRING"
  | "ONE_OFF_TIME"
  | "FLAT_ONE_OFF";
type RetainerTier = "BRONZE" | "SILVER" | "ELITE" | "CUSTOM";

const VALID_FREQUENCIES = new Set<Frequency>(["DAILY", "WEEKLY", "MONTHLY"]);
const VALID_STATUSES = new Set<RetainerStatus>(["ACTIVE", "PAUSED", "CANCELED"]);
const VALID_BILLING_MODELS = new Set<BillingModel>([
  "FIXED_RECURRING",
  "USAGE_RECURRING",
  "ONE_OFF_TIME",
  "FLAT_ONE_OFF",
]);
const VALID_TIERS = new Set<RetainerTier>(["BRONZE", "SILVER", "ELITE", "CUSTOM"]);

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

function normalizeBillingModel(
  value: unknown,
  fallback: BillingModel = "FIXED_RECURRING"
) {
  const billingModel = String(value ?? fallback).trim().toUpperCase() as BillingModel;
  if (!VALID_BILLING_MODELS.has(billingModel)) {
    throw new Error(
      "billingModel must be FIXED_RECURRING, USAGE_RECURRING, ONE_OFF_TIME, or FLAT_ONE_OFF"
    );
  }
  return billingModel;
}

function normalizeTier(value: unknown, fallback: RetainerTier = "BRONZE") {
  const rawTier = String(value ?? fallback).trim().toUpperCase();
  const tier = (rawTier === "STANDARD" ? "BRONZE" : rawTier) as RetainerTier;
  if (!VALID_TIERS.has(tier)) {
    throw new Error("tier must be BRONZE, SILVER, ELITE, or CUSTOM");
  }
  return tier;
}

function parsePositiveInteger(value: unknown, label: string, fallback = 1) {
  const parsed = Math.max(1, Number(value ?? fallback));
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${label} must be at least 1`);
  }
  return parsed;
}

function parseOptionalNonNegativeInteger(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be 0 or greater`);
  }
  return parsed;
}

function parseAmountCents(value: unknown, billingModel: BillingModel) {
  const parsed = Math.round(Number(value ?? 0));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("amountCents must be 0 or greater");
  }
  if (billingModel === "FIXED_RECURRING" && parsed <= 0) {
    throw new Error("amountCents must be greater than 0 for fixed recurring plans");
  }
  return parsed;
}

function parseOptionalTimestamp(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return date.toISOString();
}

function parseChecklistTemplate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return JSON.parse(trimmed) as unknown;
  }
  if (Array.isArray(value) || typeof value === "object") return value;
  throw new Error("checklistTemplateJson must be JSON");
}

function normalizeChecklistText(value: unknown) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).replace(/\r\n?/g, "\n").trim();
  return normalized ? normalized : null;
}

function extractChecklistItems(value: unknown) {
  const parsed = parseChecklistTemplate(value);
  if (!parsed) return [] as string[];

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (typeof parsed === "object") {
    const items = Array.isArray((parsed as { items?: unknown }).items)
      ? (parsed as { items: unknown[] }).items
      : [];
    return items
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  return [];
}

function deriveChecklistTemplateJsonFromText(text: string | null) {
  if (!text) return null;
  const items = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return items.length > 0 ? { items } : null;
}

function deriveChecklistTemplateText(
  checklistTemplateText: unknown,
  checklistTemplateJson: unknown
) {
  const text = normalizeChecklistText(checklistTemplateText);
  if (text) return text;
  return extractChecklistItems(checklistTemplateJson).join("\n");
}

function mapRetainerChecklistFields<T extends Record<string, unknown> | null>(
  retainer: T
) {
  if (!retainer) return null;

  return {
    ...retainer,
    checklist_template_text: deriveChecklistTemplateText(
      retainer.checklist_template_text,
      retainer.checklist_template_json
    ),
  };
}

function resolveChecklistTemplateFields({
  submittedText,
  submittedJson,
  currentText,
  currentJson,
}: {
  submittedText?: unknown;
  submittedJson?: unknown;
  currentText?: unknown;
  currentJson?: unknown;
}) {
  const hasSubmittedText = submittedText !== undefined;
  const hasSubmittedJson = submittedJson !== undefined;

  if (hasSubmittedText) {
    const checklistTemplateText = normalizeChecklistText(submittedText);
    const checklistTemplateJson =
      deriveChecklistTemplateJsonFromText(checklistTemplateText) ??
      (hasSubmittedJson
        ? parseChecklistTemplate(submittedJson)
        : parseChecklistTemplate(currentJson));

    return { checklistTemplateText, checklistTemplateJson };
  }

  if (hasSubmittedJson) {
    const checklistTemplateJson = parseChecklistTemplate(submittedJson);
    return {
      checklistTemplateText: deriveChecklistTemplateText(null, checklistTemplateJson) || null,
      checklistTemplateJson,
    };
  }

  const checklistTemplateText = deriveChecklistTemplateText(currentText, currentJson);

  return {
    checklistTemplateText: checklistTemplateText || null,
    checklistTemplateJson: parseChecklistTemplate(currentJson),
  };
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
      r.service_type,
      r.billing_model,
      r.visit_rate_cents,
      r.on_call_base_fee_cents,
      r.hourly_rate_cents,
      r.checklist_template_text,
      r.checklist_template_json,
      r.auto_generate_jobs,
      r.archived_at,
      r.status,
      r.notes,
      r.tier,
      r.created_at,
      r.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      COALESCE(job_summary.future_visit_count, 0) AS future_visit_count,
      COALESCE(job_summary.completed_visit_count, 0) AS completed_visit_count,
      job_summary.next_visit_at,
      job_summary.last_completed_at
    FROM admin_retainers r
    LEFT JOIN admin_clients c
      ON c.id = r.client_id
      AND c.organization_id = r.organization_id
    LEFT JOIN admin_properties p
      ON p.id = r.property_id
      AND p.organization_id = r.organization_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (
          WHERE j.scheduled_for >= NOW() AND UPPER(j.status) <> 'CANCELED'
        )::int AS future_visit_count,
        COUNT(*) FILTER (
          WHERE UPPER(j.status) = 'COMPLETED'
        )::int AS completed_visit_count,
        MIN(j.scheduled_for) FILTER (
          WHERE j.scheduled_for >= NOW() AND UPPER(j.status) <> 'CANCELED'
        ) AS next_visit_at,
        MAX(COALESCE(j.completed_at, j.scheduled_for)) FILTER (
          WHERE UPPER(j.status) = 'COMPLETED'
        ) AS last_completed_at
      FROM admin_jobs j
      WHERE j.organization_id = r.organization_id
        AND j.retainer_id = r.id
    ) AS job_summary ON true
    WHERE r.organization_id = ${organizationId} AND r.id = ${retainerId}
    LIMIT 1
  `;

  return mapRetainerChecklistFields(rows[0] ?? null);
}

export async function listRetainers(organizationId: string) {
  await ensureAdminTables();

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
      r.service_type,
      r.billing_model,
      r.visit_rate_cents,
      r.on_call_base_fee_cents,
      r.hourly_rate_cents,
      r.checklist_template_text,
      r.checklist_template_json,
      r.auto_generate_jobs,
      r.archived_at,
      r.status,
      r.notes,
      r.tier,
      r.created_at,
      r.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      COALESCE(job_summary.future_visit_count, 0) AS future_visit_count,
      COALESCE(job_summary.completed_visit_count, 0) AS completed_visit_count,
      job_summary.next_visit_at,
      job_summary.last_completed_at
    FROM admin_retainers r
    LEFT JOIN admin_clients c
      ON c.id = r.client_id
      AND c.organization_id = r.organization_id
    LEFT JOIN admin_properties p
      ON p.id = r.property_id
      AND p.organization_id = r.organization_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (
          WHERE j.scheduled_for >= NOW() AND UPPER(j.status) <> 'CANCELED'
        )::int AS future_visit_count,
        COUNT(*) FILTER (
          WHERE UPPER(j.status) = 'COMPLETED'
        )::int AS completed_visit_count,
        MIN(j.scheduled_for) FILTER (
          WHERE j.scheduled_for >= NOW() AND UPPER(j.status) <> 'CANCELED'
        ) AS next_visit_at,
        MAX(COALESCE(j.completed_at, j.scheduled_for)) FILTER (
          WHERE UPPER(j.status) = 'COMPLETED'
        ) AS last_completed_at
      FROM admin_jobs j
      WHERE j.organization_id = r.organization_id
        AND j.retainer_id = r.id
    ) AS job_summary ON true
    WHERE r.organization_id = ${organizationId}
    ORDER BY
      CASE
        WHEN r.archived_at IS NULL AND UPPER(r.status) = 'ACTIVE' THEN 0
        WHEN r.archived_at IS NULL AND UPPER(r.status) = 'PAUSED' THEN 1
        WHEN r.archived_at IS NULL THEN 2
        ELSE 3
      END,
      r.created_at DESC
  `;

  return rows.map((row) => mapRetainerChecklistFields(row));
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
  const billingModel = normalizeBillingModel(body.billingModel);
  const amountCents = parseAmountCents(body.amountCents, billingModel);
  const serviceType = asOptionalString(body.serviceType);

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
  const visitRateCents = parseOptionalNonNegativeInteger(body.visitRateCents, "visitRateCents");
  const onCallBaseFeeCents = parseOptionalNonNegativeInteger(
    body.onCallBaseFeeCents,
    "onCallBaseFeeCents"
  );
  const hourlyRateCents = parseOptionalNonNegativeInteger(body.hourlyRateCents, "hourlyRateCents");
  const tier = normalizeTier(body.tier);
  const { checklistTemplateText, checklistTemplateJson } = resolveChecklistTemplateFields({
    submittedText: body.checklistTemplateText,
    submittedJson: body.checklistTemplateJson,
  });
  const autoGenerateJobs =
    body.autoGenerateJobs === undefined ? true : Boolean(body.autoGenerateJobs);
  const archivedAt = parseOptionalTimestamp(body.archivedAt, "archivedAt");

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
      service_type,
      billing_model,
      visit_rate_cents,
      on_call_base_fee_cents,
      hourly_rate_cents,
      checklist_template_text,
      checklist_template_json,
      auto_generate_jobs,
      archived_at,
      status,
      notes,
      tier
    )
    VALUES (
      ${id},
      ${organizationId},
      ${clientId},
      ${propertyId},
      ${name},
      ${amountCents},
      ${billingFrequency},
      ${billingInterval},
      ${billingAnchorDate},
      ${serviceFrequency},
      ${serviceInterval},
      ${serviceAnchorDate},
      ${serviceType},
      ${billingModel},
      ${visitRateCents},
      ${onCallBaseFeeCents},
      ${hourlyRateCents},
      ${checklistTemplateText},
      ${checklistTemplateJson ? JSON.stringify(checklistTemplateJson) : null},
      ${autoGenerateJobs},
      ${archivedAt},
      ${status},
      ${notes},
      ${tier}
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
  const billingModel =
    body.billingModel !== undefined
      ? normalizeBillingModel(body.billingModel)
      : normalizeBillingModel(existing.billing_model);
  const amountCents =
    body.amountCents !== undefined
      ? parseAmountCents(body.amountCents, billingModel)
      : parseAmountCents(existing.amount_cents, billingModel);
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
  const serviceType =
    body.serviceType !== undefined ? asOptionalString(body.serviceType) : existing.service_type;
  const visitRateCents =
    body.visitRateCents !== undefined
      ? parseOptionalNonNegativeInteger(body.visitRateCents, "visitRateCents")
      : (existing.visit_rate_cents as number | null);
  const onCallBaseFeeCents =
    body.onCallBaseFeeCents !== undefined
      ? parseOptionalNonNegativeInteger(body.onCallBaseFeeCents, "onCallBaseFeeCents")
      : (existing.on_call_base_fee_cents as number | null);
  const hourlyRateCents =
    body.hourlyRateCents !== undefined
      ? parseOptionalNonNegativeInteger(body.hourlyRateCents, "hourlyRateCents")
      : (existing.hourly_rate_cents as number | null);
  const { checklistTemplateText, checklistTemplateJson } = resolveChecklistTemplateFields({
    submittedText: body.checklistTemplateText,
    submittedJson: body.checklistTemplateJson,
    currentText: existing.checklist_template_text,
    currentJson: existing.checklist_template_json,
  });
  const autoGenerateJobs =
    body.autoGenerateJobs !== undefined
      ? Boolean(body.autoGenerateJobs)
      : Boolean(existing.auto_generate_jobs);
  const archivedAt =
    body.archivedAt !== undefined
      ? parseOptionalTimestamp(body.archivedAt, "archivedAt")
      : (existing.archived_at as string | null);
  const tier =
    body.tier !== undefined ? normalizeTier(body.tier) : normalizeTier(existing.tier);

  await assertClientExists(organizationId, clientId);
  await assertPropertyExists(organizationId, propertyId, clientId);

  await sql`
    UPDATE admin_retainers
    SET
      client_id = ${clientId},
      property_id = ${propertyId},
      name = ${name},
      amount_cents = ${amountCents},
      billing_frequency = ${billingFrequency},
      billing_interval = ${billingInterval},
      billing_anchor_date = ${billingAnchorDate},
      service_frequency = ${serviceFrequency},
      service_interval = ${serviceInterval},
      service_anchor_date = ${serviceAnchorDate},
      service_type = ${serviceType},
      billing_model = ${billingModel},
      visit_rate_cents = ${visitRateCents},
      on_call_base_fee_cents = ${onCallBaseFeeCents},
      hourly_rate_cents = ${hourlyRateCents},
      checklist_template_text = ${checklistTemplateText},
      checklist_template_json = ${checklistTemplateJson ? JSON.stringify(checklistTemplateJson) : null},
      auto_generate_jobs = ${autoGenerateJobs},
      archived_at = ${archivedAt},
      status = ${status},
      notes = ${notes},
      tier = ${tier},
      updated_at = NOW()
    WHERE id = ${id} AND organization_id = ${organizationId}
  `;

  return fetchRetainerRecord(organizationId, id);
}

export async function deleteRetainer(organizationId: string, retainerId: string) {
  await ensureAdminTables();

  const existing = await fetchRetainerRecord(organizationId, retainerId);
  if (!existing) return null;

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

function resolveGeneratedVisitPrice(retainer: Record<string, unknown>) {
  const billingModel = normalizeBillingModel(retainer.billing_model);
  if (billingModel === "USAGE_RECURRING") {
    const visitRate = Number(retainer.visit_rate_cents ?? 0);
    return Number.isFinite(visitRate) && visitRate >= 0 ? visitRate : null;
  }
  return null;
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

  const isGenerationEnabled =
    String(retainer.status).toUpperCase() === "ACTIVE" &&
    !retainer.archived_at &&
    Boolean(retainer.auto_generate_jobs);

  if (!isGenerationEnabled) {
    await sql`
      DELETE FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND retainer_id = ${retainerId}
        AND source_type = 'PLAN'
        AND completed_at IS NULL
        AND scheduled_for >= NOW()
    `;
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
  const generatedVisitPrice = resolveGeneratedVisitPrice(
    retainer as Record<string, unknown>
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
          ${generatedVisitPrice},
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
