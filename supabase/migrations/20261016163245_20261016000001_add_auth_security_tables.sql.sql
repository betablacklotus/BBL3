-- Add column to track whether the admin password has been changed from default
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS password_changed_from_default boolean NOT NULL DEFAULT false;

-- Table for server-side login rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip text NOT NULL,
  success boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS but add no policies — only the service role key (used by edge functions) can access
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Index for efficient rate-limit queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created
  ON login_attempts (ip, created_at DESC);
