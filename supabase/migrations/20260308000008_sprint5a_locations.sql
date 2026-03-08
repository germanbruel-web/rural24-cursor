-- ============================================================
-- Sprint 5A: Provincias y Localidades DB-driven
-- ============================================================
-- Reemplaza los arrays hardcodeados en locations.ts por tablas
-- gestionables desde el admin. Permite agregar/editar localidades
-- sin tocar código.
-- ============================================================

-- ─── TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.provinces (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  slug        text        NOT NULL UNIQUE,
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.provinces IS 'Provincias de Argentina (24 = 23 provincias + CABA)';

CREATE TABLE IF NOT EXISTS public.localities (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id uuid        NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  slug        text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (province_id, slug)
);

COMMENT ON TABLE public.localities IS 'Localidades de Argentina agrupadas por provincia';

CREATE INDEX IF NOT EXISTS idx_localities_province_id ON public.localities(province_id) WHERE is_active = true;

-- ─── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.provinces  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localities ENABLE ROW LEVEL SECURITY;

-- SELECT: público
DROP POLICY IF EXISTS "provinces_select_all" ON public.provinces;
CREATE POLICY "provinces_select_all"
  ON public.provinces FOR SELECT USING (true);

DROP POLICY IF EXISTS "localities_select_all" ON public.localities;
CREATE POLICY "localities_select_all"
  ON public.localities FOR SELECT USING (true);

-- WRITE: solo superadmin (patrón correcto del proyecto)
DROP POLICY IF EXISTS "provinces_write_superadmin" ON public.provinces;
CREATE POLICY "provinces_write_superadmin"
  ON public.provinces FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'));

DROP POLICY IF EXISTS "localities_write_superadmin" ON public.localities;
CREATE POLICY "localities_write_superadmin"
  ON public.localities FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'));

-- ─── SEED: Provincias ─────────────────────────────────────────

INSERT INTO public.provinces (name, slug, sort_order) VALUES
  ('Buenos Aires',                      'buenos-aires',                        1),
  ('Catamarca',                         'catamarca',                           2),
  ('Chaco',                             'chaco',                               3),
  ('Chubut',                            'chubut',                              4),
  ('Ciudad Autónoma de Buenos Aires',   'ciudad-autonoma-de-buenos-aires',     5),
  ('Córdoba',                           'cordoba',                             6),
  ('Corrientes',                        'corrientes',                          7),
  ('Entre Ríos',                        'entre-rios',                          8),
  ('Formosa',                           'formosa',                             9),
  ('Jujuy',                             'jujuy',                              10),
  ('La Pampa',                          'la-pampa',                           11),
  ('La Rioja',                          'la-rioja',                           12),
  ('Mendoza',                           'mendoza',                            13),
  ('Misiones',                          'misiones',                           14),
  ('Neuquén',                           'neuquen',                            15),
  ('Río Negro',                         'rio-negro',                          16),
  ('Salta',                             'salta',                              17),
  ('San Juan',                          'san-juan',                           18),
  ('San Luis',                          'san-luis',                           19),
  ('Santa Cruz',                        'santa-cruz',                         20),
  ('Santa Fe',                          'santa-fe',                           21),
  ('Santiago del Estero',               'santiago-del-estero',                22),
  ('Tierra del Fuego',                  'tierra-del-fuego',                   23),
  ('Tucumán',                           'tucuman',                            24)
ON CONFLICT (slug) DO NOTHING;

-- ─── SEED: Localidades ────────────────────────────────────────

DO $$
DECLARE
  v_prov_id uuid;
BEGIN

-- ── Buenos Aires ──────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'buenos-aires';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, '9 de Julio',              '9-de-julio',              1),
  (v_prov_id, 'Alberti',                 'alberti',                 2),
  (v_prov_id, 'Arrecifes',               'arrecifes',               3),
  (v_prov_id, 'Ayacucho',                'ayacucho',                4),
  (v_prov_id, 'Azul',                    'azul',                    5),
  (v_prov_id, 'Bahía Blanca',            'bahia-blanca',            6),
  (v_prov_id, 'Balcarce',                'balcarce',                7),
  (v_prov_id, 'Baradero',                'baradero',                8),
  (v_prov_id, 'Benito Juárez',           'benito-juarez',           9),
  (v_prov_id, 'Berisso',                 'berisso',                10),
  (v_prov_id, 'Bolívar',                 'bolivar',                11),
  (v_prov_id, 'Bragado',                 'bragado',                12),
  (v_prov_id, 'Brandsen',                'brandsen',               13),
  (v_prov_id, 'Campana',                 'campana',                14),
  (v_prov_id, 'Cañuelas',                'canuelas',               15),
  (v_prov_id, 'Capitán Sarmiento',       'capitan-sarmiento',      16),
  (v_prov_id, 'Carlos Casares',          'carlos-casares',         17),
  (v_prov_id, 'Carlos Tejedor',          'carlos-tejedor',         18),
  (v_prov_id, 'Carmen de Areco',         'carmen-de-areco',        19),
  (v_prov_id, 'Castelli',                'castelli',               20),
  (v_prov_id, 'Chacabuco',               'chacabuco',              21),
  (v_prov_id, 'Chascomús',               'chascomus',              22),
  (v_prov_id, 'Chivilcoy',               'chivilcoy',              23),
  (v_prov_id, 'Colón',                   'colon',                  24),
  (v_prov_id, 'Coronel Dorrego',         'coronel-dorrego',        25),
  (v_prov_id, 'Coronel Pringles',        'coronel-pringles',       26),
  (v_prov_id, 'Coronel Suárez',          'coronel-suarez',         27),
  (v_prov_id, 'Daireaux',                'daireaux',               28),
  (v_prov_id, 'Dolores',                 'dolores',                29),
  (v_prov_id, 'Ensenada',                'ensenada',               30),
  (v_prov_id, 'General Alvarado',        'general-alvarado',       31),
  (v_prov_id, 'General Alvear',          'general-alvear',         32),
  (v_prov_id, 'General Arenales',        'general-arenales',       33),
  (v_prov_id, 'General Belgrano',        'general-belgrano',       34),
  (v_prov_id, 'General Guido',           'general-guido',          35),
  (v_prov_id, 'General La Madrid',       'general-la-madrid',      36),
  (v_prov_id, 'General Las Heras',       'general-las-heras',      37),
  (v_prov_id, 'General Madariaga',       'general-madariaga',      38),
  (v_prov_id, 'General Paz',             'general-paz',            39),
  (v_prov_id, 'General Pinto',           'general-pinto',          40),
  (v_prov_id, 'General Pueyrredón',      'general-pueyrredon',     41),
  (v_prov_id, 'General Rodríguez',       'general-rodriguez',      42),
  (v_prov_id, 'General Viamonte',        'general-viamonte',       43),
  (v_prov_id, 'General Villegas',        'general-villegas',       44),
  (v_prov_id, 'Guaminí',                 'guamini',                45),
  (v_prov_id, 'Hipólito Yrigoyen',       'hipolito-yrigoyen',      46),
  (v_prov_id, 'Junín',                   'junin',                  47),
  (v_prov_id, 'La Plata',                'la-plata',               48),
  (v_prov_id, 'Laprida',                 'laprida',                49),
  (v_prov_id, 'Las Flores',              'las-flores',             50),
  (v_prov_id, 'Leandro N. Alem',         'leandro-n-alem',         51),
  (v_prov_id, 'Lincoln',                 'lincoln',                52),
  (v_prov_id, 'Lobería',                 'loberia',                53),
  (v_prov_id, 'Lobos',                   'lobos',                  54),
  (v_prov_id, 'Lomas de Zamora',         'lomas-de-zamora',        55),
  (v_prov_id, 'Luján',                   'lujan',                  56),
  (v_prov_id, 'Maipú',                   'maipu',                  57),
  (v_prov_id, 'Mar Chiquita',            'mar-chiquita',           58),
  (v_prov_id, 'Mar del Plata',           'mar-del-plata',          59),
  (v_prov_id, 'Marcos Paz',              'marcos-paz',             60),
  (v_prov_id, 'Mercedes',                'mercedes',               61),
  (v_prov_id, 'Monte',                   'monte',                  62),
  (v_prov_id, 'Navarro',                 'navarro',                63),
  (v_prov_id, 'Necochea',                'necochea',               64),
  (v_prov_id, 'Olavarría',               'olavarria',              65),
  (v_prov_id, 'Pergamino',               'pergamino',              66),
  (v_prov_id, 'Pehuajó',                 'pehuajo',                67),
  (v_prov_id, 'Pellegrini',              'pellegrini',             68),
  (v_prov_id, 'Pilar',                   'pilar',                  69),
  (v_prov_id, 'Puan',                    'puan',                   70),
  (v_prov_id, 'Punta Alta',              'punta-alta',             71),
  (v_prov_id, 'Quilmes',                 'quilmes',                72),
  (v_prov_id, 'Ramallo',                 'ramallo',                73),
  (v_prov_id, 'Rauch',                   'rauch',                  74),
  (v_prov_id, 'Rivadavia',               'rivadavia',              75),
  (v_prov_id, 'Rojas',                   'rojas',                  76),
  (v_prov_id, 'Roque Pérez',             'roque-perez',            77),
  (v_prov_id, 'Saavedra',                'saavedra',               78),
  (v_prov_id, 'Saladillo',               'saladillo',              79),
  (v_prov_id, 'Salliqueló',              'salliquelo',             80),
  (v_prov_id, 'Salto',                   'salto',                  81),
  (v_prov_id, 'San Andrés de Giles',     'san-andres-de-giles',    82),
  (v_prov_id, 'San Antonio de Areco',    'san-antonio-de-areco',   83),
  (v_prov_id, 'San Cayetano',            'san-cayetano',           84),
  (v_prov_id, 'San Fernando',            'san-fernando',           85),
  (v_prov_id, 'San Nicolás',             'san-nicolas',            86),
  (v_prov_id, 'San Pedro',               'san-pedro',              87),
  (v_prov_id, 'San Vicente',             'san-vicente',            88),
  (v_prov_id, 'Suipacha',                'suipacha',               89),
  (v_prov_id, 'Tandil',                  'tandil',                 90),
  (v_prov_id, 'Tapalqué',                'tapalque',               91),
  (v_prov_id, 'Tigre',                   'tigre',                  92),
  (v_prov_id, 'Tordillo',                'tordillo',               93),
  (v_prov_id, 'Tornquist',               'tornquist',              94),
  (v_prov_id, 'Trenque Lauquen',         'trenque-lauquen',        95),
  (v_prov_id, 'Tres Arroyos',            'tres-arroyos',           96),
  (v_prov_id, 'Tres Lomas',              'tres-lomas',             97),
  (v_prov_id, 'Veinticinco de Mayo',     'veinticinco-de-mayo',    98),
  (v_prov_id, 'Vicente López',           'vicente-lopez',          99),
  (v_prov_id, 'Villa Gesell',            'villa-gesell',          100),
  (v_prov_id, 'Villarino',               'villarino',             101),
  (v_prov_id, 'Zárate',                  'zarate',                102)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Catamarca ─────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'catamarca';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Andalgalá',   'andalgala',   1),
  (v_prov_id, 'Belén',       'belen',       2),
  (v_prov_id, 'Catamarca',   'catamarca',   3),
  (v_prov_id, 'Santa María', 'santa-maria', 4),
  (v_prov_id, 'Tinogasta',   'tinogasta',   5)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Chaco ─────────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'chaco';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Charata',                              'charata',                              1),
  (v_prov_id, 'General San Martín',                   'general-san-martin',                   2),
  (v_prov_id, 'Presidencia Roque Sáenz Peña',         'presidencia-roque-saenz-pena',         3),
  (v_prov_id, 'Quitilipi',                            'quitilipi',                            4),
  (v_prov_id, 'Resistencia',                          'resistencia',                          5),
  (v_prov_id, 'Villa Ángela',                         'villa-angela',                         6)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Chubut ────────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'chubut';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Comodoro Rivadavia', 'comodoro-rivadavia', 1),
  (v_prov_id, 'Esquel',             'esquel',             2),
  (v_prov_id, 'Puerto Madryn',      'puerto-madryn',      3),
  (v_prov_id, 'Rawson',             'rawson',             4),
  (v_prov_id, 'Sarmiento',          'sarmiento',          5),
  (v_prov_id, 'Trelew',             'trelew',             6)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── CABA ──────────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'ciudad-autonoma-de-buenos-aires';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'CABA - Belgrano',  'caba-belgrano',  1),
  (v_prov_id, 'CABA - Caballito', 'caba-caballito', 2),
  (v_prov_id, 'CABA - Centro',    'caba-centro',    3),
  (v_prov_id, 'CABA - Palermo',   'caba-palermo',   4)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Córdoba ───────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'cordoba';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Alta Gracia',        'alta-gracia',       1),
  (v_prov_id, 'Bell Ville',         'bell-ville',        2),
  (v_prov_id, 'Carlos Paz',         'carlos-paz',        3),
  (v_prov_id, 'Córdoba Capital',    'cordoba-capital',   4),
  (v_prov_id, 'Cruz del Eje',       'cruz-del-eje',      5),
  (v_prov_id, 'Dean Funes',         'dean-funes',        6),
  (v_prov_id, 'Jesús María',        'jesus-maria',       7),
  (v_prov_id, 'Laboulaye',          'laboulaye',         8),
  (v_prov_id, 'Marcos Juárez',      'marcos-juarez',     9),
  (v_prov_id, 'Morteros',           'morteros',         10),
  (v_prov_id, 'Río Cuarto',         'rio-cuarto',       11),
  (v_prov_id, 'Río Tercero',        'rio-tercero',      12),
  (v_prov_id, 'San Francisco',      'san-francisco',    13),
  (v_prov_id, 'Villa Dolores',      'villa-dolores',    14),
  (v_prov_id, 'Villa María',        'villa-maria',      15)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Corrientes ────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'corrientes';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Bella Vista',         'bella-vista',          1),
  (v_prov_id, 'Corrientes',          'corrientes',           2),
  (v_prov_id, 'Curuzú Cuatiá',       'curuzu-cuatia',        3),
  (v_prov_id, 'Goya',                'goya',                 4),
  (v_prov_id, 'Mercedes',            'mercedes',             5),
  (v_prov_id, 'Monte Caseros',       'monte-caseros',        6),
  (v_prov_id, 'Paso de los Libres',  'paso-de-los-libres',   7),
  (v_prov_id, 'Santo Tomé',          'santo-tome',           8)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Entre Ríos ────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'entre-rios';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Colón',                    'colon',                   1),
  (v_prov_id, 'Concepción del Uruguay',   'concepcion-del-uruguay',  2),
  (v_prov_id, 'Concordia',                'concordia',               3),
  (v_prov_id, 'Diamante',                 'diamante',                4),
  (v_prov_id, 'Federal',                  'federal',                 5),
  (v_prov_id, 'Gualeguay',                'gualeguay',               6),
  (v_prov_id, 'Gualeguaychú',             'gualeguaychu',            7),
  (v_prov_id, 'La Paz',                   'la-paz',                  8),
  (v_prov_id, 'Nogoyá',                   'nogoya',                  9),
  (v_prov_id, 'Paraná',                   'parana',                 10),
  (v_prov_id, 'Victoria',                 'victoria',               11),
  (v_prov_id, 'Villaguay',                'villaguay',              12)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Formosa ───────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'formosa';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Clorinda',      'clorinda',      1),
  (v_prov_id, 'Formosa',       'formosa',       2),
  (v_prov_id, 'Laguna Blanca', 'laguna-blanca', 3),
  (v_prov_id, 'Pirané',        'pirane',        4)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Jujuy ─────────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'jujuy';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Humahuaca',                          'humahuaca',                           1),
  (v_prov_id, 'La Quiaca',                          'la-quiaca',                           2),
  (v_prov_id, 'Libertador General San Martín',      'libertador-general-san-martin',       3),
  (v_prov_id, 'Palpalá',                            'palpala',                             4),
  (v_prov_id, 'Perico',                             'perico',                              5),
  (v_prov_id, 'San Pedro',                          'san-pedro',                           6),
  (v_prov_id, 'San Salvador de Jujuy',              'san-salvador-de-jujuy',               7)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── La Pampa ──────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'la-pampa';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'General Pico', 'general-pico', 1),
  (v_prov_id, 'Macachín',     'macachin',     2),
  (v_prov_id, 'Realicó',      'realico',      3),
  (v_prov_id, 'Santa Rosa',   'santa-rosa',   4),
  (v_prov_id, 'Victorica',    'victorica',    5)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── La Rioja ──────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'la-rioja';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Aimogasta',  'aimogasta',  1),
  (v_prov_id, 'Chamical',   'chamical',   2),
  (v_prov_id, 'Chilecito',  'chilecito',  3),
  (v_prov_id, 'La Rioja',   'la-rioja',   4)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Mendoza ───────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'mendoza';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'General Alvear',  'general-alvear',  1),
  (v_prov_id, 'Godoy Cruz',      'godoy-cruz',       2),
  (v_prov_id, 'Guaymallén',      'guaymallen',       3),
  (v_prov_id, 'Luján de Cuyo',   'lujan-de-cuyo',    4),
  (v_prov_id, 'Maipú',           'maipu',            5),
  (v_prov_id, 'Malargüe',        'malargue',         6),
  (v_prov_id, 'Mendoza',         'mendoza',          7),
  (v_prov_id, 'Rivadavia',       'rivadavia',        8),
  (v_prov_id, 'San Martín',      'san-martin',       9),
  (v_prov_id, 'San Rafael',      'san-rafael',      10),
  (v_prov_id, 'Tunuyán',         'tunuyan',         11),
  (v_prov_id, 'Tupungato',       'tupungato',       12)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Misiones ──────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'misiones';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Apóstoles',      'apostoles',      1),
  (v_prov_id, 'Eldorado',       'eldorado',       2),
  (v_prov_id, 'Leandro N. Alem','leandro-n-alem', 3),
  (v_prov_id, 'Oberá',          'obera',          4),
  (v_prov_id, 'Posadas',        'posadas',        5),
  (v_prov_id, 'Puerto Iguazú',  'puerto-iguazu',  6),
  (v_prov_id, 'Puerto Rico',    'puerto-rico',    7),
  (v_prov_id, 'San Vicente',    'san-vicente',    8)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Neuquén ───────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'neuquen';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Centenario',              'centenario',               1),
  (v_prov_id, 'Cutral Có',               'cutral-co',                2),
  (v_prov_id, 'Junín de los Andes',      'junin-de-los-andes',       3),
  (v_prov_id, 'Neuquén',                 'neuquen',                  4),
  (v_prov_id, 'Plaza Huincul',           'plaza-huincul',            5),
  (v_prov_id, 'San Martín de los Andes', 'san-martin-de-los-andes',  6),
  (v_prov_id, 'Zapala',                  'zapala',                   7)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Río Negro ─────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'rio-negro';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Allen',                  'allen',                  1),
  (v_prov_id, 'Bariloche',              'bariloche',              2),
  (v_prov_id, 'Catriel',                'catriel',                3),
  (v_prov_id, 'Cipolletti',             'cipolletti',             4),
  (v_prov_id, 'El Bolsón',              'el-bolson',              5),
  (v_prov_id, 'General Roca',           'general-roca',           6),
  (v_prov_id, 'Ingeniero Jacobacci',    'ingeniero-jacobacci',    7),
  (v_prov_id, 'Viedma',                 'viedma',                 8),
  (v_prov_id, 'Villa Regina',           'villa-regina',           9)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Salta ─────────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'salta';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Cafayate',                        'cafayate',                         1),
  (v_prov_id, 'Metán',                           'metan',                            2),
  (v_prov_id, 'Orán',                            'oran',                             3),
  (v_prov_id, 'Rosario de la Frontera',          'rosario-de-la-frontera',           4),
  (v_prov_id, 'Salta',                           'salta',                            5),
  (v_prov_id, 'San Ramón de la Nueva Orán',      'san-ramon-de-la-nueva-oran',       6),
  (v_prov_id, 'Tartagal',                        'tartagal',                         7)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── San Juan ──────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'san-juan';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Caucete',      'caucete',      1),
  (v_prov_id, 'Pocito',       'pocito',       2),
  (v_prov_id, 'Rawson',       'rawson',       3),
  (v_prov_id, 'Rivadavia',    'rivadavia',    4),
  (v_prov_id, 'San Juan',     'san-juan',     5),
  (v_prov_id, 'Santa Lucía',  'santa-lucia',  6),
  (v_prov_id, 'Valle Fértil', 'valle-fertil', 7)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── San Luis ──────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'san-luis';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'La Punta',      'la-punta',      1),
  (v_prov_id, 'Merlo',         'merlo',         2),
  (v_prov_id, 'San Luis',      'san-luis',      3),
  (v_prov_id, 'Villa Mercedes','villa-mercedes', 4)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Santa Cruz ────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'santa-cruz';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Caleta Olivia',      'caleta-olivia',      1),
  (v_prov_id, 'El Calafate',        'el-calafate',        2),
  (v_prov_id, 'Perito Moreno',      'perito-moreno',      3),
  (v_prov_id, 'Pico Truncado',      'pico-truncado',      4),
  (v_prov_id, 'Puerto Deseado',     'puerto-deseado',     5),
  (v_prov_id, 'Puerto San Julián',  'puerto-san-julian',  6),
  (v_prov_id, 'Río Gallegos',       'rio-gallegos',       7),
  (v_prov_id, 'Río Turbio',         'rio-turbio',         8)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Santa Fe ──────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'santa-fe';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Cañada de Gómez',   'canada-de-gomez',    1),
  (v_prov_id, 'Casilda',            'casilda',            2),
  (v_prov_id, 'Esperanza',          'esperanza',          3),
  (v_prov_id, 'Firmat',             'firmat',             4),
  (v_prov_id, 'Rafaela',            'rafaela',            5),
  (v_prov_id, 'Reconquista',        'reconquista',        6),
  (v_prov_id, 'Rosario',            'rosario',            7),
  (v_prov_id, 'Rufino',             'rufino',             8),
  (v_prov_id, 'San Cristóbal',      'san-cristobal',      9),
  (v_prov_id, 'San Jorge',          'san-jorge',         10),
  (v_prov_id, 'San Lorenzo',        'san-lorenzo',       11),
  (v_prov_id, 'Santa Fe',           'santa-fe',          12),
  (v_prov_id, 'Venado Tuerto',      'venado-tuerto',     13),
  (v_prov_id, 'Vera',               'vera',              14),
  (v_prov_id, 'Villa Constitución', 'villa-constitucion',15)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Santiago del Estero ───────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'santiago-del-estero';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Añatuya',              'anatuya',              1),
  (v_prov_id, 'Frías',                'frias',                2),
  (v_prov_id, 'La Banda',             'la-banda',             3),
  (v_prov_id, 'Monte Quemado',        'monte-quemado',        4),
  (v_prov_id, 'Quimilí',              'quimili',              5),
  (v_prov_id, 'Santiago del Estero',  'santiago-del-estero',  6),
  (v_prov_id, 'Termas de Río Hondo',  'termas-de-rio-hondo',  7)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Tierra del Fuego ──────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'tierra-del-fuego';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Río Grande', 'rio-grande', 1),
  (v_prov_id, 'Tolhuin',    'tolhuin',    2),
  (v_prov_id, 'Ushuaia',    'ushuaia',    3)
ON CONFLICT (province_id, slug) DO NOTHING;

-- ── Tucumán ───────────────────────────────────────────────────
SELECT id INTO v_prov_id FROM public.provinces WHERE slug = 'tucuman';
INSERT INTO public.localities (province_id, name, slug, sort_order) VALUES
  (v_prov_id, 'Aguilares',              'aguilares',              1),
  (v_prov_id, 'Banda del Río Salí',     'banda-del-rio-sali',     2),
  (v_prov_id, 'Concepción',             'concepcion',             3),
  (v_prov_id, 'Famaillá',               'famailla',               4),
  (v_prov_id, 'Monteros',               'monteros',               5),
  (v_prov_id, 'San Miguel de Tucumán',  'san-miguel-de-tucuman',  6),
  (v_prov_id, 'Simoca',                 'simoca',                 7),
  (v_prov_id, 'Tafí Viejo',             'tafi-viejo',             8),
  (v_prov_id, 'Yerba Buena',            'yerba-buena',            9)
ON CONFLICT (province_id, slug) DO NOTHING;

END $$;

DO $$ BEGIN
  RAISE NOTICE 'Sprint 5A: provinces (24) y localities (~270) creadas con éxito.';
END $$;
