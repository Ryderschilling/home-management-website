import Stripe from "stripe";

import {
  EDITABLE_INVOICE_STATUSES,
  INVOICE_GROUPS,
  normalizeInvoiceStatus,
  type InvoiceStatus,
} from "@/lib/invoices";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { stripe } from "@/lib/server/stripe";
import { asOptionalString } from "@/lib/server/validation";

type LineType = "PLAN_BASE" | "JOB_EXTRA" | "MANUAL";

type InvoiceFilters = {
  clientId?: string | null;
  status?: string | null;
  query?: string | null;
};

type DraftLineItemInput = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  lineType: LineType;
  jobId?: string | null;
  retainerId?: string | null;
};

type ManualLineItemInput = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

type InvoiceEventSource = "PORTAL" | "STRIPE_WEBHOOK" | "SCHEDULER" | "SYSTEM";

type StripeSyncContext = {
  source: InvoiceEventSource;
  eventType: string;
  message?: string | null;
  stripeEventId?: string | null;
  occurredAt?: Date | null;
  preserveSchedule?: boolean;
  forceStatus?: InvoiceStatus | null;
};

type DashboardJobRow = {
  id: string;
  client_id?: string | null;
  client_name?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  title: string;
  scheduled_for?: string | null;
  completed_at?: string | null;
  price_cents?: number | null;
};

type InvoiceRecord = Record<string, unknown> & {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  retainer_id?: string | null;
  invoice_number?: string | null;
  status: string;
  stripe_customer_id?: string | null;
  stripe_invoice_id?: string | null;
  stripe_status?: string | null;
  send_at?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  subtotal_cents?: number | null;
  tax_cents?: number | null;
  total_cents?: number | null;
  amount_paid_cents?: number | null;
  amount_remaining_cents?: number | null;
  currency?: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf_url?: string | null;
  memo?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  sent_at?: string | null;
  paid_at?: string | null;
  finalized_at?: string | null;
  last_synced_at?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address_text?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  plan_name?: string | null;
  line_items: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
};

const DEFAULT_CURRENCY = "usd";
const DEFAULT_DUE_DAYS = 7;
const NEEDS_INVOICE_STALE_DAYS = 7;
const SCHEDULE_SOON_HOURS = 24;

function parseDateOnly(value: unknown, label: string) {
  const stringValue = String(value ?? "").trim();
  if (!stringValue) return null;

  const date = new Date(`${stringValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`);
  }

  return date.toISOString().slice(0, 10);
}

function parseOptionalDateTime(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`);
  }

  return date;
}

function parseOptionalInteger(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${label}`);
  }
  return parsed;
}

function parseQuantity(value: unknown) {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Line item quantity must be greater than 0");
  }
  return parsed;
}

function addDaysToDateOnly(value: string, days: number) {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    throw new Error("Invalid date");
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toDateOnly(value: unknown) {
  if (!value) return null;
  const date =
    value instanceof Date ? value : typeof value === "number" ? new Date(value * 1000) : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function toIsoString(value: unknown) {
  if (!value) return null;
  const date =
    value instanceof Date ? value : typeof value === "number" ? new Date(value * 1000) : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function asJsonArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value as T[];
}

function sumStripeTax(invoice: Stripe.Invoice) {
  const taxAmounts = (
    invoice as Stripe.Invoice & {
      total_tax_amounts?: Array<{ amount?: number | null }>;
    }
  ).total_tax_amounts ?? [];

  return taxAmounts.reduce((sum, item) => {
    return sum + Math.max(0, Number(item.amount ?? 0));
  }, 0);
}

function deriveDraftStatus(clientEmail: string | null, totalCents: number): InvoiceStatus {
  if (!clientEmail || totalCents <= 0) return "DRAFT";
  return "READY_TO_SEND";
}

function deriveStatusFromStripeInvoice(
  invoice: Stripe.Invoice,
  existingStatus: InvoiceStatus,
  sendAt: string | null,
  context: StripeSyncContext
): InvoiceStatus {
  if (context.forceStatus) return context.forceStatus;
  if (context.eventType === "invoice.finalization_failed") return "FINALIZATION_FAILED";

  if (invoice.status === "paid") {
    return "PAID";
  }

  if (invoice.status === "void") {
    return "VOID";
  }

  if (invoice.status === "open" || invoice.status === "uncollectible") {
    const dueDate = toDateOnly(invoice.due_date);
    const amountRemaining = Number(invoice.amount_remaining ?? 0);
    if (dueDate && amountRemaining > 0 && dueDate < new Date().toISOString().slice(0, 10)) {
      return "OVERDUE";
    }
    return "OUTSTANDING";
  }

  if (invoice.status === "draft") {
    if (context.preserveSchedule && sendAt) return "SCHEDULED";
    if (existingStatus === "SCHEDULED" && sendAt) return "SCHEDULED";
    return "READY_TO_SEND";
  }

  return existingStatus;
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
  clientId?: string | null
) {
  if (!propertyId) return null;
  const rows = await sql`
    SELECT id, client_id
    FROM admin_properties
    WHERE organization_id = ${organizationId} AND id = ${propertyId}
    LIMIT 1
  `;

  const property = rows[0] ?? null;
  if (!property) throw new Error("Selected property not found");
  if (clientId && property.client_id && property.client_id !== clientId) {
    throw new Error("Selected property does not belong to the selected client");
  }
  return property;
}

async function fetchClientRecord(organizationId: string, clientId: string) {
  const rows = await sql`
    SELECT
      id,
      name,
      email,
      phone,
      address_text,
      stripe_customer_id
    FROM admin_clients
    WHERE organization_id = ${organizationId} AND id = ${clientId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function fetchRetainer(organizationId: string, retainerId: string | null) {
  if (!retainerId) return null;

  const rows = await sql`
    SELECT id, client_id, property_id, name, amount_cents
    FROM admin_retainers
    WHERE organization_id = ${organizationId} AND id = ${retainerId}
    LIMIT 1
  `;

  const retainer = rows[0] ?? null;
  if (!retainer) throw new Error("Selected plan not found");
  return retainer;
}

async function generateInvoiceNumber(organizationId: string) {
  const year = new Date().getUTCFullYear();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM admin_invoices
    WHERE organization_id = ${organizationId}
      AND DATE_PART('year', created_at) = ${year}
  `;

  const count = Number(rows[0]?.count ?? 0) + 1;
  return `INV-${year}-${String(count).padStart(4, "0")}`;
}

async function refreshInvoiceAging(organizationId: string) {
  await sql`
    UPDATE admin_invoices
    SET
      status = CASE
        WHEN COALESCE(amount_remaining_cents, total_cents) <= 0 THEN 'PAID'
        WHEN due_date IS NOT NULL
          AND due_date < CURRENT_DATE
          AND COALESCE(amount_remaining_cents, total_cents) > 0
          THEN 'OVERDUE'
        ELSE 'OUTSTANDING'
      END,
      updated_at = NOW()
    WHERE organization_id = ${organizationId}
      AND UPPER(status) IN ('OUTSTANDING', 'OVERDUE')
  `;
}

async function fetchInvoiceEvents(organizationId: string, invoiceId: string) {
  return sql`
    SELECT
      id,
      organization_id,
      invoice_id,
      source,
      event_type,
      stripe_event_id,
      message,
      payload_json,
      created_at
    FROM admin_invoice_events
    WHERE organization_id = ${organizationId}
      AND invoice_id = ${invoiceId}
    ORDER BY created_at DESC
  `;
}

async function fetchInvoiceBaseRecord(
  organizationId: string,
  invoiceId: string
): Promise<Partial<InvoiceRecord> | null> {
  const rows = await sql`
    SELECT
      i.id,
      i.organization_id,
      i.client_id,
      i.property_id,
      i.retainer_id,
      i.invoice_number,
      i.status,
      i.stripe_customer_id,
      i.stripe_invoice_id,
      i.stripe_status,
      i.send_at,
      i.period_start,
      i.period_end,
      i.issue_date,
      i.due_date,
      i.subtotal_cents,
      i.tax_cents,
      i.total_cents,
      i.amount_paid_cents,
      i.amount_remaining_cents,
      i.currency,
      i.hosted_invoice_url,
      i.invoice_pdf_url,
      i.notes,
      i.notes AS memo,
      i.internal_notes,
      i.sent_at,
      i.paid_at,
      i.finalized_at,
      i.last_synced_at,
      i.created_at,
      i.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      c.address_text AS client_address_text,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      r.name AS plan_name,
      COALESCE(line_items.items, '[]'::json) AS line_items,
      COALESCE(line_items.line_item_count, 0) AS line_item_count
    FROM admin_invoices i
    LEFT JOIN admin_clients c
      ON c.id = i.client_id
      AND c.organization_id = i.organization_id
    LEFT JOIN admin_properties p
      ON p.id = i.property_id
      AND p.organization_id = i.organization_id
    LEFT JOIN admin_retainers r
      ON r.id = i.retainer_id
      AND r.organization_id = i.organization_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS line_item_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', li.id,
              'job_id', li.job_id,
              'retainer_id', li.retainer_id,
              'description', li.description,
              'quantity', li.quantity,
              'unit_price_cents', li.unit_price_cents,
              'line_total_cents', li.line_total_cents,
              'line_type', li.line_type,
              'job_title', j.title,
              'service_id', j.service_id,
              'service_name', s.name,
              'scheduled_for', j.scheduled_for,
              'created_at', li.created_at
            )
            ORDER BY li.created_at ASC
          ),
          '[]'::json
        ) AS items
      FROM admin_invoice_line_items li
      LEFT JOIN admin_jobs j
        ON j.id = li.job_id
        AND j.organization_id = li.organization_id
      LEFT JOIN admin_services s
        ON s.id = j.service_id
        AND s.organization_id = li.organization_id
      WHERE li.organization_id = i.organization_id
        AND li.invoice_id = i.id
    ) AS line_items ON true
    WHERE i.organization_id = ${organizationId} AND i.id = ${invoiceId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function fetchInvoiceRecord(
  organizationId: string,
  invoiceId: string,
  options: { includeEvents?: boolean } = {}
): Promise<InvoiceRecord | null> {
  const base = await fetchInvoiceBaseRecord(organizationId, invoiceId);
  if (!base) return null;

  if (!options.includeEvents) {
    return {
      ...base,
      line_items: asJsonArray(base.line_items),
      events: [],
    } as unknown as InvoiceRecord;
  }

  const events = await fetchInvoiceEvents(organizationId, invoiceId);
  return {
    ...base,
    line_items: asJsonArray(base.line_items),
    events: events as Array<Record<string, unknown>>,
  } as unknown as InvoiceRecord;
}

async function recordInvoiceEvent(
  organizationId: string,
  invoiceId: string,
  input: {
    source: InvoiceEventSource;
    eventType: string;
    message?: string | null;
    payload?: unknown;
    stripeEventId?: string | null;
  }
) {
  await sql`
    INSERT INTO admin_invoice_events (
      id,
      organization_id,
      invoice_id,
      source,
      event_type,
      stripe_event_id,
      message,
      payload_json
    )
    VALUES (
      ${crypto.randomUUID()},
      ${organizationId},
      ${invoiceId},
      ${input.source},
      ${input.eventType},
      ${input.stripeEventId ?? null},
      ${input.message ?? null},
      ${input.payload ? JSON.stringify(input.payload) : null}
    )
  `;
}

async function buildLineItems(
  organizationId: string,
  input: {
    clientId: string;
    propertyId: string | null;
    retainerId: string | null;
    includePlanBase: boolean;
    jobIds: string[];
    manualLineItems: ManualLineItemInput[];
  }
) {
  const retainer = await fetchRetainer(organizationId, input.retainerId);

  if (retainer) {
    if (retainer.client_id && retainer.client_id !== input.clientId) {
      throw new Error("Selected plan does not belong to the selected client");
    }
    if (input.propertyId && retainer.property_id && retainer.property_id !== input.propertyId) {
      throw new Error("Selected plan does not belong to the selected property");
    }
  }

  const lineItems: DraftLineItemInput[] = [];

  if (retainer && input.includePlanBase) {
    const amountCents = Math.max(0, Number(retainer.amount_cents ?? 0));
    lineItems.push({
      description: `${retainer.name} service plan`,
      quantity: 1,
      unitPriceCents: amountCents,
      lineTotalCents: amountCents,
      lineType: "PLAN_BASE",
      retainerId: retainer.id,
    });
  }

  if (input.jobIds.length > 0) {
    const jobs = await sql`
      SELECT
        j.id,
        j.client_id,
        j.property_id,
        j.retainer_id,
        j.title,
        j.scheduled_for,
        j.completed_at,
        j.price_cents,
        s.unit_price_cents AS service_unit_price_cents
      FROM admin_jobs j
      LEFT JOIN admin_services s
        ON s.id = j.service_id
        AND s.organization_id = j.organization_id
      WHERE j.organization_id = ${organizationId}
        AND j.id = ANY(${input.jobIds})
      ORDER BY COALESCE(j.completed_at, j.scheduled_for) ASC
    `;

    if (jobs.length !== input.jobIds.length) {
      throw new Error("One or more selected jobs could not be found");
    }

    for (const job of jobs) {
      if (job.client_id && job.client_id !== input.clientId) {
        throw new Error("Selected billable job does not belong to the selected client");
      }
      if (input.propertyId && job.property_id && job.property_id !== input.propertyId) {
        throw new Error("Selected billable job does not belong to the selected property");
      }
      if (retainer && job.retainer_id && job.retainer_id !== retainer.id) {
        throw new Error("Selected billable job does not belong to the selected plan");
      }

      const unitPriceCents = Math.max(
        0,
        Number(job.price_cents ?? job.service_unit_price_cents ?? 0)
      );
      const referenceDate = toDateOnly(job.completed_at ?? job.scheduled_for);
      lineItems.push({
        description: `${job.title} ${referenceDate ? `on ${referenceDate}` : ""}`.trim(),
        quantity: 1,
        unitPriceCents,
        lineTotalCents: unitPriceCents,
        lineType: "JOB_EXTRA",
        jobId: job.id,
        retainerId: job.retainer_id,
      });
    }
  }

  for (const item of input.manualLineItems) {
    if (!item.description.trim()) continue;

    lineItems.push({
      description: item.description.trim(),
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: Math.round(item.quantity * item.unitPriceCents),
      lineType: "MANUAL",
    });
  }

  if (lineItems.length === 0) {
    throw new Error("Invoice must include at least one line item");
  }

  return { retainer, lineItems };
}

function parseJobIds(body: Record<string, unknown>) {
  const requestedJobIds = Array.isArray(body.jobIds)
    ? body.jobIds.map((value) => String(value ?? "").trim()).filter(Boolean)
    : [];

  const uniqueJobIds = Array.from(new Set(requestedJobIds));
  if (uniqueJobIds.length !== requestedJobIds.length) {
    throw new Error("Duplicate billable jobs are not allowed on the same invoice");
  }

  return uniqueJobIds;
}

function parseManualLineItems(body: Record<string, unknown>) {
  const manualItems = Array.isArray(body.manualLineItems) ? body.manualLineItems : [];
  const parsed: ManualLineItemInput[] = [];

  for (const rawItem of manualItems) {
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) continue;
    const item = rawItem as Record<string, unknown>;
    const description = String(item.description ?? "").trim();
    if (!description) continue;

    const quantity = parseQuantity(item.quantity);
    const unitPriceCents = parseOptionalInteger(item.unitPriceCents, "unitPriceCents");

    if (unitPriceCents === null) {
      throw new Error("Manual line items require unitPriceCents");
    }

    parsed.push({
      description,
      quantity,
      unitPriceCents,
    });
  }

  return parsed;
}

async function ensureEditableInvoice(organizationId: string, invoiceId: string) {
  const existing = await fetchInvoiceBaseRecord(organizationId, invoiceId);
  if (!existing) return null;

  const status = normalizeInvoiceStatus(existing.status);
  if (!EDITABLE_INVOICE_STATUSES.has(status)) {
    throw new Error("Only draft invoices can be edited");
  }

  return existing;
}

async function saveDraftInvoice(
  organizationId: string,
  body: Record<string, unknown>,
  existingInvoiceId?: string
) {
  await ensureAdminTables();

  const existing = existingInvoiceId
    ? await ensureEditableInvoice(organizationId, existingInvoiceId)
    : null;

  const retainerId =
    body.retainerId !== undefined
      ? asOptionalString(body.retainerId)
      : (existing?.retainer_id as string | null) ?? null;
  const retainer = await fetchRetainer(organizationId, retainerId);

  const clientId =
    body.clientId !== undefined
      ? asOptionalString(body.clientId)
      : ((existing?.client_id as string | null) ?? retainer?.client_id ?? null);

  if (!clientId) {
    throw new Error("clientId is required");
  }

  await assertClientExists(organizationId, clientId);

  const propertyId =
    body.propertyId !== undefined
      ? asOptionalString(body.propertyId)
      : ((existing?.property_id as string | null) ?? retainer?.property_id ?? null);

  await assertPropertyExists(organizationId, propertyId, clientId);

  const invoiceNumber =
    body.invoiceNumber !== undefined
      ? asOptionalString(body.invoiceNumber) ?? (existing?.invoice_number as string | null)
      : ((existing?.invoice_number as string | null) ?? (await generateInvoiceNumber(organizationId)));

  if (!invoiceNumber) {
    throw new Error("invoiceNumber is required");
  }

  const issueDate =
    body.issueDate !== undefined
      ? parseDateOnly(body.issueDate, "issueDate")
      : ((existing?.issue_date as string | null) ?? new Date().toISOString().slice(0, 10));

  if (!issueDate) {
    throw new Error("issueDate is required");
  }

  const dueDate =
    body.dueDate !== undefined
      ? parseDateOnly(body.dueDate, "dueDate")
      : ((existing?.due_date as string | null) ?? addDaysToDateOnly(issueDate, DEFAULT_DUE_DAYS));

  const periodStart =
    body.periodStart !== undefined
      ? parseDateOnly(body.periodStart, "periodStart")
      : (existing?.period_start as string | null);
  const periodEnd =
    body.periodEnd !== undefined
      ? parseDateOnly(body.periodEnd, "periodEnd")
      : (existing?.period_end as string | null);

  const memo =
    body.memo !== undefined
      ? asOptionalString(body.memo)
      : body.notes !== undefined
        ? asOptionalString(body.notes)
        : ((existing?.memo as string | null) ?? null);
  const internalNotes =
    body.internalNotes !== undefined
      ? asOptionalString(body.internalNotes)
      : ((existing?.internal_notes as string | null) ?? null);
  const currency =
    (asOptionalString(body.currency) ?? (existing?.currency as string | null) ?? DEFAULT_CURRENCY).toLowerCase();
  const includePlanBase = body.includePlanBase === undefined ? true : Boolean(body.includePlanBase);

  const jobIds = parseJobIds(body);
  const manualLineItems = parseManualLineItems(body);
  const { lineItems } = await buildLineItems(organizationId, {
    clientId,
    propertyId,
    retainerId,
    includePlanBase,
    jobIds,
    manualLineItems,
  });

  const subtotalCents = lineItems.reduce((sum, item) => sum + Math.max(0, item.lineTotalCents), 0);
  const taxCents = 0;
  const totalCents = subtotalCents + taxCents;
  const client = await fetchClientRecord(organizationId, clientId);
  if (!client) {
    throw new Error("Selected client not found");
  }

  const status = deriveDraftStatus(
    asOptionalString(client.email),
    totalCents
  );
  const invoiceId = existingInvoiceId ?? crypto.randomUUID();
  const amountPaidCents = existing ? Number(existing.amount_paid_cents ?? 0) : 0;
  const amountRemainingCents = Math.max(0, totalCents - amountPaidCents);
  const existingStripeInvoiceId = existing ? asOptionalString(existing.stripe_invoice_id) : null;
  const existingStripeStatus = existing ? asOptionalString(existing.stripe_status) : null;

  await sql.begin(async (tx) => {
    if (jobIds.length > 0) {
      await tx`
        SELECT id
        FROM admin_jobs
        WHERE organization_id = ${organizationId}
          AND id = ANY(${jobIds})
        ORDER BY id
        FOR UPDATE
      `;

      const existingExtraJobInvoices = await tx`
        SELECT DISTINCT ON (li.job_id)
          li.job_id,
          i.invoice_number
        FROM admin_invoice_line_items li
        INNER JOIN admin_invoices i
          ON i.id = li.invoice_id
          AND i.organization_id = li.organization_id
        WHERE li.organization_id = ${organizationId}
          AND li.line_type = 'JOB_EXTRA'
          AND li.job_id = ANY(${jobIds})
          AND UPPER(i.status) <> 'VOID'
          ${existingInvoiceId ? sql`AND i.id <> ${existingInvoiceId}` : sql``}
        ORDER BY li.job_id, i.created_at DESC
      `;

      if (existingExtraJobInvoices.length > 0) {
        const conflict = existingExtraJobInvoices[0];
        throw new Error(
          `Job ${String(conflict.job_id).slice(0, 8)} is already invoiced on ${conflict.invoice_number}`
        );
      }
    }

    if (existing) {
      await tx`
        UPDATE admin_invoices
        SET
          client_id = ${clientId},
          property_id = ${propertyId},
          retainer_id = ${retainerId},
          invoice_number = ${invoiceNumber},
          status = ${status},
          send_at = ${null},
          period_start = ${periodStart},
          period_end = ${periodEnd},
          issue_date = ${issueDate},
          due_date = ${dueDate},
          subtotal_cents = ${subtotalCents},
          tax_cents = ${taxCents},
          total_cents = ${totalCents},
          amount_remaining_cents = ${amountRemainingCents},
          currency = ${currency},
          notes = ${memo},
          internal_notes = ${internalNotes},
          stripe_invoice_id = ${status === "READY_TO_SEND" ? existingStripeInvoiceId : null},
          stripe_status = ${status === "READY_TO_SEND" ? existingStripeStatus : null},
          hosted_invoice_url = ${null},
          invoice_pdf_url = ${null},
          sent_at = ${null},
          paid_at = ${null},
          finalized_at = ${null},
          last_synced_at = ${null},
          updated_at = NOW()
        WHERE organization_id = ${organizationId} AND id = ${invoiceId}
      `;

      await tx`
        DELETE FROM admin_invoice_line_items
        WHERE organization_id = ${organizationId}
          AND invoice_id = ${invoiceId}
      `;
    } else {
      await tx`
        INSERT INTO admin_invoices (
          id,
          organization_id,
          client_id,
          property_id,
          retainer_id,
          invoice_number,
          status,
          period_start,
          period_end,
          issue_date,
          due_date,
          subtotal_cents,
          tax_cents,
          total_cents,
          amount_paid_cents,
          amount_remaining_cents,
          currency,
          notes,
          internal_notes
        )
        VALUES (
          ${invoiceId},
          ${organizationId},
          ${clientId},
          ${propertyId},
          ${retainerId},
          ${invoiceNumber},
          ${status},
          ${periodStart},
          ${periodEnd},
          ${issueDate},
          ${dueDate},
          ${subtotalCents},
          ${taxCents},
          ${totalCents},
          ${0},
          ${totalCents},
          ${currency},
          ${memo},
          ${internalNotes}
        )
      `;
    }

    for (const item of lineItems) {
      await tx`
        INSERT INTO admin_invoice_line_items (
          id,
          invoice_id,
          organization_id,
          job_id,
          retainer_id,
          description,
          quantity,
          unit_price_cents,
          line_total_cents,
          line_type
        )
        VALUES (
          ${crypto.randomUUID()},
          ${invoiceId},
          ${organizationId},
          ${item.jobId ?? null},
          ${item.retainerId ?? null},
          ${item.description},
          ${item.quantity},
          ${item.unitPriceCents},
          ${item.lineTotalCents},
          ${item.lineType}
        )
      `;
    }
  });

  await recordInvoiceEvent(organizationId, invoiceId, {
    source: "PORTAL",
    eventType: existing ? "invoice.draft_updated" : "invoice.draft_created",
    message: existing ? "Draft invoice updated in the portal." : "Draft invoice created in the portal.",
    payload: {
      clientId,
      propertyId,
      lineItemCount: lineItems.length,
      totalCents,
      status,
    },
  });

  return fetchInvoiceRecord(organizationId, invoiceId, { includeEvents: true });
}

async function ensureStripeCustomerForClient(
  organizationId: string,
  clientId: string,
  invoiceRecord: Record<string, unknown>
) {
  const client = await fetchClientRecord(organizationId, clientId);
  if (!client) {
    throw new Error("Selected client not found");
  }

  const existingCustomerId = asOptionalString(client.stripe_customer_id);
  if (existingCustomerId) {
    await sql`
      UPDATE admin_invoices
      SET stripe_customer_id = ${existingCustomerId}, updated_at = NOW()
      WHERE organization_id = ${organizationId}
        AND id = ${invoiceRecord.id as string}
    `;

    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    name: asOptionalString(client.name) ?? undefined,
    email: asOptionalString(client.email) ?? undefined,
    phone: asOptionalString(client.phone) ?? undefined,
    description: `Portal client ${clientId}`,
    metadata: {
      organization_id: organizationId,
      client_id: clientId,
      local_invoice_id: String(invoiceRecord.id),
    },
  });

  await sql.begin(async (tx) => {
    await tx`
      UPDATE admin_clients
      SET stripe_customer_id = ${customer.id}, updated_at = NOW()
      WHERE organization_id = ${organizationId}
        AND id = ${clientId}
    `;

    await tx`
      UPDATE admin_invoices
      SET stripe_customer_id = ${customer.id}, updated_at = NOW()
      WHERE organization_id = ${organizationId}
        AND id = ${invoiceRecord.id as string}
    `;
  });

  return customer.id;
}

async function createStripeDraftInvoice(
  organizationId: string,
  invoiceRecord: Record<string, unknown>
) {
  const clientId = asOptionalString(invoiceRecord.client_id);
  if (!clientId) {
    throw new Error("Invoice client is required");
  }

  const clientEmail = asOptionalString(invoiceRecord.client_email);
  if (!clientEmail) {
    throw new Error("Client email is required before a Stripe invoice can be sent.");
  }

  const lineItems = asJsonArray<Record<string, unknown>>(invoiceRecord.line_items);
  if (lineItems.length === 0) {
    throw new Error("Invoice must include at least one line item");
  }

  const stripeCustomerId = await ensureStripeCustomerForClient(
    organizationId,
    clientId,
    invoiceRecord
  );

  for (const lineItem of lineItems) {
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      currency: String(invoiceRecord.currency ?? DEFAULT_CURRENCY),
      amount: Math.max(0, Number(lineItem.line_total_cents ?? 0)),
      description: String(lineItem.description ?? "Invoice item"),
      metadata: {
        organization_id: organizationId,
        local_invoice_id: String(invoiceRecord.id),
        local_line_item_id: String(lineItem.id ?? ""),
        local_job_id: String(lineItem.job_id ?? ""),
        line_type: String(lineItem.line_type ?? "MANUAL"),
      },
    });
  }

  const dueDate = parseDateOnly(invoiceRecord.due_date, "dueDate");
  const stripeInvoice = await stripe.invoices.create({
    customer: stripeCustomerId,
    auto_advance: false,
    collection_method: "send_invoice",
    pending_invoice_items_behavior: "include",
    description: asOptionalString(invoiceRecord.memo) ?? undefined,
    footer: asOptionalString(invoiceRecord.internal_notes) ?? undefined,
    due_date: dueDate
      ? Math.floor(new Date(`${dueDate}T12:00:00.000Z`).getTime() / 1000)
      : undefined,
    metadata: {
      organization_id: organizationId,
      local_invoice_id: String(invoiceRecord.id),
      local_client_id: clientId,
      local_property_id: String(invoiceRecord.property_id ?? ""),
      invoice_number: String(invoiceRecord.invoice_number ?? ""),
    },
  });

  return stripeInvoice;
}

async function applyStripeInvoiceSnapshot(
  organizationId: string,
  invoiceId: string,
  stripeInvoice: Stripe.Invoice,
  context: StripeSyncContext
) {
  const existing = await fetchInvoiceBaseRecord(organizationId, invoiceId);
  if (!existing) return null;

  if (context.stripeEventId) {
    const inserted = await sql`
      INSERT INTO admin_invoice_events (
        id,
        organization_id,
        invoice_id,
        source,
        event_type,
        stripe_event_id,
        message,
        payload_json
      )
      VALUES (
        ${crypto.randomUUID()},
        ${organizationId},
        ${invoiceId},
        ${context.source},
        ${context.eventType},
        ${context.stripeEventId},
        ${context.message ?? null},
        ${JSON.stringify({
          stripeInvoiceId: stripeInvoice.id,
          stripeStatus: stripeInvoice.status,
          amountDue: stripeInvoice.amount_due,
          amountPaid: stripeInvoice.amount_paid,
          amountRemaining: stripeInvoice.amount_remaining,
        })}
      )
      ON CONFLICT (stripe_event_id)
      DO NOTHING
      RETURNING id
    `;

    if (!inserted[0]) {
      return fetchInvoiceRecord(organizationId, invoiceId, { includeEvents: true });
    }
  }

  const status = deriveStatusFromStripeInvoice(
    stripeInvoice,
    normalizeInvoiceStatus(existing.status),
    toIsoString(existing.send_at),
    context
  );
  const occurredAt = context.occurredAt ?? new Date();
  const paidAt =
    stripeInvoice.status_transitions?.paid_at
      ? toIsoString(stripeInvoice.status_transitions.paid_at)
      : status === "PAID"
        ? occurredAt.toISOString()
        : null;
  const sentAt =
    context.eventType === "invoice.sent"
      ? occurredAt.toISOString()
      : toIsoString(existing.sent_at) ?? (status === "OUTSTANDING" ? occurredAt.toISOString() : null);
  const finalizedAt =
    stripeInvoice.status_transitions?.finalized_at
      ? toIsoString(stripeInvoice.status_transitions.finalized_at)
      : toIsoString(existing.finalized_at);

  await sql`
    UPDATE admin_invoices
    SET
      stripe_customer_id = ${asOptionalString(stripeInvoice.customer) ?? asOptionalString(existing.stripe_customer_id)},
      stripe_invoice_id = ${stripeInvoice.id},
      stripe_status = ${stripeInvoice.status ?? null},
      status = ${status},
      due_date = ${toDateOnly(stripeInvoice.due_date) ?? toDateOnly(existing.due_date)},
      subtotal_cents = ${Number(stripeInvoice.subtotal ?? existing.subtotal_cents ?? 0)},
      tax_cents = ${sumStripeTax(stripeInvoice)},
      total_cents = ${Number(stripeInvoice.total ?? existing.total_cents ?? 0)},
      amount_paid_cents = ${Number(stripeInvoice.amount_paid ?? existing.amount_paid_cents ?? 0)},
      amount_remaining_cents = ${Number(
        stripeInvoice.amount_remaining ?? existing.amount_remaining_cents ?? 0
      )},
      currency = ${String(stripeInvoice.currency ?? existing.currency ?? DEFAULT_CURRENCY)},
      hosted_invoice_url = ${asOptionalString(stripeInvoice.hosted_invoice_url)},
      invoice_pdf_url = ${asOptionalString(stripeInvoice.invoice_pdf)},
      invoice_number = ${asOptionalString(stripeInvoice.number) ?? asOptionalString(existing.invoice_number)},
      send_at = ${status === "SCHEDULED" ? toIsoString(existing.send_at) : null},
      sent_at = ${sentAt},
      paid_at = ${paidAt},
      finalized_at = ${finalizedAt},
      last_synced_at = NOW(),
      updated_at = NOW()
    WHERE organization_id = ${organizationId} AND id = ${invoiceId}
  `;

  if (!context.stripeEventId) {
    await recordInvoiceEvent(organizationId, invoiceId, {
      source: context.source,
      eventType: context.eventType,
      message:
        context.message ??
        `Stripe invoice synced with status ${String(stripeInvoice.status ?? "unknown").toUpperCase()}.`,
      payload: {
        stripeInvoiceId: stripeInvoice.id,
        stripeStatus: stripeInvoice.status,
        amountDue: stripeInvoice.amount_due,
        amountPaid: stripeInvoice.amount_paid,
        amountRemaining: stripeInvoice.amount_remaining,
      },
    });
  }

  return fetchInvoiceRecord(organizationId, invoiceId, { includeEvents: true });
}

async function ensureStripeDraftForInvoice(organizationId: string, invoiceId: string) {
  const invoiceRecord = await fetchInvoiceRecord(organizationId, invoiceId, { includeEvents: false });
  if (!invoiceRecord) return null;

  const stripeInvoiceId = asOptionalString(invoiceRecord.stripe_invoice_id);
  if (stripeInvoiceId) {
    const existingStripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId);
    return {
      localInvoice: invoiceRecord,
      stripeInvoice: existingStripeInvoice,
    };
  }

  const createdStripeInvoice = await createStripeDraftInvoice(organizationId, invoiceRecord);
  const synced = await applyStripeInvoiceSnapshot(organizationId, invoiceId, createdStripeInvoice, {
    source: "SYSTEM",
    eventType: "invoice.draft_prepared",
    message: "Stripe draft invoice prepared for portal invoice.",
  });

  return {
    localInvoice: synced,
    stripeInvoice: createdStripeInvoice,
  };
}

export async function listInvoices(
  organizationId: string,
  filters: InvoiceFilters = {}
): Promise<InvoiceRecord[]> {
  await ensureAdminTables();
  await refreshInvoiceAging(organizationId);

  const clientId = filters.clientId ? String(filters.clientId) : null;
  const status =
    filters.status && filters.status !== "ALL"
      ? normalizeInvoiceStatus(filters.status)
      : null;
  const query = asOptionalString(filters.query)?.toLowerCase() ?? null;

  const rows = await sql`
    SELECT
      i.id,
      i.organization_id,
      i.client_id,
      i.property_id,
      i.retainer_id,
      i.invoice_number,
      i.status,
      i.stripe_customer_id,
      i.stripe_invoice_id,
      i.stripe_status,
      i.send_at,
      i.period_start,
      i.period_end,
      i.issue_date,
      i.due_date,
      i.subtotal_cents,
      i.tax_cents,
      i.total_cents,
      i.amount_paid_cents,
      i.amount_remaining_cents,
      i.currency,
      i.hosted_invoice_url,
      i.invoice_pdf_url,
      i.notes,
      i.notes AS memo,
      i.internal_notes,
      i.sent_at,
      i.paid_at,
      i.finalized_at,
      i.last_synced_at,
      i.created_at,
      i.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      r.name AS plan_name,
      COALESCE(line_items.items, '[]'::json) AS line_items,
      COALESCE(line_items.line_item_count, 0) AS line_item_count
    FROM admin_invoices i
    LEFT JOIN admin_clients c
      ON c.id = i.client_id
      AND c.organization_id = i.organization_id
    LEFT JOIN admin_properties p
      ON p.id = i.property_id
      AND p.organization_id = i.organization_id
    LEFT JOIN admin_retainers r
      ON r.id = i.retainer_id
      AND r.organization_id = i.organization_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS line_item_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', li.id,
              'job_id', li.job_id,
              'retainer_id', li.retainer_id,
              'description', li.description,
              'quantity', li.quantity,
              'unit_price_cents', li.unit_price_cents,
              'line_total_cents', li.line_total_cents,
              'line_type', li.line_type,
              'created_at', li.created_at
            )
            ORDER BY li.created_at ASC
          ),
          '[]'::json
        ) AS items
      FROM admin_invoice_line_items li
      WHERE li.organization_id = i.organization_id
        AND li.invoice_id = i.id
    ) AS line_items ON true
    WHERE i.organization_id = ${organizationId}
      ${clientId ? sql`AND i.client_id = ${clientId}` : sql``}
      ${status ? sql`AND UPPER(i.status) = ${status}` : sql``}
      ${query
        ? sql`
            AND (
              LOWER(COALESCE(i.invoice_number, '')) LIKE ${`%${query}%`}
              OR LOWER(COALESCE(i.stripe_invoice_id, '')) LIKE ${`%${query}%`}
              OR LOWER(COALESCE(c.name, '')) LIKE ${`%${query}%`}
              OR LOWER(COALESCE(p.name, '')) LIKE ${`%${query}%`}
            )
          `
        : sql``}
    ORDER BY COALESCE(i.sent_at, i.issue_date::timestamp, i.created_at) DESC
  `;

  return rows.map(
    (row) =>
      ({
        ...row,
        line_items: asJsonArray(row.line_items),
        events: [],
      }) as unknown as InvoiceRecord
  );
}

export async function getInvoiceById(organizationId: string, invoiceId: string) {
  await ensureAdminTables();
  await refreshInvoiceAging(organizationId);
  return fetchInvoiceRecord(organizationId, invoiceId, { includeEvents: true });
}

export async function createInvoice(
  organizationId: string,
  body: Record<string, unknown>
) {
  return saveDraftInvoice(organizationId, body);
}

export async function updateInvoice(
  organizationId: string,
  invoiceId: string,
  body: Record<string, unknown>
) {
  return saveDraftInvoice(organizationId, body, invoiceId);
}

export async function sendInvoiceNow(organizationId: string, invoiceId: string) {
  await ensureAdminTables();
  await refreshInvoiceAging(organizationId);

  const prepared = await ensureStripeDraftForInvoice(organizationId, invoiceId);
  if (!prepared?.localInvoice) return null;

  const currentStatus = normalizeInvoiceStatus(prepared.localInvoice.status);
  if (currentStatus === "PAID" || currentStatus === "VOID") {
    throw new Error("Paid or void invoices cannot be sent again.");
  }

  try {
    let stripeInvoice = prepared.stripeInvoice;

    if (stripeInvoice.status === "draft") {
      stripeInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id, {
        auto_advance: false,
      });
    }

    if (stripeInvoice.status !== "paid" && stripeInvoice.status !== "void") {
      stripeInvoice = await stripe.invoices.sendInvoice(stripeInvoice.id);
    }

    return applyStripeInvoiceSnapshot(organizationId, invoiceId, stripeInvoice, {
      source: "PORTAL",
      eventType: "invoice.sent.portal",
      message: "Invoice sent from the portal.",
      forceStatus: "OUTSTANDING",
      occurredAt: new Date(),
    });
  } catch (error) {
    await sql`
      UPDATE admin_invoices
      SET
        status = ${"FINALIZATION_FAILED"},
        updated_at = NOW()
      WHERE organization_id = ${organizationId}
        AND id = ${invoiceId}
    `;

    await recordInvoiceEvent(organizationId, invoiceId, {
      source: "PORTAL",
      eventType: "invoice.finalization_failed",
      message: error instanceof Error ? error.message : "Failed to finalize Stripe invoice.",
      payload: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

export async function scheduleInvoiceSend(
  organizationId: string,
  invoiceId: string,
  sendAtInput: unknown
) {
  await ensureAdminTables();

  const existing = await fetchInvoiceBaseRecord(organizationId, invoiceId);
  if (!existing) return null;

  const currentStatus = normalizeInvoiceStatus(existing.status);
  if (currentStatus === "PAID" || currentStatus === "VOID" || currentStatus === "OUTSTANDING" || currentStatus === "OVERDUE") {
    throw new Error("Only unsent invoices can be scheduled.");
  }

  const sendAt = parseOptionalDateTime(sendAtInput, "sendAt");
  if (!sendAt) {
    throw new Error("sendAt is required");
  }
  if (sendAt.getTime() <= Date.now()) {
    throw new Error("Scheduled send time must be in the future");
  }

  await ensureStripeDraftForInvoice(organizationId, invoiceId);

  await sql`
    UPDATE admin_invoices
    SET
      status = ${"SCHEDULED"},
      send_at = ${sendAt.toISOString()},
      updated_at = NOW()
    WHERE organization_id = ${organizationId}
      AND id = ${invoiceId}
  `;

  await recordInvoiceEvent(organizationId, invoiceId, {
    source: "PORTAL",
    eventType: "invoice.scheduled",
    message: `Invoice scheduled to send at ${sendAt.toISOString()}.`,
    payload: { sendAt: sendAt.toISOString() },
  });

  return fetchInvoiceRecord(organizationId, invoiceId, { includeEvents: true });
}

export async function resendInvoice(organizationId: string, invoiceId: string) {
  await ensureAdminTables();

  const existing = await fetchInvoiceBaseRecord(organizationId, invoiceId);
  if (!existing) return null;

  const stripeInvoiceId = asOptionalString(existing.stripe_invoice_id);
  if (!stripeInvoiceId) {
    return sendInvoiceNow(organizationId, invoiceId);
  }

  const stripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId);
  if (stripeInvoice.status === "draft") {
    return sendInvoiceNow(organizationId, invoiceId);
  }
  if (stripeInvoice.status === "paid" || stripeInvoice.status === "void") {
    throw new Error("Paid or void invoices cannot be resent.");
  }

  const resent = await stripe.invoices.sendInvoice(stripeInvoiceId);
  return applyStripeInvoiceSnapshot(organizationId, invoiceId, resent, {
    source: "PORTAL",
    eventType: "invoice.resent.portal",
    message: "Invoice resent from the portal.",
    forceStatus: "OUTSTANDING",
    occurredAt: new Date(),
  });
}

export async function syncInvoiceById(organizationId: string, invoiceId: string) {
  await ensureAdminTables();

  const existing = await fetchInvoiceBaseRecord(organizationId, invoiceId);
  if (!existing) return null;

  const stripeInvoiceId = asOptionalString(existing.stripe_invoice_id);
  if (!stripeInvoiceId) {
    return fetchInvoiceRecord(organizationId, invoiceId, { includeEvents: true });
  }

  const stripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId);
  return applyStripeInvoiceSnapshot(organizationId, invoiceId, stripeInvoice, {
    source: "SYSTEM",
    eventType: "invoice.sync.manual",
    message: "Invoice synced from Stripe.",
    preserveSchedule: normalizeInvoiceStatus(existing.status) === "SCHEDULED",
  });
}

export async function syncInvoiceFromStripeEvent(
  organizationId: string,
  event: Stripe.Event
) {
  await ensureAdminTables();

  const object = event.data.object;
  if (!object || object.object !== "invoice") {
    return { handled: false, invoiceId: null as string | null };
  }

  const stripeInvoice = object as Stripe.Invoice;
  const localInvoiceId =
    asOptionalString(stripeInvoice.metadata?.local_invoice_id) ?? null;

  const rows = localInvoiceId
    ? await sql`
        SELECT id
        FROM admin_invoices
        WHERE organization_id = ${organizationId}
          AND (id = ${localInvoiceId} OR stripe_invoice_id = ${stripeInvoice.id})
        LIMIT 1
      `
    : await sql`
        SELECT id
        FROM admin_invoices
        WHERE organization_id = ${organizationId}
          AND stripe_invoice_id = ${stripeInvoice.id}
        LIMIT 1
      `;

  const localInvoice = rows[0] ?? null;
  if (!localInvoice) {
    return { handled: false, invoiceId: null as string | null };
  }

  const updated = await applyStripeInvoiceSnapshot(
    organizationId,
    String(localInvoice.id),
    stripeInvoice,
    {
      source: "STRIPE_WEBHOOK",
      eventType: event.type,
      stripeEventId: event.id,
      message: `Stripe webhook received: ${event.type}.`,
      occurredAt: new Date(event.created * 1000),
      preserveSchedule: event.type !== "invoice.sent",
    }
  );

  return { handled: true, invoiceId: updated?.id ?? String(localInvoice.id) };
}

export async function sendScheduledInvoices(organizationId: string) {
  await ensureAdminTables();
  await refreshInvoiceAging(organizationId);

  const dueInvoices = await sql`
    SELECT id
    FROM admin_invoices
    WHERE organization_id = ${organizationId}
      AND UPPER(status) = 'SCHEDULED'
      AND send_at IS NOT NULL
      AND send_at <= NOW()
    ORDER BY send_at ASC
    LIMIT 25
  `;

  const results: Array<{ invoiceId: string; ok: boolean; error?: string }> = [];

  for (const row of dueInvoices) {
    try {
      await sendInvoiceNow(organizationId, String(row.id));
      results.push({ invoiceId: String(row.id), ok: true });
    } catch (error) {
      results.push({
        invoiceId: String(row.id),
        ok: false,
        error: error instanceof Error ? error.message : "Failed to send scheduled invoice",
      });
    }
  }

  return {
    dueCount: dueInvoices.length,
    sentCount: results.filter((result) => result.ok).length,
    failedCount: results.filter((result) => !result.ok).length,
    results,
  };
}

async function listCompletedJobsWithoutInvoice(
  organizationId: string,
  options: { olderThanDays?: number } = {}
) {
  const olderThanDays = options.olderThanDays ?? null;

  return sql`
    SELECT
      j.id,
      j.client_id,
      c.name AS client_name,
      j.property_id,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      j.service_id,
      s.name AS service_name,
      j.title,
      j.scheduled_for,
      j.completed_at,
      j.price_cents
    FROM admin_jobs j
    LEFT JOIN admin_clients c
      ON c.id = j.client_id
      AND c.organization_id = j.organization_id
    LEFT JOIN admin_properties p
      ON p.id = j.property_id
      AND p.organization_id = j.organization_id
    LEFT JOIN admin_services s
      ON s.id = j.service_id
      AND s.organization_id = j.organization_id
    WHERE j.organization_id = ${organizationId}
      AND UPPER(j.status) = 'COMPLETED'
      AND NOT EXISTS (
        SELECT 1
        FROM admin_invoice_line_items li
        INNER JOIN admin_invoices i
          ON i.id = li.invoice_id
          AND i.organization_id = li.organization_id
        WHERE li.organization_id = j.organization_id
          AND li.job_id = j.id
          AND UPPER(i.status) <> 'VOID'
      )
      ${
        olderThanDays
          ? sql`AND COALESCE(j.completed_at, j.scheduled_for) <= NOW() - (${olderThanDays} * INTERVAL '1 day')`
          : sql``
      }
    ORDER BY COALESCE(j.completed_at, j.scheduled_for) ASC
    LIMIT 12
  `;
}

export async function getInvoiceDashboardData(organizationId: string) {
  await ensureAdminTables();
  await refreshInvoiceAging(organizationId);

  const invoices = await listInvoices(organizationId);
  const completedJobsWithoutInvoice = await listCompletedJobsWithoutInvoice(organizationId);
  const agingCompletedJobsWithoutInvoice = await listCompletedJobsWithoutInvoice(organizationId, {
    olderThanDays: NEEDS_INVOICE_STALE_DAYS,
  });

  const now = new Date();
  const soonBoundary = new Date(now.getTime() + SCHEDULE_SOON_HOURS * 60 * 60 * 1000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const paidThisMonthRows = await sql`
    SELECT COALESCE(SUM(total_cents), 0) AS total
    FROM admin_invoices
    WHERE organization_id = ${organizationId}
      AND UPPER(status) = 'PAID'
      AND COALESCE(paid_at, updated_at) >= ${monthStart}
  `;

  const groups = Object.fromEntries(
    INVOICE_GROUPS.map((group) => [
      group.key,
      invoices.filter((invoice) => group.statuses.includes(normalizeInvoiceStatus(invoice.status))),
    ])
  ) as Record<string, InvoiceRecord[]>;

  const summary = {
    totalDraftInvoices: invoices.filter((invoice) => normalizeInvoiceStatus(invoice.status) === "DRAFT").length,
    totalReadyToSend: invoices.filter((invoice) =>
      ["READY_TO_SEND", "FINALIZATION_FAILED"].includes(normalizeInvoiceStatus(invoice.status))
    ).length,
    outstandingBalanceCents: invoices
      .filter((invoice) =>
        ["OUTSTANDING", "OVERDUE"].includes(normalizeInvoiceStatus(invoice.status))
      )
      .reduce((sum, invoice) => sum + Number(invoice.amount_remaining_cents ?? invoice.total_cents ?? 0), 0),
    overdueBalanceCents: invoices
      .filter((invoice) => normalizeInvoiceStatus(invoice.status) === "OVERDUE")
      .reduce((sum, invoice) => sum + Number(invoice.amount_remaining_cents ?? invoice.total_cents ?? 0), 0),
    paidThisMonthCents: Number(paidThisMonthRows[0]?.total ?? 0),
  };

  const queue = {
    completedJobsWithoutInvoice: completedJobsWithoutInvoice as unknown as DashboardJobRow[],
    agingCompletedJobsWithoutInvoice: agingCompletedJobsWithoutInvoice as unknown as DashboardJobRow[],
    draftInvoices: invoices.filter((invoice) =>
      ["DRAFT", "READY_TO_SEND", "FINALIZATION_FAILED"].includes(normalizeInvoiceStatus(invoice.status))
    ),
    scheduledDueSoon: invoices.filter((invoice) => {
      if (normalizeInvoiceStatus(invoice.status) !== "SCHEDULED" || !invoice.send_at) return false;
      const sendAt = new Date(String(invoice.send_at));
      return sendAt <= soonBoundary;
    }),
    overdueInvoices: invoices.filter(
      (invoice) => normalizeInvoiceStatus(invoice.status) === "OVERDUE"
    ),
  };

  return {
    summary,
    groups,
    queue,
  };
}
