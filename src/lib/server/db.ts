import postgres from "postgres";
import { env } from "@/lib/server/env";

const ADMIN_SCHEMA_VERSION = 2; // bump this any time you add/modify columns

const globalForDb = globalThis as unknown as {
  sql: postgres.Sql | undefined;
  adminSchemaVersion: number | undefined;
};

export const sql =
  globalForDb.sql ?? postgres(env.DATABASE_URL, { prepare: false, max: 5 });

if (!globalForDb.sql) globalForDb.sql = sql;

export async function ensureAdminTables(): Promise<void> {
  // If schema version matches, we're good
  if (globalForDb.adminSchemaVersion === ADMIN_SCHEMA_VERSION) return;

  await sql.begin(async (tx) => {
    // Base tables (idempotent)
    await tx`CREATE TABLE IF NOT EXISTS admin_clients (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_properties_client_fk
        FOREIGN KEY (client_id)
        REFERENCES admin_clients(id)
        ON DELETE SET NULL
    )`;
    await tx`CREATE INDEX IF NOT EXISTS admin_properties_org_idx ON admin_properties (organization_id)`;
    await tx`CREATE INDEX IF NOT EXISTS admin_properties_client_idx ON admin_properties (organization_id, client_id)`;

    // ✅ Safe column adds (these fix your current error)
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

    // Keep the rest of your tables as-is (idempotent)
    await tx`CREATE TABLE IF NOT EXISTS admin_services (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      unit_price_cents INTEGER NOT NULL,
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

    await tx`CREATE TABLE IF NOT EXISTS admin_jobs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      client_id TEXT,
      property_id TEXT,
      order_id TEXT,
      title TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      scheduled_for TIMESTAMPTZ NOT NULL,
      duration_minutes INTEGER,
      hours_numeric NUMERIC,
      price_cents INTEGER,
      completed_at TIMESTAMPTZ,
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
      CONSTRAINT admin_jobs_order_fk
        FOREIGN KEY (order_id)
        REFERENCES admin_orders(id)
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
    await tx`CREATE INDEX IF NOT EXISTS admin_job_photos_job_idx ON admin_job_photos (job_id, uploaded_at)`;
  });

  globalForDb.adminSchemaVersion = ADMIN_SCHEMA_VERSION;
}