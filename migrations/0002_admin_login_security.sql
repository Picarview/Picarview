CREATE TABLE IF NOT EXISTS admin_login_attempts (
  client_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_window
  ON admin_login_attempts (window_started);
