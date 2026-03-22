import { ensureAdminTables, sql } from "@/lib/server/db";
import { asOptionalString } from "@/lib/server/validation";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "VOID" | "OVERDUE";
type LineType = "PLAN_BASE" | "JOB_EXTRA" | "MANUAL";

type InvoiceFilters = {
  clientId?: string | null;
  status?: string | null;
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

const VALID_STATUSES = new Set<InvoiceStatus>([
  "DRAFT",
  "SENT",
  "PAID",
  "VOID",
  "OVERDUE",
]);

function normalizeStatus(value: unknown, fallback: InvoiceStatus = "DRAFT") {
  const status = String(value ?? fallback).trim().toUpperCase() as InvoiceStatus;
  if (!VALID_STATUSES.has(status)) {
    throw new Error("Invalid invoice status");
  }
  return status;
}

function parseDateOnly(value: unknown, label: string) {
  const stringValue = String(value ?? "").trim();
  if (!stringValue) return null;

  const date = new Date(`${stringValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`);
  }

  return date.toISOString().slice(0, 10);
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

async function fetchInvoiceRecord(organizationId: string, invoiceId: string) {
  const rows = await sql`
    SELECT
      i.id,
      i.organization_id,
      i.client_id,
      i.property_id,
      i.retainer_id,
      i.invoice_number,
      i.status,
      i.period_start,
      i.period_end,
      i.issue_date,
      i.due_date,
      i.subtotal_cents,
      i.total_cents,
      i.notes,
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
        ) AS items
      FROM admin_invoice_line_items li
      WHERE li.organization_id = i.organization_id
        AND li.invoice_id = i.id
    ) AS line_items ON true
    WHERE i.organization_id = ${organizationId} AND i.id = ${invoiceId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listInvoices(
  organizationId: string,
  filters: InvoiceFilters = {}
) {
  await ensureAdminTables();

  const clientId = filters.clientId ? String(filters.clientId) : null;
  const status =
    filters.status && filters.status !== "ALL"
      ? normalizeStatus(filters.status)
      : null;

  return sql`
    SELECT
      i.id,
      i.organization_id,
      i.client_id,
      i.property_id,
      i.retainer_id,
      i.invoice_number,
      i.status,
      i.period_start,
      i.period_end,
      i.issue_date,
      i.due_date,
      i.subtotal_cents,
      i.total_cents,
      i.notes,
      i.created_at,
      i.updated_at,
      c.name AS client_name,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      r.name AS plan_name,
      COALESCE(line_items.line_item_count, 0) AS line_item_count,
      COALESCE(line_items.items, '[]'::json) AS line_items
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
        json_agg(
          json_build_object(
            'id', li.id,
            'description', li.description,
            'quantity', li.quantity,
            'unit_price_cents', li.unit_price_cents,
            'line_total_cents', li.line_total_cents,
            'line_type', li.line_type,
            'job_id', li.job_id,
            'retainer_id', li.retainer_id,
            'created_at', li.created_at
          )
          ORDER BY li.created_at ASC
        ) AS items
      FROM admin_invoice_line_items li
      WHERE li.organization_id = i.organization_id
        AND li.invoice_id = i.id
    ) AS line_items ON true
    WHERE i.organization_id = ${organizationId}
      ${clientId ? sql`AND i.client_id = ${clientId}` : sql``}
      ${status ? sql`AND UPPER(i.status) = ${status}` : sql``}
    ORDER BY i.issue_date DESC NULLS LAST, i.created_at DESC
  `;
}

export async function getInvoiceById(organizationId: string, invoiceId: string) {
  await ensureAdminTables();
  return fetchInvoiceRecord(organizationId, invoiceId);
}

export async function createInvoice(
  organizationId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const retainerId = asOptionalString(body.retainerId);
  const retainer = await fetchRetainer(organizationId, retainerId);

  const clientId = asOptionalString(body.clientId) ?? retainer?.client_id ?? null;
  const propertyId =
    asOptionalString(body.propertyId) ?? retainer?.property_id ?? null;
  const invoiceNumber =
    asOptionalString(body.invoiceNumber) ?? (await generateInvoiceNumber(organizationId));
  const status = normalizeStatus(body.status);
  const periodStart = parseDateOnly(body.periodStart, "periodStart");
  const periodEnd = parseDateOnly(body.periodEnd, "periodEnd");
  const issueDate =
    parseDateOnly(body.issueDate, "issueDate") ??
    new Date().toISOString().slice(0, 10);
  const dueDate =
    parseDateOnly(body.dueDate, "dueDate") ?? addDaysToDateOnly(issueDate, 7);
  const notes = asOptionalString(body.notes);
  const includePlanBase = body.includePlanBase === undefined ? true : Boolean(body.includePlanBase);

  if (!clientId) {
    throw new Error("clientId is required");
  }

  await assertClientExists(organizationId, clientId);
  await assertPropertyExists(organizationId, propertyId, clientId);

  if (retainer) {
    if (retainer.client_id && retainer.client_id !== clientId) {
      throw new Error("Selected plan does not belong to the selected client");
    }
    if (propertyId && retainer.property_id && retainer.property_id !== propertyId) {
      throw new Error("Selected plan does not belong to the selected property");
    }
  }

  const lineItems: DraftLineItemInput[] = [];

  if (retainer && includePlanBase) {
    lineItems.push({
      description: `${retainer.name} service plan`,
      quantity: 1,
      unitPriceCents: Number(retainer.amount_cents ?? 0),
      lineTotalCents: Number(retainer.amount_cents ?? 0),
      lineType: "PLAN_BASE",
      retainerId: retainer.id,
    });
  }

  const requestedJobIds = Array.isArray(body.jobIds)
    ? body.jobIds
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    : [];
  const uniqueRequestedJobIds = Array.from(new Set(requestedJobIds));

  if (uniqueRequestedJobIds.length !== requestedJobIds.length) {
    throw new Error("Duplicate billable jobs are not allowed on the same invoice");
  }

  if (uniqueRequestedJobIds.length > 0) {
    const jobs = await sql`
      SELECT id, client_id, property_id, retainer_id, title, scheduled_for, price_cents
      FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND id = ANY(${uniqueRequestedJobIds})
      ORDER BY scheduled_for ASC
    `;

    if (jobs.length !== uniqueRequestedJobIds.length) {
      throw new Error("One or more selected jobs could not be found");
    }

    for (const job of jobs) {
      if (job.client_id && job.client_id !== clientId) {
        throw new Error("Selected billable job does not belong to the selected client");
      }
      if (propertyId && job.property_id && job.property_id !== propertyId) {
        throw new Error("Selected billable job does not belong to the selected property");
      }
      if (retainer && job.retainer_id && job.retainer_id !== retainer.id) {
        throw new Error("Selected billable job does not belong to the selected plan");
      }

      const unitPriceCents = Math.max(0, Number(job.price_cents ?? 0));
      lineItems.push({
        description: `${job.title} visit on ${new Date(job.scheduled_for).toLocaleDateString()}`,
        quantity: 1,
        unitPriceCents,
        lineTotalCents: unitPriceCents,
        lineType: "JOB_EXTRA",
        jobId: job.id,
        retainerId: job.retainer_id,
      });
    }
  }

  const manualItems = Array.isArray(body.manualLineItems) ? body.manualLineItems : [];
  for (const rawItem of manualItems) {
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) continue;
    const item = rawItem as Record<string, unknown>;
    const description = String(item.description ?? "").trim();
    if (!description) continue;

    const quantity = parseQuantity(item.quantity);
    const unitPriceCents = parseOptionalInteger(
      item.unitPriceCents,
      "unitPriceCents"
    );

    if (unitPriceCents === null) {
      throw new Error("Manual line items require unitPriceCents");
    }

    lineItems.push({
      description,
      quantity,
      unitPriceCents,
      lineTotalCents: Math.round(quantity * unitPriceCents),
      lineType: "MANUAL",
    });
  }

  if (lineItems.length === 0) {
    throw new Error("Invoice must include at least one line item");
  }

  const subtotalCents = lineItems.reduce(
    (sum, item) => sum + Math.max(0, item.lineTotalCents),
    0
  );
  const totalCents = subtotalCents;
  const invoiceId = crypto.randomUUID();

  await sql.begin(async (tx) => {
    if (uniqueRequestedJobIds.length > 0) {
      await tx`
        SELECT id
        FROM admin_jobs
        WHERE organization_id = ${organizationId}
          AND id = ANY(${uniqueRequestedJobIds})
        ORDER BY id
        FOR UPDATE
      `;

      const existingExtraJobInvoices = await tx`
        SELECT DISTINCT ON (li.job_id)
          li.job_id,
          i.invoice_number,
          i.status
        FROM admin_invoice_line_items li
        INNER JOIN admin_invoices i
          ON i.id = li.invoice_id
          AND i.organization_id = li.organization_id
        WHERE li.organization_id = ${organizationId}
          AND li.line_type = 'JOB_EXTRA'
          AND li.job_id = ANY(${uniqueRequestedJobIds})
          AND UPPER(i.status) <> 'VOID'
        ORDER BY li.job_id, i.created_at DESC
      `;

      if (existingExtraJobInvoices.length > 0) {
        const conflict = existingExtraJobInvoices[0];
        throw new Error(
          `Job ${String(conflict.job_id).slice(0, 8)} is already invoiced on ${conflict.invoice_number}`
        );
      }
    }

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
        total_cents,
        notes
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
        ${totalCents},
        ${notes}
      )
    `;

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

  return fetchInvoiceRecord(organizationId, invoiceId);
}

export async function updateInvoice(
  organizationId: string,
  invoiceId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existing = await fetchInvoiceRecord(organizationId, invoiceId);
  if (!existing) return null;

  const status =
    body.status !== undefined ? normalizeStatus(body.status) : normalizeStatus(existing.status);
  const notes =
    body.notes !== undefined ? asOptionalString(body.notes) : existing.notes;
  const issueDate =
    body.issueDate !== undefined
      ? parseDateOnly(body.issueDate, "issueDate")
      : (existing.issue_date as string | null);
  const dueDate =
    body.dueDate !== undefined
      ? parseDateOnly(body.dueDate, "dueDate")
      : (existing.due_date as string | null);

  await sql`
    UPDATE admin_invoices
    SET
      status = ${status},
      notes = ${notes},
      issue_date = ${issueDate},
      due_date = ${dueDate},
      updated_at = NOW()
    WHERE organization_id = ${organizationId} AND id = ${invoiceId}
  `;

  return fetchInvoiceRecord(organizationId, invoiceId);
}
