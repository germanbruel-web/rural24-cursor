-- ============================================================
-- Sprint 4B: Tablas base del sistema de formularios dinámicos v2
-- ============================================================
-- Crea:
--   form_templates_v2      → templates de formularios por categoría/subcategoría
--   form_fields_v2         → campos de cada template
--   form_field_options_v2  → opciones estáticas por campo (legacy, reemplazado por option_lists)
--   RPC get_form_for_context → lookup de template según contexto
-- ============================================================

-- ─── TABLA: form_templates_v2 ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.form_templates_v2 (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL UNIQUE,      -- slug: "ganaderia_hacienda"
  display_name     text        NOT NULL,             -- "Formulario Ganadería — Hacienda"
  category_id      uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id   uuid        REFERENCES public.subcategories(id) ON DELETE SET NULL,
  category_type_id uuid,                             -- extensión futura
  sections         jsonb       NOT NULL DEFAULT '[]'::jsonb,
  is_active        boolean     NOT NULL DEFAULT true,
  priority         integer     NOT NULL DEFAULT 0,   -- mayor = preferido en lookup
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.form_templates_v2 IS
  'Templates de formularios dinámicos para el wizard de publicación de avisos';
COMMENT ON COLUMN public.form_templates_v2.sections IS
  'Array JSON de secciones: [{id, name, label, display_order, collapsible}]';
COMMENT ON COLUMN public.form_templates_v2.priority IS
  'Mayor número = mayor prioridad en get_form_for_context (subcategoría > categoría)';

CREATE INDEX IF NOT EXISTS idx_form_templates_v2_category
  ON public.form_templates_v2(category_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_form_templates_v2_subcategory
  ON public.form_templates_v2(subcategory_id) WHERE is_active = true;

-- ─── TABLA: form_fields_v2 ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.form_fields_v2 (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id   uuid        NOT NULL REFERENCES public.form_templates_v2(id) ON DELETE CASCADE,
  field_name         text        NOT NULL,
  field_label        text        NOT NULL,
  section_id         text,                           -- ID de la sección (ej: "sec-hac-info-general")
  field_type         text        NOT NULL
                     CHECK (field_type IN ('text','number','select','autocomplete','textarea',
                                           'checkbox','features','tags','range')),
  field_width        text        NOT NULL DEFAULT 'half'
                     CHECK (field_width IN ('full','half','third')),
  data_source        text        CHECK (data_source IN ('brands','models','features','custom')),
  data_source_config jsonb,                          -- {depends_on, list_map, ...}
  is_required        boolean     NOT NULL DEFAULT false,
  validation_rules   jsonb,                          -- {min, max, pattern}
  placeholder        text,
  help_text          text,
  icon               text,
  display_order      integer     NOT NULL DEFAULT 0,
  metadata           jsonb,
  options            jsonb,                          -- opciones estáticas [{value, label}]
  option_list_id     uuid        REFERENCES public.option_lists(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(form_template_id, field_name)
);

COMMENT ON TABLE public.form_fields_v2 IS
  'Campos de cada template de formulario dinámico';
COMMENT ON COLUMN public.form_fields_v2.data_source_config IS
  'Config para campos condicionales: {depends_on: "tipo_animal", list_map: {toros: "razas-toros"}}';
COMMENT ON COLUMN public.form_fields_v2.options IS
  'Opciones estáticas para selects simples sin option_list: [{value, label}]';

CREATE INDEX IF NOT EXISTS idx_form_fields_v2_template
  ON public.form_fields_v2(form_template_id, display_order);

-- ─── TABLA: form_field_options_v2 ────────────────────────────
-- Legacy: opciones inline por campo. Preferir option_lists para catálogos reutilizables.

CREATE TABLE IF NOT EXISTS public.form_field_options_v2 (
  id            uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id      uuid     NOT NULL REFERENCES public.form_fields_v2(id) ON DELETE CASCADE,
  option_value  text     NOT NULL,
  option_label  text     NOT NULL,
  display_order integer  NOT NULL DEFAULT 0,
  is_active     boolean  NOT NULL DEFAULT true,
  metadata      jsonb,
  UNIQUE(field_id, option_value)
);

COMMENT ON TABLE public.form_field_options_v2 IS
  'Opciones estáticas de campos select (legacy — preferir option_list_id para catálogos nuevos)';

CREATE INDEX IF NOT EXISTS idx_form_field_options_v2_field
  ON public.form_field_options_v2(field_id, display_order);

-- ─── RLS ─────────────────────────────────────────────────────

ALTER TABLE public.form_templates_v2    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields_v2       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_field_options_v2 ENABLE ROW LEVEL SECURITY;

-- SELECT: todos pueden leer (incluido anon para el wizard de publicar)
DO $p$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='form_templates_v2' AND policyname='form_templates_v2_select_all'
  ) THEN
    CREATE POLICY "form_templates_v2_select_all"
      ON public.form_templates_v2 FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='form_fields_v2' AND policyname='form_fields_v2_select_all'
  ) THEN
    CREATE POLICY "form_fields_v2_select_all"
      ON public.form_fields_v2 FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='form_field_options_v2' AND policyname='form_field_options_v2_select_all'
  ) THEN
    CREATE POLICY "form_field_options_v2_select_all"
      ON public.form_field_options_v2 FOR SELECT USING (true);
  END IF;
END $p$;

-- Escritura: solo superadmin
DO $p$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='form_templates_v2' AND policyname='form_templates_v2_write_superadmin'
  ) THEN
    CREATE POLICY "form_templates_v2_write_superadmin"
      ON public.form_templates_v2 FOR ALL
      USING (auth.jwt() ->> 'role' = 'superadmin')
      WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='form_fields_v2' AND policyname='form_fields_v2_write_superadmin'
  ) THEN
    CREATE POLICY "form_fields_v2_write_superadmin"
      ON public.form_fields_v2 FOR ALL
      USING (auth.jwt() ->> 'role' = 'superadmin')
      WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='form_field_options_v2' AND policyname='form_field_options_v2_write_superadmin'
  ) THEN
    CREATE POLICY "form_field_options_v2_write_superadmin"
      ON public.form_field_options_v2 FOR ALL
      USING (auth.jwt() ->> 'role' = 'superadmin')
      WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');
  END IF;
END $p$;

-- ─── RPC: get_form_for_context ────────────────────────────────
-- Devuelve el template más específico para un contexto dado.
-- Prioridad: subcategory_id > category_id (mayor priority = primero)

CREATE OR REPLACE FUNCTION public.get_form_for_context(
  p_category_id      uuid DEFAULT NULL,
  p_subcategory_id   uuid DEFAULT NULL,
  p_category_type_id uuid DEFAULT NULL
)
RETURNS TABLE (
  form_id           uuid,
  form_name         text,
  form_display_name text,
  sections          jsonb,
  fields            jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  -- Buscar template más específico: subcategoría > categoría
  SELECT t.id INTO v_template_id
  FROM public.form_templates_v2 t
  WHERE t.is_active = true
    AND (
      (p_subcategory_id IS NOT NULL AND t.subcategory_id = p_subcategory_id)
      OR
      (p_subcategory_id IS NULL AND t.subcategory_id IS NULL
       AND p_category_id IS NOT NULL AND t.category_id = p_category_id)
      OR
      (p_category_id IS NOT NULL AND t.category_id = p_category_id
       AND (p_subcategory_id IS NULL OR t.subcategory_id IS NULL))
    )
  ORDER BY
    -- Priorizar subcategoría exacta
    CASE WHEN p_subcategory_id IS NOT NULL AND t.subcategory_id = p_subcategory_id THEN 0 ELSE 1 END,
    t.priority DESC
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    t.id                AS form_id,
    t.name              AS form_name,
    t.display_name      AS form_display_name,
    t.sections          AS sections,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id',                f.id,
            'form_template_id',  f.form_template_id,
            'field_name',        f.field_name,
            'field_label',       f.field_label,
            'section_id',        f.section_id,
            'field_type',        f.field_type,
            'field_width',       f.field_width,
            'data_source',       f.data_source,
            'data_source_config',f.data_source_config,
            'is_required',       f.is_required,
            'validation_rules',  f.validation_rules,
            'placeholder',       f.placeholder,
            'help_text',         f.help_text,
            'icon',              f.icon,
            'display_order',     f.display_order,
            'metadata',          f.metadata,
            'options',           f.options,
            'option_list_id',    f.option_list_id,
            'created_at',        f.created_at
          ) ORDER BY f.display_order
        )
        FROM public.form_fields_v2 f
        WHERE f.form_template_id = v_template_id
      ),
      '[]'::jsonb
    )                   AS fields
  FROM public.form_templates_v2 t
  WHERE t.id = v_template_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_form_for_context(uuid, uuid, uuid) TO anon, authenticated;

DO $$ BEGIN
  RAISE NOTICE 'Sprint 4B: form_templates_v2, form_fields_v2, form_field_options_v2 y RPC get_form_for_context creados.';
END $$;
