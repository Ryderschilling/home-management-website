import postgres from "postgres";
import { env } from "@/lib/server/env";

const ADMIN_SCHEMA_VERSION = 15;

const globalForDb = globalThis as unknown as {
  sql: postgres.Sql | undefined;
  adminSchemaVersion: number | undefined;
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

  await sql.begin(async (tx) => {
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
await tx`CREATE INDEX IF NOT EXISTS admin_orders_fulfillment_idx ON admin_orders (organization_id, fulfillment_status, created_at)`;

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

  globalForDb.adminSchemaVersion = ADMIN_SCHEMA_VERSION;
}
