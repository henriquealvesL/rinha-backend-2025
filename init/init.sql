DROP TABLE IF EXISTS payments;

CREATE TABLE payments(
  id SERIAL PRIMARY KEY,
  correlation_id UUID UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  processor TEXT NOT NULL CHECK (processor IN ('default', 'fallback')), 
  status TEXT NOT NULL DEFAULT 'processed',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_correlation ON payments (correlation_id);

CREATE INDEX IF NOT EXISTS ix_payments_processed_default 
  ON payments (processed_at)
  WHERE status = 'processed' AND processor = 'default';

CREATE INDEX IF NOT EXISTS ix_payments_processed_fallback 
  ON payments (processed_at)
  WHERE status = 'processed' AND processor = 'fallback';