-- Admin Panel: settings, branding, themes, audit logs

CREATE TABLE IF NOT EXISTS admin_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

INSERT INTO admin_settings (id, value) VALUES
  ('platform', '{"companyName":"DOOH Manager","cmsUrl":"","language":"pt-BR","timezone":"America/Sao_Paulo","dateFormat":"DD/MM/YYYY","timeFormat":"HH:mm","uploadMaxSize":50,"uploadAllowedTypes":"jpg,jpeg,png,gif,webp,mp4,webm,mov,avi,pdf","cacheTime":300,"syncInterval":30,"heartbeatTimeout":120}'::jsonb),
  ('email', '{"smtpHost":"","smtpPort":587,"smtpUser":"","smtpPass":"","fromName":"DOOH Manager","fromEmail":"noreply@doohmanager.com"}'::jsonb),
  ('security', '{"sessionTimeout":60,"maxLoginAttempts":5,"forcePasswordChange":false,"passwordMinLength":8}'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_branding (
  id text PRIMARY KEY DEFAULT 'default',
  system_name text NOT NULL DEFAULT 'DOOH Manager',
  system_subtitle text NOT NULL DEFAULT 'Sistema de Gerenciamento DOOH',
  logo_url text,
  logo_small_url text,
  favicon_url text,
  login_logo_url text,
  login_background_url text,
  report_logo_url text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO admin_branding (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_themes (
  id text PRIMARY KEY,
  name text NOT NULL,
  mode text NOT NULL DEFAULT 'custom' CHECK (mode IN ('light','dark','auto','custom')),
  is_active boolean NOT NULL DEFAULT false,
  colors jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  user_name text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  entity_type text,
  entity_id text,
  description text NOT NULL DEFAULT '',
  ip text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs (user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_themes_active ON admin_themes (is_active) WHERE is_active = true;
