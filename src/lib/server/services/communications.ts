import { ensureAdminTables, sql } from "@/lib/server/db";
import { asOptionalString } from "@/lib/server/validation";

type CommunicationStatus = "DRAFT" | "APPROVED" | "SENT" | "RESPONDED" | "CANCELED";
type CommunicationType =
  | "GENERAL"
  | "WELCOME"
  | "VISIT_SUMMARY"
  | "INVOICE_REMINDER"
  | "FOLLOW_UP";
type CommunicationDirection = "OUTBOUND" | "INBOUND";
type CommunicationChannel = "EMAIL" | "SMS" | "PHONE";

type CommunicationFilters = {
  status?: string | null;
  clientId?: string | null;
  awaitingApproval?: boolean;
  includeResolved?: boolean;
  query?: string | null;
};

const VALID_STATUSES = new Set<CommunicationStatus>([
  "DRAFT",
  "APPROVED",
  "SENT",
  "RESPONDED",
  "CANCELED",
]);
const VALID_TYPES = new Set<CommunicationType>([
  "GENERAL",
  "WELCOME",
  "VISIT_SUMMARY",
  "INVOICE_REMINDER",
  "FOLLOW_UP",
]);
const VALID_DIRECTIONS = new Set<CommunicationDirection>(["OUTBOUND", "INBOUND"]);
const VALID_CHANNELS = new Set<CommunicationChannel>(["EMAIL", "SMS", "PHONE"]);

function normalizeStatus(value: unknown, fallback: CommunicationStatus = "DRAFT") {
  const status = String(value ?? fallback).trim().toUpperCase() as CommunicationStatus;
  if (!VALID_STATUSES.has(status)) {
    throw new Error("Invalid communication status");
  }
  return status;
}

function normalizeType(value: unknown, fallback: CommunicationType = "GENERAL") {
  const type = String(value ?? fallback).trim().toUpperCase() as CommunicationType;
  if (!VALID_TYPES.has(type)) {
    throw new Error("Invalid communication type");
  }
  return type;
}

function normalizeDirection(value: unknown, fallback: CommunicationDirection = "OUTBOUND") {
  const direction = String(value ?? fallback).trim().toUpperCase() as CommunicationDirection;
  if (!VALID_DIRECTIONS.has(direction)) {
    throw new Error("Invalid communication direction");
  }
  return direction;
}

function normalizeChannel(value: unknown, fallback: CommunicationChannel = "EMAIL") {
  const channel = String(value ?? fallback).trim().toUpperCase() as CommunicationChannel;
  if (!VALID_CHANNELS.has(channel)) {
    throw new Error("Invalid communication channel");
  }
  return channel;
}

function parseOptionalTimestamp(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return date.toISOString();
}

function coerceOptionalTimestamp(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function addDays(dateIso: string, days: number) {
  const date = new Date(dateIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function toMetadataValue(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return JSON.stringify(value);
}

async function fetchCommunicationRecord(organizationId: string, communicationId: string) {
  const rows = await sql`
    SELECT
      comm.id,
      comm.organization_id,
      comm.client_id,
      comm.property_id,
      comm.job_id,
      comm.invoice_id,
      comm.channel,
      comm.direction,
      comm.type,
      comm.status,
      comm.subject,
      comm.body,
      comm.ai_generated,
      comm.requires_approval,
      comm.approved_at,
      comm.sent_at,
      comm.last_client_response_at,
      comm.follow_up_due_at,
      comm.metadata_json,
      comm.created_at,
      comm.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      j.title AS job_title,
      j.scheduled_for AS job_scheduled_for,
      j.completed_at AS job_completed_at,
      i.invoice_number,
      i.total_cents AS invoice_total_cents,
      i.due_date AS invoice_due_date
    FROM admin_communications comm
    LEFT JOIN admin_clients c
      ON c.id = comm.client_id
      AND c.organization_id = comm.organization_id
    LEFT JOIN admin_properties p
      ON p.id = comm.property_id
      AND p.organization_id = comm.organization_id
    LEFT JOIN admin_jobs j
      ON j.id = comm.job_id
      AND j.organization_id = comm.organization_id
    LEFT JOIN admin_invoices i
      ON i.id = comm.invoice_id
      AND i.organization_id = comm.organization_id
    WHERE comm.organization_id = ${organizationId}
      AND comm.id = ${communicationId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function createCommunicationRecord(
  organizationId: string,
  input: {
    clientId?: string | null;
    propertyId?: string | null;
    jobId?: string | null;
    invoiceId?: string | null;
    channel?: CommunicationChannel;
    direction?: CommunicationDirection;
    type?: CommunicationType;
    status?: CommunicationStatus;
    subject?: string | null;
    body?: string | null;
    aiGenerated?: boolean;
    requiresApproval?: boolean;
    approvedAt?: string | null;
    sentAt?: string | null;
    lastClientResponseAt?: string | null;
    followUpDueAt?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  const id = crypto.randomUUID();

  await sql`
    INSERT INTO admin_communications (
      id,
      organization_id,
      client_id,
      property_id,
      job_id,
      invoice_id,
      channel,
      direction,
      type,
      status,
      subject,
      body,
      ai_generated,
      requires_approval,
      approved_at,
      sent_at,
      last_client_response_at,
      follow_up_due_at,
      metadata_json
    )
    VALUES (
      ${id},
      ${organizationId},
      ${input.clientId ?? null},
      ${input.propertyId ?? null},
      ${input.jobId ?? null},
      ${input.invoiceId ?? null},
      ${input.channel ?? "EMAIL"},
      ${input.direction ?? "OUTBOUND"},
      ${input.type ?? "GENERAL"},
      ${input.status ?? "DRAFT"},
      ${input.subject ?? null},
      ${input.body ?? null},
      ${input.aiGenerated ?? false},
      ${input.requiresApproval ?? true},
      ${input.approvedAt ?? null},
      ${input.sentAt ?? null},
      ${input.lastClientResponseAt ?? null},
      ${input.followUpDueAt ?? null},
      ${toMetadataValue(input.metadata)}
    )
  `;

  return fetchCommunicationRecord(organizationId, id);
}

function buildWelcomeDraftBody(client: Record<string, unknown>) {
  const clientName = String(client.name ?? "there");
  const serviceAddress = asOptionalString(client.service_address_text) ?? asOptionalString(client.address_text);
  const entryNotes = asOptionalString(client.entry_notes);
  const billingNotes = asOptionalString(client.billing_notes);

  return [
    `Hi ${clientName},`,
    "",
    "Welcome to Coastal Home Management 30A.",
    serviceAddress ? `We have your service address noted as ${serviceAddress}.` : null,
    entryNotes ? `Entry notes on file: ${entryNotes}` : null,
    billingNotes ? `Billing notes on file: ${billingNotes}` : null,
    "",
    "We will use this thread for visit updates, scheduling notes, and billing communication that requires your review.",
    "",
    "Best,",
    "Coastal Home Management 30A",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildVisitSummaryBody(job: Record<string, unknown>) {
  const lines = [
    `Completed visit: ${String(job.title ?? "Service visit")}`,
    job.property_name ? `Property: ${String(job.property_name)}` : null,
    job.completed_at
      ? `Completed at: ${new Date(String(job.completed_at)).toLocaleString()}`
      : null,
    job.notes ? "" : null,
    job.notes ? `Operator notes:\n${String(job.notes)}` : null,
  ].filter(Boolean);

  return [
    "Hello,",
    "",
    ...lines,
    "",
    "Please review before sending.",
  ].join("\n");
}

function buildInvoiceReminderBody(invoice: Record<string, unknown>) {
  const total = Number(invoice.total_cents ?? 0);
  const dueDate = asOptionalString(invoice.due_date);
  const amount = `$${(total / 100).toFixed(2)}`;

  return [
    `Reminder for invoice ${String(invoice.invoice_number ?? "draft")}`,
    "",
    `Amount due: ${amount}`,
    dueDate ? `Due date: ${dueDate}` : null,
    "",
    "Please review before sending.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function findExistingCommunicationByMetadata(
  organizationId: string,
  type: CommunicationType,
  metadataKey: string,
  metadataValue: string
) {
  const rows = await sql`
    SELECT id
    FROM admin_communications
    WHERE organization_id = ${organizationId}
      AND type = ${type}
      AND metadata_json ->> ${metadataKey} = ${metadataValue}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return rows[0]?.id ? String(rows[0].id) : null;
}

export async function queueWelcomeCommunicationForClient(
  organizationId: string,
  clientId: string
) {
  await ensureAdminTables();

  const existingId = await findExistingCommunicationByMetadata(
    organizationId,
    "WELCOME",
    "clientId",
    clientId
  );
  if (existingId) return fetchCommunicationRecord(organizationId, existingId);

  const rows = await sql`
    SELECT id, name, email, service_address_text, address_text, entry_notes, billing_notes
    FROM admin_clients
    WHERE organization_id = ${organizationId}
      AND id = ${clientId}
    LIMIT 1
  `;

  const client = rows[0];
  if (!client) return null;

  return createCommunicationRecord(organizationId, {
    clientId,
    type: "WELCOME",
    status: "DRAFT",
    subject: `Welcome to Coastal Home Management 30A`,
    body: buildWelcomeDraftBody(client as Record<string, unknown>),
    aiGenerated: true,
    requiresApproval: true,
    metadata: {
      automation: "new-client-welcome",
      clientId,
    },
  });
}

export async function queueJobCompletionSummaryDraft(
  organizationId: string,
  jobId: string
) {
  await ensureAdminTables();

  const existingId = await findExistingCommunicationByMetadata(
    organizationId,
    "VISIT_SUMMARY",
    "jobId",
    jobId
  );
  if (existingId) return fetchCommunicationRecord(organizationId, existingId);

  const rows = await sql`
    SELECT
      j.id,
      j.client_id,
      j.property_id,
      j.title,
      j.notes,
      j.completed_at,
      c.name AS client_name,
      p.name AS property_name
    FROM admin_jobs j
    LEFT JOIN admin_clients c
      ON c.id = j.client_id
      AND c.organization_id = j.organization_id
    LEFT JOIN admin_properties p
      ON p.id = j.property_id
      AND p.organization_id = j.organization_id
    WHERE j.organization_id = ${organizationId}
      AND j.id = ${jobId}
      AND UPPER(j.status) = 'COMPLETED'
    LIMIT 1
  `;

  const job = rows[0];
  if (!job) return null;

  return createCommunicationRecord(organizationId, {
    clientId: asOptionalString(job.client_id),
    propertyId: asOptionalString(job.property_id),
    jobId,
    type: "VISIT_SUMMARY",
    status: "DRAFT",
    subject: `${String(job.title ?? "Visit")} summary`,
    body: buildVisitSummaryBody(job as Record<string, unknown>),
    aiGenerated: true,
    requiresApproval: true,
    metadata: {
      automation: "job-completion-summary",
      jobId,
    },
  });
}

export async function queueInvoiceReminderDraft(
  organizationId: string,
  invoiceId: string
) {
  await ensureAdminTables();

  const existingId = await findExistingCommunicationByMetadata(
    organizationId,
    "INVOICE_REMINDER",
    "invoiceId",
    invoiceId
  );
  if (existingId) return fetchCommunicationRecord(organizationId, existingId);

  const rows = await sql`
    SELECT id, client_id, property_id, invoice_number, total_cents, due_date
    FROM admin_invoices
    WHERE organization_id = ${organizationId}
      AND id = ${invoiceId}
      AND UPPER(status) = 'OVERDUE'
    LIMIT 1
  `;

  const invoice = rows[0];
  if (!invoice) return null;

  return createCommunicationRecord(organizationId, {
    clientId: asOptionalString(invoice.client_id),
    propertyId: asOptionalString(invoice.property_id),
    invoiceId,
    type: "INVOICE_REMINDER",
    status: "DRAFT",
    subject: `Invoice reminder: ${String(invoice.invoice_number ?? "invoice")}`,
    body: buildInvoiceReminderBody(invoice as Record<string, unknown>),
    aiGenerated: true,
    requiresApproval: true,
    metadata: {
      automation: "invoice-reminder",
      invoiceId,
    },
  });
}

export async function ensureCommunicationAutomations(organizationId: string) {
  await ensureAdminTables();

  const dueFollowUps = await sql`
    SELECT
      comm.id,
      comm.client_id,
      comm.property_id,
      comm.job_id,
      comm.invoice_id,
      comm.subject,
      comm.body
    FROM admin_communications comm
    WHERE comm.organization_id = ${organizationId}
      AND UPPER(comm.direction) = 'OUTBOUND'
      AND UPPER(comm.status) = 'SENT'
      AND comm.sent_at IS NOT NULL
      AND comm.last_client_response_at IS NULL
      AND comm.sent_at <= NOW() - INTERVAL '3 days'
      AND UPPER(comm.type) <> 'FOLLOW_UP'
      AND NOT EXISTS (
        SELECT 1
        FROM admin_communications existing
        WHERE existing.organization_id = comm.organization_id
          AND existing.type = 'FOLLOW_UP'
          AND existing.metadata_json ->> 'parentCommunicationId' = comm.id
      )
  `;

  for (const communication of dueFollowUps) {
    await createCommunicationRecord(organizationId, {
      clientId: asOptionalString(communication.client_id),
      propertyId: asOptionalString(communication.property_id),
      jobId: asOptionalString(communication.job_id),
      invoiceId: asOptionalString(communication.invoice_id),
      type: "FOLLOW_UP",
      status: "DRAFT",
      subject: `Follow-up: ${String(communication.subject ?? "Client update")}`,
      body: [
        "Follow up on the message below if a response is still needed.",
        "",
        String(communication.subject ?? "Previous communication"),
        "",
        String(communication.body ?? ""),
      ].join("\n"),
      aiGenerated: true,
      requiresApproval: true,
      metadata: {
        automation: "three-day-follow-up",
        parentCommunicationId: String(communication.id),
      },
    });
  }

  const overdueInvoices = await sql`
    SELECT i.id
    FROM admin_invoices i
    WHERE i.organization_id = ${organizationId}
      AND UPPER(i.status) = 'OVERDUE'
      AND NOT EXISTS (
        SELECT 1
        FROM admin_communications comm
        WHERE comm.organization_id = i.organization_id
          AND comm.invoice_id = i.id
          AND UPPER(comm.type) = 'INVOICE_REMINDER'
      )
    ORDER BY i.due_date ASC NULLS LAST, i.created_at ASC
    LIMIT 10
  `;

  for (const invoice of overdueInvoices) {
    await queueInvoiceReminderDraft(organizationId, String(invoice.id));
  }
}

export async function listCommunications(
  organizationId: string,
  filters: CommunicationFilters = {}
) {
  await ensureAdminTables();
  await ensureCommunicationAutomations(organizationId);

  const status =
    filters.status && filters.status !== "ALL"
      ? normalizeStatus(filters.status)
      : null;
  const clientId = asOptionalString(filters.clientId);
  const awaitingApproval = Boolean(filters.awaitingApproval);
  const includeResolved = Boolean(filters.includeResolved);
  const query = asOptionalString(filters.query)?.toLowerCase() ?? null;

  return sql`
    SELECT
      comm.id,
      comm.organization_id,
      comm.client_id,
      comm.property_id,
      comm.job_id,
      comm.invoice_id,
      comm.channel,
      comm.direction,
      comm.type,
      comm.status,
      comm.subject,
      comm.body,
      comm.ai_generated,
      comm.requires_approval,
      comm.approved_at,
      comm.sent_at,
      comm.last_client_response_at,
      comm.follow_up_due_at,
      comm.metadata_json,
      comm.created_at,
      comm.updated_at,
      c.name AS client_name,
      c.email AS client_email,
      p.name AS property_name,
      p.address_line1 AS property_address_line1,
      j.title AS job_title,
      i.invoice_number,
      i.total_cents AS invoice_total_cents
    FROM admin_communications comm
    LEFT JOIN admin_clients c
      ON c.id = comm.client_id
      AND c.organization_id = comm.organization_id
    LEFT JOIN admin_properties p
      ON p.id = comm.property_id
      AND p.organization_id = comm.organization_id
    LEFT JOIN admin_jobs j
      ON j.id = comm.job_id
      AND j.organization_id = comm.organization_id
    LEFT JOIN admin_invoices i
      ON i.id = comm.invoice_id
      AND i.organization_id = comm.organization_id
    WHERE comm.organization_id = ${organizationId}
      ${status ? sql`AND UPPER(comm.status) = ${status}` : sql``}
      ${clientId ? sql`AND comm.client_id = ${clientId}` : sql``}
      ${
        awaitingApproval
          ? sql`AND comm.requires_approval = TRUE AND comm.approved_at IS NULL AND UPPER(comm.status) = 'DRAFT'`
          : sql``
      }
      ${
        includeResolved
          ? sql``
          : sql`AND UPPER(comm.status) <> 'RESPONDED' AND UPPER(comm.status) <> 'CANCELED'`
      }
      ${
        query
          ? sql`
              AND (
                LOWER(COALESCE(comm.subject, '')) LIKE ${`%${query}%`}
                OR LOWER(COALESCE(comm.body, '')) LIKE ${`%${query}%`}
                OR LOWER(COALESCE(c.name, '')) LIKE ${`%${query}%`}
                OR LOWER(COALESCE(p.name, '')) LIKE ${`%${query}%`}
                OR LOWER(COALESCE(j.title, '')) LIKE ${`%${query}%`}
                OR LOWER(COALESCE(i.invoice_number, '')) LIKE ${`%${query}%`}
              )
            `
          : sql``
      }
    ORDER BY
      CASE
        WHEN comm.requires_approval = TRUE AND comm.approved_at IS NULL AND UPPER(comm.status) = 'DRAFT' THEN 0
        WHEN comm.follow_up_due_at IS NOT NULL AND comm.follow_up_due_at <= NOW() THEN 1
        WHEN UPPER(comm.status) = 'DRAFT' THEN 2
        WHEN UPPER(comm.status) = 'APPROVED' THEN 3
        WHEN UPPER(comm.status) = 'SENT' THEN 4
        ELSE 5
      END,
      COALESCE(comm.follow_up_due_at, comm.created_at) ASC,
      comm.created_at DESC
  `;
}

export async function getCommunicationById(organizationId: string, communicationId: string) {
  await ensureAdminTables();
  return fetchCommunicationRecord(organizationId, communicationId);
}

export async function createCommunication(
  organizationId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  return createCommunicationRecord(organizationId, {
    clientId: asOptionalString(body.clientId),
    propertyId: asOptionalString(body.propertyId),
    jobId: asOptionalString(body.jobId),
    invoiceId: asOptionalString(body.invoiceId),
    channel: normalizeChannel(body.channel),
    direction: normalizeDirection(body.direction),
    type: normalizeType(body.type),
    status: normalizeStatus(body.status),
    subject: asOptionalString(body.subject),
    body: asOptionalString(body.body),
    aiGenerated: Boolean(body.aiGenerated),
    requiresApproval:
      body.requiresApproval === undefined ? true : Boolean(body.requiresApproval),
    approvedAt: parseOptionalTimestamp(body.approvedAt, "approvedAt"),
    sentAt: parseOptionalTimestamp(body.sentAt, "sentAt"),
    lastClientResponseAt: parseOptionalTimestamp(
      body.lastClientResponseAt,
      "lastClientResponseAt"
    ),
    followUpDueAt: parseOptionalTimestamp(body.followUpDueAt, "followUpDueAt"),
    metadata:
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : null,
  });
}

export async function updateCommunication(
  organizationId: string,
  communicationId: string,
  body: Record<string, unknown>
) {
  await ensureAdminTables();

  const existing = await fetchCommunicationRecord(organizationId, communicationId);
  if (!existing) return null;

  const nextStatus =
    body.status === undefined ? normalizeStatus(existing.status) : normalizeStatus(body.status);
  const nextChannel =
    body.channel === undefined ? normalizeChannel(existing.channel) : normalizeChannel(body.channel);
  const nextDirection =
    body.direction === undefined
      ? normalizeDirection(existing.direction)
      : normalizeDirection(body.direction);
  const nextType =
    body.type === undefined ? normalizeType(existing.type) : normalizeType(body.type);
  const nextSubject =
    body.subject === undefined ? asOptionalString(existing.subject) : asOptionalString(body.subject);
  const nextBody =
    body.body === undefined ? asOptionalString(existing.body) : asOptionalString(body.body);
  const requiresApproval =
    body.requiresApproval === undefined
      ? Boolean(existing.requires_approval)
      : Boolean(body.requiresApproval);

  const explicitApprovedAt = parseOptionalTimestamp(body.approvedAt, "approvedAt");
  const explicitSentAt = parseOptionalTimestamp(body.sentAt, "sentAt");
  const explicitClientResponseAt = parseOptionalTimestamp(
    body.lastClientResponseAt,
    "lastClientResponseAt"
  );

  const approvedAt =
    nextStatus === "APPROVED"
      ? explicitApprovedAt ?? coerceOptionalTimestamp(existing.approved_at) ?? new Date().toISOString()
      : nextStatus === "SENT" && requiresApproval
        ? explicitApprovedAt ?? coerceOptionalTimestamp(existing.approved_at)
        : explicitApprovedAt ?? coerceOptionalTimestamp(existing.approved_at);

  if (nextStatus === "SENT" && requiresApproval && !approvedAt) {
    throw new Error("Approval is required before marking this communication as sent");
  }

  const sentAt =
    nextStatus === "SENT"
      ? explicitSentAt ?? coerceOptionalTimestamp(existing.sent_at) ?? new Date().toISOString()
      : explicitSentAt ?? coerceOptionalTimestamp(existing.sent_at);

  const lastClientResponseAt =
    nextStatus === "RESPONDED"
      ? explicitClientResponseAt ??
        coerceOptionalTimestamp(existing.last_client_response_at) ??
        new Date().toISOString()
      : explicitClientResponseAt ?? coerceOptionalTimestamp(existing.last_client_response_at);

  const followUpDueAt =
    body.followUpDueAt !== undefined
      ? parseOptionalTimestamp(body.followUpDueAt, "followUpDueAt")
      : lastClientResponseAt
        ? null
        : nextDirection === "OUTBOUND" && nextStatus === "SENT" && sentAt
          ? addDays(sentAt, 3)
          : coerceOptionalTimestamp(existing.follow_up_due_at);

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : ((existing.metadata_json as Record<string, unknown> | null | undefined) ?? null);

  await sql.begin(async (tx) => {
    await tx`
      UPDATE admin_communications
      SET
        channel = ${nextChannel},
        direction = ${nextDirection},
        type = ${nextType},
        status = ${nextStatus},
        subject = ${nextSubject},
        body = ${nextBody},
        requires_approval = ${requiresApproval},
        approved_at = ${approvedAt ?? null},
        sent_at = ${sentAt ?? null},
        last_client_response_at = ${lastClientResponseAt ?? null},
        follow_up_due_at = ${followUpDueAt ?? null},
        metadata_json = ${toMetadataValue(metadata)},
        updated_at = NOW()
      WHERE organization_id = ${organizationId}
        AND id = ${communicationId}
    `;

    if (existing.client_id && (nextStatus === "SENT" || nextStatus === "RESPONDED")) {
      await tx`
        UPDATE admin_clients
        SET
          last_contacted_at = ${nextStatus === "RESPONDED" ? lastClientResponseAt : sentAt},
          welcome_email_sent_at = CASE
            WHEN ${nextType} = 'WELCOME' AND ${nextStatus} = 'SENT'
              THEN COALESCE(welcome_email_sent_at, ${sentAt})
            ELSE welcome_email_sent_at
          END,
          updated_at = NOW()
        WHERE organization_id = ${organizationId}
          AND id = ${existing.client_id}
      `;
    }
  });

  return fetchCommunicationRecord(organizationId, communicationId);
}
