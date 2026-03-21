-- Migration: 20260321000005_home_sections
-- Sprint CMS-A: Sistema de secciones dinámicas para la homepage
-- Permite a superadmin configurar y ordenar secciones desde el panel de admin

DO $$ BEGIN
  RAISE NOTICE 'Iniciando migración: home_sections (CMS-A)';
END $$;

-- ============================================================
-- TABLA home_sections
-- ============================================================
CREATE TABLE IF NOT EXISTS public.home_sections (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text        NOT NULL,
  title         text        NOT NULL,
  query_filter  jsonb       NOT NULL DEFAULT '{}',
  display_config jsonb      NOT NULL DEFAULT '{}',
  active_schedule jsonb     DEFAULT NULL,
  sort_order    integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT home_sections_type_check CHECK (
    type IN ('featured_grid', 'category_carousel', 'ad_list', 'banner', 'stats')
  )
);

COMMENT ON TABLE  public.home_sections                  IS 'Secciones dinámicas configurables de la homepage (CMS-A)';
COMMENT ON COLUMN public.home_sections.type             IS 'Tipo: featured_grid | category_carousel | ad_list | banner | stats';
COMMENT ON COLUMN public.home_sections.query_filter     IS 'Filtros de query: {category_slug, status, limit, featured_only, ...}';
COMMENT ON COLUMN public.home_sections.display_config   IS 'Config visual: {columns, card_size, show_price, show_badge, ...}';
COMMENT ON COLUMN public.home_sections.active_schedule  IS 'Programación: {starts_at, ends_at} — null = siempre activo';

-- Índices
CREATE INDEX IF NOT EXISTS idx_home_sections_sort  ON public.home_sections (sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_home_sections_type  ON public.home_sections (type)       WHERE is_active = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_home_sections_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_home_sections_updated_at ON public.home_sections;
CREATE TRIGGER trg_home_sections_updated_at
  BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_home_sections_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

-- Lectura pública (homepage carga sin auth)
DROP POLICY IF EXISTS "home_sections_select_public" ON public.home_sections;
CREATE POLICY "home_sections_select_public"
  ON public.home_sections FOR SELECT
  USING (true);

-- Escritura solo superadmin
DROP POLICY IF EXISTS "home_sections_write_superadmin" ON public.home_sections;
CREATE POLICY "home_sections_write_superadmin"
  ON public.home_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role::text = 'superadmin'
  ));

-- ============================================================
-- RPC: get_home_composition
-- Devuelve secciones activas ordenadas. Filtra por schedule si aplica.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_home_composition()
RETURNS SETOF public.home_sections
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM public.home_sections
  WHERE is_active = true
    AND (
      active_schedule IS NULL
      OR (
        (active_schedule->>'starts_at' IS NULL OR (active_schedule->>'starts_at')::timestamptz <= now())
        AND
        (active_schedule->>'ends_at' IS NULL OR (active_schedule->>'ends_at')::timestamptz >= now())
      )
    )
  ORDER BY sort_order ASC;
$$;

-- ============================================================
-- SEED: secciones de ejemplo basadas en el estado actual del sistema
-- ============================================================
INSERT INTO public.home_sections (type, title, query_filter, display_config, sort_order, is_active)
VALUES
  (
    'featured_grid',
    'Maquinaria Agrícola Destacada',
    '{"category_slug": "maquinaria-agricola", "featured_only": true, "limit": 8}',
    '{"columns": 4, "card_size": "default", "show_price": true}',
    10,
    true
  ),
  (
    'featured_grid',
    'Hacienda Destacada',
    '{"category_slug": "hacienda", "featured_only": true, "limit": 8}',
    '{"columns": 4, "card_size": "default", "show_price": true}',
    20,
    true
  ),
  (
    'ad_list',
    'Inmuebles Rurales',
    '{"category_slug": "inmobiliaria-rural", "status": "active", "limit": 6}',
    '{"columns": 3, "card_size": "default", "show_price": true}',
    30,
    false
  ),
  (
    'stats',
    'Rural24 en números',
    '{}',
    '{"show_ads_count": true, "show_users_count": true, "show_categories": true}',
    40,
    false
  )
ON CONFLICT DO NOTHING;

DO $$ BEGIN
  RAISE NOTICE 'Migración completada: home_sections + RPC get_home_composition + seed inicial';
END $$;
