ALTER TABLE admin_invoices
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_status TEXT,
  ADD COLUMN IF NOT EXISTS send_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tax_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_remaining_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS hosted_invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS admin_invoices_org_stripe_invoice_uq
  ON admin_invoices (organization_id, stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS admin_invoices_send_at_idx
  ON admin_invoices (organization_id, status, send_at)
  WHERE send_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS admin_invoice_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'SYSTEM',
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  message TEXT,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_invoice_events_invoice_idx
  ON admin_invoice_events (organization_id, invoice_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS admin_invoice_events_stripe_event_uq
  ON admin_invoice_events (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_invoice_events_invoice_fk'
  ) THEN
    ALTER TABLE admin_invoice_events
      ADD CONSTRAINT admin_invoice_events_invoice_fk
      FOREIGN KEY (invoice_id)
      REFERENCES admin_invoices(id)
      ON DELETE CASCADE;
  END IF;
END
$$;
