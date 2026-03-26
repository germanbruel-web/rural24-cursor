-- ============================================================
-- Sprint 11 — Welcome Email + Onboarding Slides
-- ============================================================

-- ── 1. Extender CHECK constraint de email_queue ─────────────
ALTER TABLE public.email_queue
  DROP CONSTRAINT IF EXISTS email_queue_type_check;

ALTER TABLE public.email_queue
  ADD CONSTRAINT email_queue_type_check
  CHECK (type IN ('featured_activated', 'featured_expiring', 'welcome'));

-- ── 2. Función + trigger en users INSERT ────────────────────
CREATE OR REPLACE FUNCTION public.enqueue_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_queue (type, to_user_id, payload)
  VALUES (
    'welcome',
    NEW.id,
    jsonb_build_object(
      'first_name', COALESCE(NEW.first_name, split_part(NEW.full_name, ' ', 1), ''),
      'full_name',  COALESCE(NEW.full_name, NEW.email)
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_email ON public.users;
CREATE TRIGGER trg_welcome_email
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_welcome_email();

-- ── 3. Tabla onboarding_slides ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_slides (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sort_order  integer     NOT NULL DEFAULT 0,
  title       text        NOT NULL,
  description text,
  image_url   text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Seed inicial con 3 slides de ejemplo
INSERT INTO public.onboarding_slides (sort_order, title, description, is_active) VALUES
  (1, 'Publicá tu aviso gratis', 'Llegá a miles de productores de todo el país. Hacienda, insumos, maquinaria y servicios.', true),
  (2, 'Encontrá lo que necesitás', 'Buscá entre cientos de avisos activos. Filtrá por categoría, provincia y precio.', true),
  (3, 'Destacá y vendé más rápido', 'Los avisos destacados aparecen primero en las búsquedas y en la página de inicio.', true)
ON CONFLICT DO NOTHING;

-- RLS: público puede leer slides activos
ALTER TABLE public.onboarding_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding_slides_public_read" ON public.onboarding_slides;
DROP POLICY IF EXISTS "onboarding_slides_superadmin_all" ON public.onboarding_slides;

CREATE POLICY "onboarding_slides_public_read"
  ON public.onboarding_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "onboarding_slides_superadmin_all"
  ON public.onboarding_slides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
