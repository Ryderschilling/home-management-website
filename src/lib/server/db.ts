import postgres from "postgres";
import { env } from "@/lib/server/env";

const ADMIN_SCHEMA_VERSION = 18;
const ADMIN_SCHEMA_LOCK_PRIMARY = 30;
const ADMIN_SCHEMA_LOCK_SECONDARY = 1;
const RECURRING_SERIES_BACKFILL_KEY = "admin_jobs_recurring_series_backfill_v1";

const globalForDb = globalThis as unknown as {
  sql: postgres.Sql | undefined;
  adminSchemaVersion: number | undefined;
  adminSchemaReadyPromise: Promise<void> | undefined;
};

export const sql =
  globalForDb.sql ?? postgres(env.DATABASE_URL, { prepare: false, max: 5 });

if (!globalForDb.sql) globalForDb.sql = sql;

export async function ensureQrAddonColumns(): Promise<void> {
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS addon_product_key TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS addon_product_name TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS addon_price_cents INTEGER`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS electrical_box_photo_url TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS electrical_box_width TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS electrical_box_depth TEXT`;
  await sql`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS electrical_box_height TEXT`;
}

export async function ensureAdminTables(): Promise<void> {
  if (process.env.VERCEL_ENV === "production") return;
  if (globalForDb.adminSchemaVersion === ADMIN_SCHEMA_VERSION) return;
  if (globalForDb.adminSchemaReadyPromise) return globalForDb.adminSchemaReadyPromise;

  const readyPromise = sql.begin(async (tx) => {
    // Serialize bootstrap across concurrent dev requests and local workers.
    await tx`SELECT pg_advisory_xact_lock(${ADMIN_SCHEMA_LOCK_PRIMARY}, ${ADMIN_SCHEMA_LOCK_SECONDARY})`;

    await tx`CREATE TABLE IF NOT EXISTS admin_clients (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_clients_org_idx ON admin_clients (organization_id)`;

    await tx`CREATE TABLE IF NOT EXISTS admin_properties (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      client_id TEXT,
      name TEXT NOT NULL,
      address_line1 TEXT NOT NULL,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      gate_code TEXT,
      door_code TEXT,
      garage_code TEXT,
      alarm_code TEXT,
      wifi_name TEXT,
      wifi_password TEXT,
      trash_day TEXT,
      hvac_filter_size TEXT,
      irrigation_notes TEXT,
      access_notes TEXT,
      notes TEXT,
      entry TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_properties_client_fk
        FOREIGN KEY (client_id)
        REFERENCES admin_clients(id)
        ON DELETE SET NULL
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_properties_org_idx ON admin_properties (organization_id)`;
    await tx`CREATE INDEX IF NOT EXISTS admin_properties_client_idx ON admin_properties (organization_id, client_id)`;

    await tx`CREATE TABLE IF NOT EXISTS admin_services (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      unit_price_cents INTEGER NOT NULL,
      cost_cents INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_services_org_idx ON admin_services (organization_id)`;

    await tx`CREATE TABLE IF NOT EXISTS admin_orders (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      client_id TEXT,
      property_id TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      total_amount_cents INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_orders_client_fk
        FOREIGN KEY (client_id)
        REFERENCES admin_clients(id)
        ON DELETE SET NULL,
      CONSTRAINT admin_orders_property_fk
        FOREIGN KEY (property_id)
        REFERENCES admin_properties(id)
        ON DELETE SET NULL
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_orders_org_idx ON admin_orders (organization_id, status)`;

    await tx`CREATE TABLE IF NOT EXISTS admin_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_order_items_order_fk
        FOREIGN KEY (order_id)
        REFERENCES admin_orders(id)
        ON DELETE CASCADE,
      CONSTRAINT admin_order_items_service_fk
        FOREIGN KEY (service_id)
        REFERENCES admin_services(id)
        ON DELETE RESTRICT
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_order_items_order_idx ON admin_order_items (order_id)`;

    // ✅ Retainers: billing recurrence (separate from job recurrence)
    await tx`CREATE TABLE IF NOT EXISTS admin_retainers (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      property_id TEXT,
      name TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      billing_frequency TEXT NOT NULL,
      billing_interval INTEGER NOT NULL DEFAULT 1,
      billing_anchor_date DATE,
      service_frequency TEXT NOT NULL DEFAULT 'WEEKLY',
      service_interval INTEGER NOT NULL DEFAULT 1,
      service_anchor_date DATE,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_retainers_client_fk
        FOREIGN KEY (client_id)
        REFERENCES admin_clients(id)
        ON DELETE CASCADE,
      CONSTRAINT admin_retainers_property_fk
        FOREIGN KEY (property_id)
        REFERENCES admin_properties(id)
        ON DELETE SET NULL
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_retainers_org_idx ON admin_retainers (organization_id, client_id)`;
    await tx`CREATE INDEX IF NOT EXISTS admin_retainers_status_idx ON admin_retainers (organization_id, status)`;

    await tx`ALTER TABLE admin_retainers ADD COLUMN IF NOT EXISTS service_frequency TEXT NOT NULL DEFAULT 'WEEKLY'`;
    await tx`ALTER TABLE admin_retainers ADD COLUMN IF NOT EXISTS service_interval INTEGER NOT NULL DEFAULT 1`;
    await tx`ALTER TABLE admin_retainers ADD COLUMN IF NOT EXISTS service_anchor_date DATE`;


    await tx`CREATE TABLE IF NOT EXISTS admin_jobs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      client_id TEXT,
      property_id TEXT,
      service_id TEXT,
      order_id TEXT,
      retainer_id TEXT,
      title TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      scheduled_for TIMESTAMPTZ NOT NULL,
      duration_minutes INTEGER,
      hours_numeric NUMERIC,
      price_cents INTEGER,
      completed_at TIMESTAMPTZ,
      recurrence_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      recurrence_frequency TEXT,
      recurrence_interval INTEGER,
      recurrence_end_date TIMESTAMPTZ,
      parent_job_id TEXT,
      recurring_series_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_jobs_client_fk
        FOREIGN KEY (client_id)
        REFERENCES admin_clients(id)
        ON DELETE SET NULL,
      CONSTRAINT admin_jobs_property_fk
        FOREIGN KEY (property_id)
        REFERENCES admin_properties(id)
        ON DELETE SET NULL,
      CONSTRAINT admin_jobs_service_fk
        FOREIGN KEY (service_id)
        REFERENCES admin_services(id)
        ON DELETE SET NULL,
      CONSTRAINT admin_jobs_order_fk
        FOREIGN KEY (order_id)
        REFERENCES admin_orders(id)
        ON DELETE SET NULL,
      CONSTRAINT admin_jobs_parent_fk
        FOREIGN KEY (parent_job_id)
        REFERENCES admin_jobs(id)
        ON DELETE SET NULL,
      CONSTRAINT admin_jobs_retainer_fk
        FOREIGN KEY (retainer_id)
        REFERENCES admin_retainers(id)
        ON DELETE SET NULL
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_jobs_org_idx ON admin_jobs (organization_id, scheduled_for)`;
    await tx`CREATE INDEX IF NOT EXISTS admin_jobs_status_idx ON admin_jobs (organization_id, status)`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'MANUAL'`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS source_key TEXT`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS source_plan_occurrence_date DATE`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS plan_visit_modified BOOLEAN NOT NULL DEFAULT FALSE`;
    await tx`CREATE UNIQUE INDEX IF NOT EXISTS admin_jobs_source_key_uq
      ON admin_jobs (organization_id, source_key)
      WHERE source_key IS NOT NULL`;
    await tx`CREATE INDEX IF NOT EXISTS admin_jobs_source_type_idx
      ON admin_jobs (organization_id, source_type, scheduled_for)`;
    await tx`CREATE INDEX IF NOT EXISTS admin_jobs_plan_occurrence_idx
      ON admin_jobs (organization_id, retainer_id, source_plan_occurrence_date)`;

    await tx`CREATE TABLE IF NOT EXISTS admin_job_photos (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      url TEXT NOT NULL,
      caption TEXT,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_job_photos_job_fk
        FOREIGN KEY (job_id)
        REFERENCES admin_jobs(id)
        ON DELETE CASCADE
    )`;

    await tx`CREATE TABLE IF NOT EXISTS admin_order_photos (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      url TEXT NOT NULL,
      caption TEXT,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_order_photos_order_fk
        FOREIGN KEY (order_id)
        REFERENCES admin_orders(id)
        ON DELETE CASCADE
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_order_photos_order_idx
      ON admin_order_photos (organization_id, order_id, uploaded_at)`;


    await tx`CREATE INDEX IF NOT EXISTS admin_job_photos_job_idx ON admin_job_photos (job_id, uploaded_at)`;

    await tx`CREATE TABLE IF NOT EXISTS admin_invoices (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      client_id TEXT,
      property_id TEXT,
      retainer_id TEXT,
      invoice_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      period_start DATE,
      period_end DATE,
      issue_date DATE,
      due_date DATE,
      subtotal_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_invoices_client_fk
        FOREIGN KEY (client_id)
        REFERENCES admin_clients(id)
        ON DELETE SET NULL,
      CONSTRAINT admin_invoices_property_fk
        FOREIGN KEY (property_id)
        REFERENCES admin_properties(id)
        ON DELETE SET NULL,
      CONSTRAINT admin_invoices_retainer_fk
        FOREIGN KEY (retainer_id)
        REFERENCES admin_retainers(id)
        ON DELETE SET NULL
    )`;
    await tx`CREATE UNIQUE INDEX IF NOT EXISTS admin_invoices_org_number_uq
      ON admin_invoices (organization_id, invoice_number)`;
    await tx`CREATE INDEX IF NOT EXISTS admin_invoices_org_status_idx
      ON admin_invoices (organization_id, status, issue_date DESC, created_at DESC)`;
    await tx`CREATE INDEX IF NOT EXISTS admin_invoices_client_idx
      ON admin_invoices (organization_id, client_id, created_at DESC)`;

    await tx`CREATE TABLE IF NOT EXISTS admin_invoice_line_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      job_id TEXT,
      retainer_id TEXT,
      description TEXT NOT NULL,
      quantity NUMERIC NOT NULL DEFAULT 1,
      unit_price_cents INTEGER NOT NULL DEFAULT 0,
      line_total_cents INTEGER NOT NULL DEFAULT 0,
      line_type TEXT NOT NULL DEFAULT 'MANUAL',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_invoice_line_items_invoice_fk
        FOREIGN KEY (invoice_id)
        REFERENCES admin_invoices(id)
        ON DELETE CASCADE,
      CONSTRAINT admin_invoice_line_items_job_fk
        FOREIGN KEY (job_id)
        REFERENCES admin_jobs(id)
        ON DELETE SET NULL,
      CONSTRAINT admin_invoice_line_items_retainer_fk
        FOREIGN KEY (retainer_id)
        REFERENCES admin_retainers(id)
        ON DELETE SET NULL
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_invoice_line_items_invoice_idx
      ON admin_invoice_line_items (organization_id, invoice_id, created_at)`;

    await tx`CREATE TABLE IF NOT EXISTS admin_bootstrap_state (
      key TEXT PRIMARY KEY,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    // Safe adds (existing DBs)
    await tx`ALTER TABLE admin_clients ADD COLUMN IF NOT EXISTS notes TEXT`;

    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS city TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS state TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS postal_code TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS gate_code TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS door_code TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS garage_code TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS alarm_code TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS wifi_name TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS wifi_password TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS trash_day TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS hvac_filter_size TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS irrigation_notes TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS access_notes TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS notes TEXT`;
    await tx`ALTER TABLE admin_properties ADD COLUMN IF NOT EXISTS entry TEXT`;

    await tx`ALTER TABLE admin_services ADD COLUMN IF NOT EXISTS cost_cents INTEGER NOT NULL DEFAULT 0`;

    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS service_id TEXT`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS retainer_id TEXT`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS recurrence_enabled BOOLEAN NOT NULL DEFAULT FALSE`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMPTZ`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS parent_job_id TEXT`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS recurring_series_id TEXT`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'MANUAL'`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS source_key TEXT`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS source_plan_occurrence_date DATE`;
    await tx`ALTER TABLE admin_jobs ADD COLUMN IF NOT EXISTS plan_visit_modified BOOLEAN NOT NULL DEFAULT FALSE`;
    const recurringSeriesBackfillState = await tx`
      SELECT key
      FROM admin_bootstrap_state
      WHERE key = ${RECURRING_SERIES_BACKFILL_KEY}
      LIMIT 1
    `;
    if (!recurringSeriesBackfillState[0]) {
      await tx`
        UPDATE admin_jobs
        SET recurring_series_id = COALESCE(recurring_series_id, parent_job_id, id)
        WHERE source_type = 'MANUAL'
          AND recurrence_enabled = TRUE
          AND recurring_series_id IS NULL
      `;
      await tx`
        INSERT INTO admin_bootstrap_state (key)
        VALUES (${RECURRING_SERIES_BACKFILL_KEY})
        ON CONFLICT (key)
        DO UPDATE SET updated_at = NOW()
      `;
    }

    await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS source TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS rock_color TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS customer_name TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS customer_email TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS customer_phone TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS service_address TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS pipe_height_inches TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS pipe_width_inches TEXT`;

await tx`ALTER TABLE admin_clients ADD COLUMN IF NOT EXISTS address_text TEXT`;
await tx`ALTER TABLE admin_clients ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
await tx`CREATE UNIQUE INDEX IF NOT EXISTS admin_clients_org_email_uq
  ON admin_clients (organization_id, lower(email))
  WHERE email IS NOT NULL AND email <> ''`;

await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS product_key TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS addon_product_key TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS addon_product_name TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS addon_price_cents INTEGER`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS electrical_box_photo_url TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS electrical_box_width TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS electrical_box_depth TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS electrical_box_height TEXT`;
await tx`CREATE INDEX IF NOT EXISTS admin_orders_stripe_session_idx ON admin_orders (organization_id, stripe_session_id)`;
await tx`CREATE INDEX IF NOT EXISTS admin_orders_client_idx ON admin_orders (organization_id, client_id)`;

await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'NEW'`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMPTZ`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS thank_you_sent_at TIMESTAMPTZ`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS follow_up_email_sent_at TIMESTAMPTZ`;
await tx`CREATE INDEX IF NOT EXISTS admin_orders_fulfillment_idx ON admin_orders (organization_id, fulfillment_status, created_at)`;
await tx`CREATE INDEX IF NOT EXISTS admin_orders_follow_up_ready_idx
  ON admin_orders (organization_id, installed_at)
  WHERE fulfillment_status = 'INSTALLED' AND follow_up_email_sent_at IS NULL`;

await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS tos_version TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS tos_url TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS tos_ip TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS tos_user_agent TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS tos_text_hash TEXT`;

await tx`CREATE INDEX IF NOT EXISTS admin_orders_tos_idx
  ON admin_orders (organization_id, tos_accepted_at)`;

  await tx`CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    campaign_code TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'flyer',
    landing_path TEXT NOT NULL DEFAULT '/qr',
    flyers_sent INTEGER NOT NULL DEFAULT 0,
    print_cost_cents INTEGER NOT NULL DEFAULT 0,
    distribution_cost_cents INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  
  await tx`CREATE UNIQUE INDEX IF NOT EXISTS marketing_campaigns_org_code_uq
    ON marketing_campaigns (organization_id, campaign_code)`;
  
  await tx`CREATE INDEX IF NOT EXISTS marketing_campaigns_org_created_idx
    ON marketing_campaigns (organization_id, created_at DESC)`;
  
  await tx`CREATE TABLE IF NOT EXISTS marketing_campaign_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    campaign_id TEXT,
    campaign_code TEXT,
    session_key TEXT,
    event_type TEXT NOT NULL,
    page_path TEXT,
    order_id TEXT,
    metadata_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  
  await tx`CREATE INDEX IF NOT EXISTS marketing_campaign_events_org_type_idx
    ON marketing_campaign_events (organization_id, event_type, created_at DESC)`;
  
  await tx`CREATE INDEX IF NOT EXISTS marketing_campaign_events_campaign_idx
    ON marketing_campaign_events (organization_id, campaign_id, created_at DESC)`;

    await tx`CREATE TABLE IF NOT EXISTS marketing_email_leads (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      campaign_id TEXT,
      campaign_code TEXT,
      session_key TEXT,
      first_name TEXT,
      email TEXT NOT NULL,
      consent_text TEXT,
      consent_at TIMESTAMPTZ,
      source_page TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    
    await tx`CREATE UNIQUE INDEX IF NOT EXISTS marketing_email_leads_org_email_uq
      ON marketing_email_leads (organization_id, lower(email))`;
    
    await tx`CREATE INDEX IF NOT EXISTS marketing_email_leads_campaign_idx
      ON marketing_email_leads (organization_id, campaign_id, created_at DESC)`;
  
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS campaign_id TEXT`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS campaign_code TEXT`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS landing_path TEXT`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS browser_session_key TEXT`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS checkout_started_at TIMESTAMPTZ`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS upload_completed_at TIMESTAMPTZ`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS used_promotion_code BOOLEAN NOT NULL DEFAULT FALSE`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS promotion_code TEXT`;
  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS discount_amount_cents INTEGER NOT NULL DEFAULT 0`;
  
  await tx`CREATE INDEX IF NOT EXISTS admin_orders_campaign_idx
    ON admin_orders (organization_id, campaign_id, created_at DESC)`;
  
  await tx`CREATE INDEX IF NOT EXISTS admin_orders_campaign_code_idx
    ON admin_orders (organization_id, campaign_code, created_at DESC)`;

  await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_code TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_coupon_id TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_promotion_code_id TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_promo_code_id TEXT`;
await tx`ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS referral_created_at TIMESTAMPTZ`;

await tx`CREATE INDEX IF NOT EXISTS admin_orders_referral_code_idx
  ON admin_orders (organization_id, referral_code)`;

await tx`CREATE INDEX IF NOT EXISTS admin_jobs_retainer_idx ON admin_jobs (organization_id, retainer_id)`;
await tx`CREATE UNIQUE INDEX IF NOT EXISTS admin_jobs_source_key_uq
  ON admin_jobs (organization_id, source_key)
  WHERE source_key IS NOT NULL`;
await tx`CREATE INDEX IF NOT EXISTS admin_jobs_source_type_idx
  ON admin_jobs (organization_id, source_type, scheduled_for)`;
await tx`CREATE INDEX IF NOT EXISTS admin_jobs_plan_occurrence_idx
  ON admin_jobs (organization_id, retainer_id, source_plan_occurrence_date)`;
await tx`CREATE INDEX IF NOT EXISTS admin_jobs_recurring_series_idx
  ON admin_jobs (organization_id, recurring_series_id, scheduled_for)
  WHERE recurring_series_id IS NOT NULL`;
await tx`CREATE TABLE IF NOT EXISTS admin_invoices (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT,
  property_id TEXT,
  retainer_id TEXT,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  period_start DATE,
  period_end DATE,
  issue_date DATE,
  due_date DATE,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS client_id TEXT`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS property_id TEXT`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS retainer_id TEXT`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT'`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS period_start DATE`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS period_end DATE`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS issue_date DATE`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS due_date DATE`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER NOT NULL DEFAULT 0`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS total_cents INTEGER NOT NULL DEFAULT 0`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS notes TEXT`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
await tx`ALTER TABLE admin_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
await tx`CREATE UNIQUE INDEX IF NOT EXISTS admin_invoices_org_number_uq
  ON admin_invoices (organization_id, invoice_number)`;
await tx`CREATE INDEX IF NOT EXISTS admin_invoices_org_status_idx
  ON admin_invoices (organization_id, status, issue_date DESC, created_at DESC)`;
await tx`CREATE INDEX IF NOT EXISTS admin_invoices_client_idx
  ON admin_invoices (organization_id, client_id, created_at DESC)`;
await tx`CREATE TABLE IF NOT EXISTS admin_invoice_line_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  job_id TEXT,
  retainer_id TEXT,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  line_total_cents INTEGER NOT NULL DEFAULT 0,
  line_type TEXT NOT NULL DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS invoice_id TEXT`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS organization_id TEXT`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS job_id TEXT`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS retainer_id TEXT`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS description TEXT`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS quantity NUMERIC NOT NULL DEFAULT 1`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS unit_price_cents INTEGER NOT NULL DEFAULT 0`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS line_total_cents INTEGER NOT NULL DEFAULT 0`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS line_type TEXT NOT NULL DEFAULT 'MANUAL'`;
await tx`ALTER TABLE admin_invoice_line_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
await tx`CREATE INDEX IF NOT EXISTS admin_invoice_line_items_invoice_idx
  ON admin_invoice_line_items (organization_id, invoice_id, created_at)`;

    // FK for retainer_id if missing (older DB)
    await tx`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'admin_jobs_retainer_fk'
        ) THEN
          ALTER TABLE admin_jobs
          ADD CONSTRAINT admin_jobs_retainer_fk
          FOREIGN KEY (retainer_id)
          REFERENCES admin_retainers(id)
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `;
  });

  globalForDb.adminSchemaReadyPromise = readyPromise;

  try {
    await readyPromise;
    globalForDb.adminSchemaVersion = ADMIN_SCHEMA_VERSION;
  } finally {
    globalForDb.adminSchemaReadyPromise = undefined;
  }
}
