import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString, asPositiveInt } from "@/lib/server/validation";

const allowedStatuses = new Set(["SCHEDULED", "IN_PROGRESS", "DONE", "CANCELED"]);

function asOptionalInt(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Integer field must be an integer number");
  }
  return value;
}

function asOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number") throw new Error("Number field must be a number");
  return value;
}

export async function listJobs(organizationId: string, opts?: { start?: Date; end?: Date }) {
  await ensureAdminTables();

  if (opts?.start && opts?.end) {
    return sql`
      SELECT *
      FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND scheduled_for >= ${opts.start.toISOString()}
        AND scheduled_for < ${opts.end.toISOString()}
      ORDER BY scheduled_for ASC
    `;
  }

  return sql`
    SELECT *
    FROM admin_jobs
    WHERE organization_id = ${organizationId}
    ORDER BY scheduled_for ASC
  `;
}

export async function createJob(organizationId: string, body: Record<string, unknown>) {
  await ensureAdminTables();

  const id = crypto.randomUUID();
  const title = asNonEmptyString(body.title, "title");
  const notes = asOptionalString(body.notes);
  const clientId = asOptionalString(body.clientId);
  const propertyId = asOptionalString(body.propertyId);
  const orderId = asOptionalString(body.orderId);

  const scheduledForRaw = body.scheduledFor;
  if (typeof scheduledForRaw !== "string" || scheduledForRaw.trim() === "") {
    throw new Error("scheduledFor must be an ISO datetime string");
  }
  const scheduledFor = new Date(scheduledForRaw);
  if (Number.isNaN(scheduledFor.getTime())) {
    throw new Error("scheduledFor must be a valid ISO datetime string");
  }

  const statusRaw = body.status;
  const status =
    statusRaw === undefined || statusRaw === null || statusRaw === ""
      ? "SCHEDULED"
      : (() => {
          if (typeof statusRaw !== "string" || !allowedStatuses.has(statusRaw)) {
            throw new Error("status must be one of: SCHEDULED, IN_PROGRESS, DONE, CANCELED");
          }
          return statusRaw;
        })();

  const durationMinutes = body.durationMinutes !== undefined ? asOptionalInt(body.durationMinutes) : null;
  const hoursNumeric = body.hours !== undefined ? asOptionalNumber(body.hours) : null;

  const priceCents =
    body.priceCents === undefined || body.priceCents === null || body.priceCents === ""
      ? null
      : asPositiveInt(body.priceCents, "priceCents");

  const rows = await sql`
    INSERT INTO admin_jobs (
      id, organization_id, client_id, property_id, order_id,
      title, notes, status, scheduled_for, duration_minutes, hours_numeric, price_cents
    )
    VALUES (
      ${id}, ${organizationId}, ${clientId}, ${propertyId}, ${orderId},
      ${title}, ${notes}, ${status}, ${scheduledFor.toISOString()},
      ${durationMinutes}, ${hoursNumeric}, ${priceCents}
    )
    RETURNING *
  `;

  return rows[0];
}