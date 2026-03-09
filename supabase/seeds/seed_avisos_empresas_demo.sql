-- ============================================================
-- SEED: Avisos demo para 2 empresas de prueba
-- ============================================================
-- Instrucciones:
--   1. Reemplazar los slugs en las variables de la sección CONFIG
--   2. Ejecutar en Supabase SQL Editor (DEV)
-- ============================================================

DO $$
DECLARE
  -- ══════════════════════════════════════════
  -- CONFIG — CAMBIAR ESTOS VALORES
  -- ══════════════════════════════════════════
  slug_empresa1   text := 'SLUG_EMPRESA_1_AQUI';   -- ej: 'agrowellness-1a2b'
  slug_empresa2   text := 'SLUG_EMPRESA_2_AQUI';   -- ej: 'ganaderia-del-sur-3c4d'
  -- ══════════════════════════════════════════

  -- IDs de empresas
  emp1_id         uuid;
  emp1_user_id    uuid;
  emp2_id         uuid;
  emp2_user_id    uuid;

  -- IDs de categorías y subcategorías
  cat_agro_id     uuid;
  cat_gan_id      uuid;
  sub_agro_serv   uuid;   -- agricultura > servicios
  sub_agro_ins    uuid;   -- agricultura > insumos
  sub_gan_hac     uuid;   -- ganaderia > hacienda
  sub_gan_ins     uuid;   -- ganaderia > insumos
  sub_gan_serv    uuid;   -- ganaderia > servicios

BEGIN

  -- ── Resolver empresas ──────────────────────────────────────
  SELECT id, user_id INTO emp1_id, emp1_user_id
    FROM public.business_profiles WHERE slug = slug_empresa1 AND is_active = true;
  SELECT id, user_id INTO emp2_id, emp2_user_id
    FROM public.business_profiles WHERE slug = slug_empresa2 AND is_active = true;

  IF emp1_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró empresa con slug: %', slug_empresa1;
  END IF;
  IF emp2_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró empresa con slug: %', slug_empresa2;
  END IF;

  -- ── Resolver categorías ────────────────────────────────────
  SELECT id INTO cat_agro_id FROM public.categories WHERE name = 'agricultura' LIMIT 1;
  SELECT id INTO cat_gan_id  FROM public.categories WHERE name = 'ganaderia'   LIMIT 1;

  SELECT id INTO sub_agro_serv FROM public.subcategories
    WHERE category_id = cat_agro_id AND name = 'servicios' LIMIT 1;
  SELECT id INTO sub_agro_ins  FROM public.subcategories
    WHERE category_id = cat_agro_id AND name = 'insumos'   LIMIT 1;
  SELECT id INTO sub_gan_hac   FROM public.subcategories
    WHERE category_id = cat_gan_id  AND name IN ('hacienda','haciendas') LIMIT 1;
  SELECT id INTO sub_gan_ins   FROM public.subcategories
    WHERE category_id = cat_gan_id  AND name = 'insumos'   LIMIT 1;
  SELECT id INTO sub_gan_serv  FROM public.subcategories
    WHERE category_id = cat_gan_id  AND name = 'servicios' LIMIT 1;

  RAISE NOTICE 'Empresa 1: % (id: %)', slug_empresa1, emp1_id;
  RAISE NOTICE 'Empresa 2: % (id: %)', slug_empresa2, emp2_id;
  RAISE NOTICE 'Cat Agricultura: %, Cat Ganaderia: %', cat_agro_id, cat_gan_id;

  -- ══════════════════════════════════════════════════════════════
  -- EMPRESA 1 — Avisos de Servicios Agrícolas
  -- (ajustar categoría según qué tipo de empresa sea)
  -- ══════════════════════════════════════════════════════════════

  INSERT INTO public.ads (
    id, user_id, business_profile_id, category_id, subcategory_id,
    title, description, price, price_unit, currency,
    province, city, status, approval_status, ad_type,
    images, attributes, slug, short_id,
    published_at, expires_at
  ) VALUES

  -- Aviso 1.1 — Siembra directa
  (
    gen_random_uuid(), emp1_user_id, emp1_id, cat_agro_id, sub_agro_serv,
    'Siembra Directa — Soja, Maíz y Trigo',
    'Ofrecemos servicio de siembra directa con equipamiento propio de última generación. Sembradora John Deere 1113 de 23 surcos a 52cm. Trabajo prolijo y a tiempo. Cubrimos campaña gruesa y fina en toda la provincia.',
    85000, 'ha', 'ARS',
    'Córdoba', 'Río Cuarto',
    'active', 'approved', 'company',
    '[{"url":"https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80"},{"url":"https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80"}]'::jsonb,
    '{"equipos":"Sembradora JD 1113 23 surcos","cultivos":"Soja, Maíz, Trigo","capacidad_diaria":"150 ha/día"}'::jsonb,
    'siembra-directa-soja-maiz-trigo-' || substring(gen_random_uuid()::text, 1, 6),
    substring(gen_random_uuid()::text, 1, 8),
    now() - interval '5 days', now() + interval '60 days'
  ),

  -- Aviso 1.2 — Fumigación
  (
    gen_random_uuid(), emp1_user_id, emp1_id, cat_agro_id, sub_agro_serv,
    'Fumigación Terrestre — Pulverizadora autopropulsada',
    'Servicio de fumigación con pulverizadora autopropulsada Jacto Uniport 3030. Botalón de 36m. Trabaja con todas las formulaciones. GPS y piloto automático. Dosificación variable. Servicio nocturno disponible.',
    12000, 'ha', 'ARS',
    'Córdoba', 'Río Cuarto',
    'active', 'approved', 'company',
    '[{"url":"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80"},{"url":"https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80"}]'::jsonb,
    '{"equipo":"Jacto Uniport 3030","botalon_m":36,"gps":true,"servicio_nocturno":true}'::jsonb,
    'fumigacion-terrestre-pulverizadora-' || substring(gen_random_uuid()::text, 1, 6),
    substring(gen_random_uuid()::text, 1, 8),
    now() - interval '3 days', now() + interval '60 days'
  ),

  -- Aviso 1.3 — Cosecha
  (
    gen_random_uuid(), emp1_user_id, emp1_id, cat_agro_id, sub_agro_serv,
    'Cosecha de Soja y Maíz — Campaña 2026',
    'Contratamos cosecha fina y gruesa. Cosechadora Case IH 8250 con cabezal maicero 8 surcos y plataforma draper 40 pies. Transporte de granos incluido con 3 camiones propios. Zona centro de Córdoba.',
    95000, 'ha', 'ARS',
    'Córdoba', 'Bell Ville',
    'active', 'approved', 'company',
    '[{"url":"https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&q=80"}]'::jsonb,
    '{"equipo":"Case IH 8250","cabezal_maiz":"8 surcos","plataforma_pies":40,"transporte":true}'::jsonb,
    'cosecha-soja-maiz-campana-2026-' || substring(gen_random_uuid()::text, 1, 6),
    substring(gen_random_uuid()::text, 1, 8),
    now() - interval '1 day', now() + interval '60 days'
  ),

  -- Aviso 1.4 — Insumo (para mostrar diferenciación SERVICIO vs INSUMO)
  (
    gen_random_uuid(), emp1_user_id, emp1_id, cat_agro_id, sub_agro_ins,
    'Semillas de Soja Don Mario 6.2i — Bolsas disponibles',
    'Vendemos semilla de soja Don Mario 6.2i tratada con fungicida + insecticida de alta calidad. Disponible inmediato. Calidad certificada. Entrega en campo. Precio por bolsa de 40kg.',
    48000, NULL, 'ARS',
    'Córdoba', 'Río Cuarto',
    'active', 'approved', 'company',
    '[{"url":"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"}]'::jsonb,
    '{"marca":"Don Mario","variedad":"6.2i","peso_kg":40,"tratamiento":"fungicida+insecticida","disponibilidad":"inmediato"}'::jsonb,
    'semillas-soja-don-mario-62i-' || substring(gen_random_uuid()::text, 1, 6),
    substring(gen_random_uuid()::text, 1, 8),
    now() - interval '7 days', now() + interval '30 days'
  );

  -- ══════════════════════════════════════════════════════════════
  -- EMPRESA 2 — Avisos de Ganadería / Hacienda
  -- (ajustar categoría según qué tipo de empresa sea)
  -- ══════════════════════════════════════════════════════════════

  INSERT INTO public.ads (
    id, user_id, business_profile_id, category_id, subcategory_id,
    title, description, price, price_unit, currency,
    province, city, status, approval_status, ad_type,
    images, attributes, slug, short_id,
    published_at, expires_at
  ) VALUES

  -- Aviso 2.1 — Novillos
  (
    gen_random_uuid(), emp2_user_id, emp2_id, cat_gan_id, sub_gan_hac,
    'Novillos Angus Negros — Lote 80 cabezas 280/300 kg',
    'Se vende lote de novillos Angus Negros puros de pedigree, gordura de campo. Peso promedio 290 kg vivos. Excelente estado sanitario, al día con vacunas. Entrega inmediata. Posibilidad de armar lotes chicos.',
    2800, 'kg-vivo', 'ARS',
    'Buenos Aires', 'Olavarría',
    'active', 'approved', 'company',
    '[{"url":"https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&q=80"},{"url":"https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&q=80"}]'::jsonb,
    '{"raza":"Angus Negro","cantidad_cabezas":80,"peso_min_kg":280,"peso_max_kg":300,"sanidad":"al día","origen":"campo propio"}'::jsonb,
    'novillos-angus-negros-lote-80-cabezas-' || substring(gen_random_uuid()::text, 1, 6),
    substring(gen_random_uuid()::text, 1, 8),
    now() - interval '4 days', now() + interval '30 days'
  ),

  -- Aviso 2.2 — Vaquillonas
  (
    gen_random_uuid(), emp2_user_id, emp2_id, cat_gan_id, sub_gan_hac,
    'Vaquillonas Braford preñadas — 30 cabezas',
    'Vendo lote de 30 vaquillonas Braford preñadas. Tacto positivo primer tercio. 340/360 kg. Cría a campo natural sin suplementación. Buen temperamento. Ideales para inversión ganadera. Fletes a cargo del comprador.',
    NULL, NULL, 'ARS',
    'Corrientes', 'Mercedes',
    'active', 'approved', 'company',
    '[{"url":"https://images.unsplash.com/photo-1560769629-b71774f32f32?w=800&q=80"}]'::jsonb,
    '{"raza":"Braford","cantidad_cabezas":30,"condicion":"preñadas","tercio_prenez":"primer","peso_min_kg":340,"peso_max_kg":360}'::jsonb,
    'vaquillonas-braford-prenadas-30-cabezas-' || substring(gen_random_uuid()::text, 1, 6),
    substring(gen_random_uuid()::text, 1, 8),
    now() - interval '2 days', now() + interval '30 days'
  ),

  -- Aviso 2.3 — Toros
  (
    gen_random_uuid(), emp2_user_id, emp2_id, cat_gan_id, sub_gan_hac,
    'Toros Hereford con EGD — Lote 5 animales',
    'Se ofrecen 5 toros Hereford con evaluación genética de DEP (EGD). Edad 2.5 años. Habilitados sanitariamente. Aptos para servicio. Genealogía certificada. Entrega en establecimiento previo coordinación.',
    850000, 'cabeza', 'ARS',
    'Entre Ríos', 'Gualeguaychú',
    'active', 'approved', 'company',
    '[{"url":"https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&q=80"}]'::jsonb,
    '{"raza":"Hereford","cantidad_cabezas":5,"edad_anos":2.5,"egd":true,"habilitado_sanitario":true}'::jsonb,
    'toros-hereford-egd-lote-5-' || substring(gen_random_uuid()::text, 1, 6),
    substring(gen_random_uuid()::text, 1, 8),
    now() - interval '6 days', now() + interval '30 days'
  ),

  -- Aviso 2.4 — Servicio ganadero
  (
    gen_random_uuid(), emp2_user_id, emp2_id, cat_gan_id, sub_gan_serv,
    'Servicio de Vacunación y Sanidad Animal — Toda la provincia',
    'Prestamos servicio de vacunación, desparasitación y marcación de hacienda. Veterinario matriculado. Trabajamos con todas las razas y tamaños de rodeo. Equipamiento propio. Emitimos certificados sanitarios oficiales.',
    NULL, NULL, 'ARS',
    'Corrientes', 'Mercedes',
    'active', 'approved', 'company',
    '[{"url":"https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&q=80"}]'::jsonb,
    '{"servicios":["vacunación","desparasitación","marcación"],"veterinario_matriculado":true,"certificados":true}'::jsonb,
    'servicio-vacunacion-sanidad-animal-' || substring(gen_random_uuid()::text, 1, 6),
    substring(gen_random_uuid()::text, 1, 8),
    now() - interval '8 days', now() + interval '60 days'
  );

  RAISE NOTICE '✅ Seed completado: 4 avisos empresa 1, 4 avisos empresa 2';

END $$;
