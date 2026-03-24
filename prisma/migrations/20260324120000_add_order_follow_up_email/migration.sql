ALTER TABLE admin_orders
ADD COLUMN IF NOT EXISTS follow_up_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS admin_orders_follow_up_ready_idx
ON admin_orders (organization_id, installed_at)
WHERE fulfillment_status = 'INSTALLED' AND follow_up_email_sent_at IS NULL;
