-- ============================================================
-- Sprint 11C: Email Template CMS
-- Tabla email_templates — plantillas editables desde el admin
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  type          TEXT PRIMARY KEY,         -- 'welcome' | 'welcome_verify' | 'featured_activated' | 'contact_form'
  subject       TEXT NOT NULL,
  html_content  TEXT NOT NULL,
  variables     JSONB NOT NULL DEFAULT '[]', -- variables disponibles en esta plantilla
  description   TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.email_templates IS 'Plantillas de email editables desde el admin. El emailService las carga con caché 5min y usa las hardcodeadas como fallback.';

-- RLS: solo service_role puede escribir; lectura desde backend (service_role)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.email_templates;
CREATE POLICY "service_role_all" ON public.email_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_email_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_email_templates_updated_at();

-- ============================================================
-- SEED: plantillas iniciales (sujeto + variables, HTML vacío)
-- El HTML real se carga desde emailService.ts como fallback
-- hasta que el admin lo personalice desde el panel.
-- ============================================================

INSERT INTO public.email_templates (type, subject, html_content, variables, description)
VALUES
  (
    'welcome',
    '¡Bienvenido a Rural24, {{first_name}}!',
    '',
    '["first_name", "to_name"]',
    'Email de bienvenida para usuarios que se registran con OAuth (Google, etc.)'
  ),
  (
    'welcome_verify',
    '¡Bienvenido a Rural24! Confirmá tu cuenta, {{first_name}}',
    '',
    '["first_name", "to_name", "confirmation_link"]',
    'Email de bienvenida con link de verificación para registro con email/contraseña'
  ),
  (
    'featured_activated',
    'Tu aviso "{{ad_title}}" ya está destacado en Rural24',
    '',
    '["to_name", "ad_title", "ad_url", "expires_at"]',
    'Notificación al vendedor cuando su aviso pasa de pending a active (pg_cron cada 15min)'
  ),
  (
    'contact_form',
    '[Rural24] {{tipo_label}} de {{nombre}}',
    '',
    '["tipo_label", "nombre", "email", "telefono", "mensaje", "adjuntos"]',
    'Notificación interna cuando alguien completa el formulario de contacto'
  )
ON CONFLICT (type) DO NOTHING;
