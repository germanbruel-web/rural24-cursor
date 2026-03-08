-- ============================================================
-- Sprint 4F: Wizard Configs — Configuración del wizard de alta
-- ============================================================
-- Permite controlar desde el admin el orden y visibilidad de
-- los steps del wizard de publicación de avisos.
--
-- Keys de steps disponibles (mapeados a componentes React):
--   categoria       → CategoryStep (obligatorio, siempre primero)
--   caracteristicas → DynamicFormStep
--   ubicacion       → LocationStep
--   fotos           → PhotosStep
--   informacion     → InfoStep (título, descripción, precio)
--   revision        → ReviewStep (obligatorio, siempre último)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wizard_configs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL UNIQUE,   -- "default" | "ganaderia" | etc.
  display_name text        NOT NULL,
  category_id  uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  steps        jsonb       NOT NULL,           -- array de step configs
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.wizard_configs IS
  'Configuración de steps del wizard de publicación de avisos';
COMMENT ON COLUMN public.wizard_configs.steps IS
  'Array: [{key, label, description, icon, visible, order, locked}]';
COMMENT ON COLUMN public.wizard_configs.category_id IS
  'NULL = config global (default). Con valor = override para esa categoría';

ALTER TABLE public.wizard_configs ENABLE ROW LEVEL SECURITY;

DO $p$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='wizard_configs' AND policyname='wizard_configs_select_all'
  ) THEN
    CREATE POLICY "wizard_configs_select_all"
      ON public.wizard_configs FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='wizard_configs' AND policyname='wizard_configs_write_superadmin'
  ) THEN
    CREATE POLICY "wizard_configs_write_superadmin"
      ON public.wizard_configs FOR ALL
      USING (auth.jwt() ->> 'role' = 'superadmin')
      WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');
  END IF;
END $p$;

-- ─── Seed: config default ─────────────────────────────────────

INSERT INTO public.wizard_configs (name, display_name, category_id, steps)
VALUES (
  'default',
  'Wizard por defecto',
  NULL,
  '[
    {"key": "categoria",       "label": "Categoría",        "description": "¿Qué publicás?",       "icon": "Tag",          "visible": true,  "order": 1, "locked": true},
    {"key": "caracteristicas", "label": "Características",  "description": "Detalles técnicos",     "icon": "Settings",     "visible": true,  "order": 2, "locked": false},
    {"key": "ubicacion",       "label": "Ubicación",        "description": "Dónde está",            "icon": "MapPin",       "visible": true,  "order": 3, "locked": false},
    {"key": "fotos",           "label": "Fotos",            "description": "Imágenes del aviso",    "icon": "Camera",       "visible": true,  "order": 4, "locked": false},
    {"key": "informacion",     "label": "Información",      "description": "Título y descripción",  "icon": "FileText",     "visible": true,  "order": 5, "locked": false},
    {"key": "revision",        "label": "Revisar y Publicar","description": "Confirmar publicación","icon": "CheckCircle2", "visible": true,  "order": 6, "locked": true}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

DO $$ BEGIN
  RAISE NOTICE 'Sprint 4F: wizard_configs creado con config default (6 steps).';
END $$;
