import { ensureAdminTables, sql } from "@/lib/server/db";
import { asNonEmptyString, asOptionalString } from "@/lib/server/validation";

type RetainerStatus = "ACTIVE" | "PAUSED" | "CANCELED";
type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";

function addFrequency(date: Date, frequency: Frequency, interval: number) {
    const d = new Date(date);
  
    if (frequency === "DAILY") {
      d.setDate(d.getDate() + interval);
    } else if (frequency === "WEEKLY") {
      d.setDate(d.getDate() + interval * 7);
    } else if (frequency === "MONTHLY") {
      d.setMonth(d.getMonth() + interval);
    } else {
      throw new Error("Invalid service frequency");
    }
  
    return d;
  }
  
  function normalizeAnchorDate(value: string | null | undefined) {
    if (!value) return new Date();
  
    const d = new Date(`${value}T09:00:00`);
    if (Number.isNaN(d.getTime())) return new Date();
  
    return d;
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
      p.address_line1 AS property_address_line1
    FROM admin_retainers r
    LEFT JOIN admin_clients c
      ON c.id = r.client_id
      AND c.organization_id = r.organization_id
    LEFT JOIN admin_properties p
      ON p.id = r.property_id
      AND p.organization_id = r.organization_id
    WHERE r.organization_id = ${organizationId}
    ORDER BY r.created_at DESC
  `;
}

export async function getRetainerById(organizationId: string, id: string) {
  await ensureAdminTables();

  const rows = await sql`
    SELECT *
    FROM admin_retainers
    WHERE id = ${id} AND organization_id = ${organizationId}
    LIMIT 1
  `;

  return rows[0] ?? null;
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
  
    const billingFrequency = asNonEmptyString(
      body.billingFrequency,
      "billingFrequency"
    ).toUpperCase() as Frequency;
  
    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(billingFrequency)) {
      throw new Error("billingFrequency must be DAILY, WEEKLY, or MONTHLY");
    }
  
    const billingInterval = Math.max(1, Number(body.billingInterval ?? 1));
    if (!Number.isFinite(billingInterval) || billingInterval < 1) {
      throw new Error("billingInterval must be at least 1");
    }
  
    const billingAnchorDate = asOptionalString(body.billingAnchorDate);
  
    const serviceFrequency = (
      asOptionalString(body.serviceFrequency)?.toUpperCase() || "WEEKLY"
    ) as Frequency;
  
    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(serviceFrequency)) {
      throw new Error("serviceFrequency must be DAILY, WEEKLY, or MONTHLY");
    }
  
    const serviceInterval = Math.max(1, Number(body.serviceInterval ?? 1));
    if (!Number.isFinite(serviceInterval) || serviceInterval < 1) {
      throw new Error("serviceInterval must be at least 1");
    }
  
    const serviceAnchorDate =
      asOptionalString(body.serviceAnchorDate) || billingAnchorDate;
  
    const status = (
      asOptionalString(body.status)?.toUpperCase() || "ACTIVE"
    ) as RetainerStatus;
  
    if (!["ACTIVE", "PAUSED", "CANCELED"].includes(status)) {
      throw new Error("status must be ACTIVE, PAUSED, or CANCELED");
    }
  
    const clientRows = await sql`
      SELECT id
      FROM admin_clients
      WHERE id = ${clientId} AND organization_id = ${organizationId}
      LIMIT 1
    `;
    if (!clientRows[0]) throw new Error("Selected client not found");
  
    if (propertyId) {
      const propertyRows = await sql`
        SELECT id
        FROM admin_properties
        WHERE id = ${propertyId} AND organization_id = ${organizationId}
        LIMIT 1
      `;
      if (!propertyRows[0]) throw new Error("Selected property not found");
    }
  
    const rows = await sql`
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
        ${amountCents},
        ${billingFrequency},
        ${billingInterval},
        ${billingAnchorDate},
        ${serviceFrequency},
        ${serviceInterval},
        ${serviceAnchorDate},
        ${status},
        ${notes}
      )
      RETURNING *
    `;
  
    return rows[0];
  }

  export async function updateRetainer(
    organizationId: string,
    id: string,
    body: Record<string, unknown>
  ) {
    await ensureAdminTables();
  
    const existing = await sql`
      SELECT *
      FROM admin_retainers
      WHERE id = ${id} AND organization_id = ${organizationId}
      LIMIT 1
    `;
  
    if (!existing[0]) return null;
    const current = existing[0];
  
    const clientId =
      body.clientId !== undefined
        ? asNonEmptyString(body.clientId, "clientId")
        : current.client_id;
  
    const propertyId =
      body.propertyId !== undefined
        ? asOptionalString(body.propertyId)
        : current.property_id;
  
    const name =
      body.name !== undefined
        ? asNonEmptyString(body.name, "name")
        : current.name;
  
    const notes =
      body.notes !== undefined
        ? asOptionalString(body.notes)
        : current.notes;
  
    const amountCents =
      body.amountCents !== undefined ? Number(body.amountCents) : current.amount_cents;
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new Error("amountCents must be greater than 0");
    }
  
    const billingFrequency =
      body.billingFrequency !== undefined
        ? asNonEmptyString(body.billingFrequency, "billingFrequency").toUpperCase()
        : current.billing_frequency;
  
    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(billingFrequency)) {
      throw new Error("billingFrequency must be DAILY, WEEKLY, or MONTHLY");
    }
  
    const billingInterval =
      body.billingInterval !== undefined
        ? Math.max(1, Number(body.billingInterval))
        : current.billing_interval;
  
    if (!Number.isFinite(billingInterval) || billingInterval < 1) {
      throw new Error("billingInterval must be at least 1");
    }
  
    const billingAnchorDate =
      body.billingAnchorDate !== undefined
        ? asOptionalString(body.billingAnchorDate)
        : current.billing_anchor_date;
  
    const serviceFrequency =
      body.serviceFrequency !== undefined
        ? asNonEmptyString(body.serviceFrequency, "serviceFrequency").toUpperCase()
        : current.service_frequency;
  
    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(serviceFrequency)) {
      throw new Error("serviceFrequency must be DAILY, WEEKLY, or MONTHLY");
    }
  
    const serviceInterval =
      body.serviceInterval !== undefined
        ? Math.max(1, Number(body.serviceInterval))
        : current.service_interval;
  
    if (!Number.isFinite(serviceInterval) || serviceInterval < 1) {
      throw new Error("serviceInterval must be at least 1");
    }
  
    const serviceAnchorDate =
      body.serviceAnchorDate !== undefined
        ? asOptionalString(body.serviceAnchorDate)
        : current.service_anchor_date;
  
    const status =
      body.status !== undefined
        ? asNonEmptyString(body.status, "status").toUpperCase()
        : current.status;
  
    if (!["ACTIVE", "PAUSED", "CANCELED"].includes(status)) {
      throw new Error("status must be ACTIVE, PAUSED, or CANCELED");
    }
  
    const rows = await sql`
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
        status = ${status},
        notes = ${notes},
        updated_at = NOW()
      WHERE id = ${id} AND organization_id = ${organizationId}
      RETURNING *
    `;
  
    return rows[0] ?? null;
  }

  export async function syncRetainerJobs(
    organizationId: string,
    retainerId: string
  ) {
    await ensureAdminTables();
  
    const retainerRows = await sql`
      SELECT *
      FROM admin_retainers
      WHERE id = ${retainerId} AND organization_id = ${organizationId}
      LIMIT 1
    `;
  
    const retainer = retainerRows[0];
    if (!retainer) return null;
  
    // Always clear future uncompleted generated jobs for this retainer,
    // then rebuild from current service schedule.
    await sql`
      DELETE FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND retainer_id = ${retainerId}
        AND completed_at IS NULL
        AND scheduled_for >= NOW()
    `;
  
    if (retainer.status !== "ACTIVE") {
      return retainer;
    }
  
    const serviceFrequency = String(retainer.service_frequency).toUpperCase() as Frequency;
    const serviceInterval = Math.max(1, Number(retainer.service_interval ?? 1));
  
    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(serviceFrequency)) {
      throw new Error("Invalid retainer service frequency");
    }
  
    const now = new Date();
    const horizon = new Date();
    horizon.setMonth(horizon.getMonth() + 3); // generate ~90 days ahead
  
    let cursor = normalizeAnchorDate(retainer.service_anchor_date);
  
    // Advance anchor forward until it is at/after now
    let safety = 0;
    while (cursor < now && safety < 500) {
      cursor = addFrequency(cursor, serviceFrequency, serviceInterval);
      safety += 1;
    }
  
    let insertSafety = 0;
    while (cursor <= horizon && insertSafety < 200) {
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
          price_cents
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
          ${null}
        )
      `;
  
      cursor = addFrequency(cursor, serviceFrequency, serviceInterval);
      insertSafety += 1;
    }
  
    return retainer;
  }