-- ============================================================
-- Sprint 11C+: Email Media Library
-- Tabla email_media — imágenes subidas a Cloudinary para usar en emails
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT NOT NULL,
  public_id   TEXT NOT NULL UNIQUE,
  filename    TEXT NOT NULL,
  width       INT,
  height      INT,
  bytes       INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.email_media IS 'Imágenes subidas a Cloudinary para usar en plantillas de email.';

ALTER TABLE public.email_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.email_media;
CREATE POLICY "service_role_all" ON public.email_media
  FOR ALL TO service_role USING (true) WITH CHECK (true);
