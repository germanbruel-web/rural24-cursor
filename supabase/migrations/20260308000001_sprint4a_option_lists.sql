-- ============================================================
-- Sprint 4A: Option Lists — Listas de opciones reutilizables
-- ============================================================
-- Concepto: Una "Option List" es un catálogo centralizado de valores
-- (ej: Razas Bovinas, Combustibles, Provincias) que puede ser
-- referenciado por múltiples campos de formularios (form_fields_v2)
-- sin duplicar los datos.
--
-- Tablas nuevas:
--   option_lists       → catálogo de listas
--   option_list_items  → ítems de cada lista
--
-- Columna nueva en form_fields_v2:
--   option_list_id → FK a option_lists (nullable)
-- ============================================================

-- ─── TABLA: option_lists ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.option_lists (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL UNIQUE,   -- slug: "razas-bovinas"
  display_name text        NOT NULL,           -- "Razas Bovinas"
  scope        text        NOT NULL DEFAULT 'global'
                           CHECK (scope IN ('global', 'category')),
  category_id  uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  description  text,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.option_lists IS
  'Catálogos de opciones reutilizables para campos de formularios dinámicos';
COMMENT ON COLUMN public.option_lists.scope IS
  'global = aplica a todas las categorías; category = específica de una categoría';

-- ─── TABLA: option_list_items ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.option_list_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     uuid        NOT NULL REFERENCES public.option_lists(id) ON DELETE CASCADE,
  value       text        NOT NULL,   -- valor interno: "aberdeen-angus"
  label       text        NOT NULL,   -- etiqueta visible: "Aberdeen Angus"
  sort_order  integer     NOT NULL DEFAULT 0,
  metadata    jsonb,                   -- datos extra: {color, imagen, especie}
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(list_id, value)
);

COMMENT ON TABLE public.option_list_items IS
  'Ítems individuales dentro de una option_list';

-- Índice de performance para listado ordenado
CREATE INDEX IF NOT EXISTS idx_option_list_items_list_order
  ON public.option_list_items(list_id, sort_order);

-- ─── COLUMNA NUEVA en form_fields_v2 (condicional) ───────────
-- form_fields_v2 puede no existir si aún no fue migrada.
-- El ALTER se ejecuta solo si la tabla ya existe.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_fields_v2'
  ) THEN
    ALTER TABLE public.form_fields_v2
      ADD COLUMN IF NOT EXISTS option_list_id uuid
      REFERENCES public.option_lists(id) ON DELETE SET NULL;

    COMMENT ON COLUMN public.form_fields_v2.option_list_id IS
      'Si está seteado, el campo usa los items de esta lista como opciones (data_source: option_list)';
  END IF;
END $$;

-- ─── RLS: option_lists ────────────────────────────────────────

ALTER TABLE public.option_lists ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer listas activas
CREATE POLICY "option_lists_select_all"
  ON public.option_lists FOR SELECT
  USING (true);

-- ─── RLS: option_list_items ───────────────────────────────────

ALTER TABLE public.option_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "option_list_items_select_all"
  ON public.option_list_items FOR SELECT
  USING (true);

-- Policies de escritura (superadmin) — condicional según si profiles existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN

    -- option_lists write
    EXECUTE $p$
      CREATE POLICY "option_lists_insert_superadmin"
        ON public.option_lists FOR INSERT
        WITH CHECK (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
        )
    $p$;
    EXECUTE $p$
      CREATE POLICY "option_lists_update_superadmin"
        ON public.option_lists FOR UPDATE
        USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
        )
    $p$;
    EXECUTE $p$
      CREATE POLICY "option_lists_delete_superadmin"
        ON public.option_lists FOR DELETE
        USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
        )
    $p$;

    -- option_list_items write
    EXECUTE $p$
      CREATE POLICY "option_list_items_insert_superadmin"
        ON public.option_list_items FOR INSERT
        WITH CHECK (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
        )
    $p$;
    EXECUTE $p$
      CREATE POLICY "option_list_items_update_superadmin"
        ON public.option_list_items FOR UPDATE
        USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
        )
    $p$;
    EXECUTE $p$
      CREATE POLICY "option_list_items_delete_superadmin"
        ON public.option_list_items FOR DELETE
        USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
        )
    $p$;

    RAISE NOTICE 'Superadmin RLS policies created (profiles table found).';
  ELSE
    RAISE NOTICE 'profiles table not found — skipping superadmin write policies. Run this migration again after base schema is applied.';
  END IF;
END $$;

-- ─── SEED: Listas base ────────────────────────────────────────

INSERT INTO public.option_lists (name, display_name, scope, description) VALUES
  ('combustibles',       'Combustibles',            'global',   'Tipos de combustible para maquinaria y vehículos'),
  ('provincias-ar',      'Provincias de Argentina', 'global',   'Provincias y CABA de Argentina'),
  ('razas-bovinas',      'Razas Bovinas',           'category', 'Razas de ganado bovino'),
  ('razas-porcinas',     'Razas Porcinas',          'category', 'Razas de ganado porcino'),
  ('razas-ovinas',       'Razas Ovinas',            'category', 'Razas de ganado ovino'),
  ('razas-equinas',      'Razas Equinas',           'category', 'Razas equinas (caballos, yeguas, etc.)'),
  ('sexo-animal',        'Sexo del Animal',         'global',   'Clasificación por sexo para hacienda'),
  ('estado-general',     'Estado General',          'global',   'Estado o condición general del ítem')
ON CONFLICT (name) DO NOTHING;

-- Asociar listas ganaderas a categoría Ganadería
UPDATE public.option_lists ol
SET category_id = (SELECT id FROM public.categories WHERE name = 'ganaderia' LIMIT 1)
WHERE ol.name IN ('razas-bovinas', 'razas-porcinas', 'razas-ovinas', 'razas-equinas')
  AND (SELECT id FROM public.categories WHERE name = 'ganaderia' LIMIT 1) IS NOT NULL;

-- ─── SEED: Ítems de Combustibles ──────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('gasoil',    'Gasoil / Diesel', 0),
    ('nafta',     'Nafta',           1),
    ('gnc',       'GNC',             2),
    ('electrico', 'Eléctrico',       3),
    ('hibrido',   'Híbrido',         4),
    ('otro',      'Otro',            99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'combustibles'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── SEED: Provincias de Argentina ────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('buenos-aires',         'Buenos Aires',        0),
    ('caba',                 'CABA',                1),
    ('catamarca',            'Catamarca',           2),
    ('chaco',                'Chaco',               3),
    ('chubut',               'Chubut',              4),
    ('cordoba',              'Córdoba',             5),
    ('corrientes',           'Corrientes',          6),
    ('entre-rios',           'Entre Ríos',          7),
    ('formosa',              'Formosa',             8),
    ('jujuy',                'Jujuy',               9),
    ('la-pampa',             'La Pampa',            10),
    ('la-rioja',             'La Rioja',            11),
    ('mendoza',              'Mendoza',             12),
    ('misiones',             'Misiones',            13),
    ('neuquen',              'Neuquén',             14),
    ('rio-negro',            'Río Negro',           15),
    ('salta',                'Salta',               16),
    ('san-juan',             'San Juan',            17),
    ('san-luis',             'San Luis',            18),
    ('santa-cruz',           'Santa Cruz',          19),
    ('santa-fe',             'Santa Fe',            20),
    ('santiago-del-estero',  'Santiago del Estero', 21),
    ('tierra-del-fuego',     'Tierra del Fuego',    22),
    ('tucuman',              'Tucumán',             23)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'provincias-ar'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── SEED: Razas Bovinas ──────────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('aberdeen-angus',  'Aberdeen Angus',    0),
    ('hereford',        'Hereford',          1),
    ('shorthorn',       'Shorthorn',         2),
    ('brahman',         'Brahman',           3),
    ('nelore',          'Nelore',            4),
    ('limousin',        'Limousin',          5),
    ('simmental',       'Simmental',         6),
    ('charolais',       'Charolais',         7),
    ('brangus',         'Brangus',           8),
    ('droughtmaster',   'Droughtmaster',     9),
    ('holando-argentino','Holando Argentino',10),
    ('jersey',          'Jersey',            11),
    ('cruza-britanica', 'Cruza Británica',   12),
    ('cruza-cebuana',   'Cruza Cebuana',     13),
    ('angus-colorado',  'Angus Colorado',    14),
    ('polled-hereford', 'Polled Hereford',   15),
    ('santa-gertrudis', 'Santa Gertrudis',   16),
    ('otra',            'Otra',              99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'razas-bovinas'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── SEED: Razas Equinas ──────────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('criollo',         'Criollo Argentino', 0),
    ('pura-sangre',     'Pura Sangre',       1),
    ('cuarto-de-milla', 'Cuarto de Milla',   2),
    ('peruano-de-paso', 'Peruano de Paso',   3),
    ('percherón',       'Percherón',         4),
    ('mula',            'Mula',              5),
    ('burro',           'Burro',             6),
    ('otro',            'Otro',              99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'razas-equinas'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── SEED: Sexo del Animal ────────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('macho',    'Macho',    0),
    ('hembra',   'Hembra',   1),
    ('castrado', 'Castrado', 2),
    ('mixto',    'Mixto',    3)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'sexo-animal'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── SEED: Estado General ─────────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('excelente', 'Excelente',  0),
    ('muy-bueno', 'Muy bueno',  1),
    ('bueno',     'Bueno',      2),
    ('regular',   'Regular',    3),
    ('malo',      'Malo',       4)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'estado-general'
ON CONFLICT (list_id, value) DO NOTHING;
