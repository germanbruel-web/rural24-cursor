-- =====================================================
-- SEED DATA: MARCAS PRINCIPALES
-- Fecha: 16 de diciembre, 2025
-- Descripción: Marcas principales de maquinaria agrícola
-- =====================================================

-- TRACTORES - Marcas principales
INSERT INTO brands (name, display_name, logo_url, website, country, is_active, ml_aliases)
VALUES 
  ('john-deere', 'John Deere', NULL, 'https://www.deere.com', 'USA', true, 
   ARRAY['john deer', 'jhon deere', 'jhon deer', 'jd', 'deere']),
  
  ('case-ih', 'Case IH', NULL, 'https://www.caseih.com', 'USA', true,
   ARRAY['case', 'case ih', 'caseih', 'case internacional']),
  
  ('new-holland', 'New Holland', NULL, 'https://www.newholland.com', 'Italy', true,
   ARRAY['new holland', 'newholland', 'nh', 'new holand']),
  
  ('massey-ferguson', 'Massey Ferguson', NULL, 'https://www.masseyferguson.com', 'USA', true,
   ARRAY['massey', 'ferguson', 'mf', 'massey fergusson', 'masey ferguson']),
  
  ('valtra', 'Valtra', NULL, 'https://www.valtra.com', 'Finland', true,
   ARRAY['valtra', 'valmet']),
  
  ('deutz-fahr', 'Deutz-Fahr', NULL, 'https://www.deutz-fahr.com', 'Germany', true,
   ARRAY['deutz', 'fahr', 'deutz fahr', 'deutz-fahr']),
  
  ('fendt', 'Fendt', NULL, 'https://www.fendt.com', 'Germany', true,
   ARRAY['fendt', 'fent']),
  
  ('kubota', 'Kubota', NULL, 'https://www.kubota.com', 'Japan', true,
   ARRAY['kubota', 'kubotta']),
  
  ('landini', 'Landini', NULL, 'https://www.landini.com', 'Italy', true,
   ARRAY['landini', 'landinni']),
  
  ('pauny', 'Pauny', NULL, NULL, 'Argentina', true,
   ARRAY['pauny', 'pauni'])
ON CONFLICT (name) DO NOTHING;

-- COSECHADORAS - Marcas principales
INSERT INTO brands (name, display_name, logo_url, website, country, is_active, ml_aliases)
VALUES 
  ('claas', 'Claas', NULL, 'https://www.claas.com', 'Germany', true,
   ARRAY['claas', 'clas', 'class']),
  
  ('gleaner', 'Gleaner', NULL, 'https://www.gleanercombines.com', 'USA', true,
   ARRAY['gleaner', 'glenner'])
ON CONFLICT (name) DO NOTHING;

-- SEMBRADORAS - Marcas principales
INSERT INTO brands (name, display_name, logo_url, website, country, is_active, ml_aliases)
VALUES 
  ('apache', 'Apache', NULL, NULL, 'Argentina', true,
   ARRAY['apache', 'apachet']),
  
  ('air-drill', 'Air Drill', NULL, NULL, 'Argentina', true,
   ARRAY['air drill', 'airdrill', 'air-drill']),
  
  ('metalfor', 'Metalfor', NULL, NULL, 'Argentina', true,
   ARRAY['metalfor', 'metal for']),
  
  ('crucianelli', 'Crucianelli', NULL, NULL, 'Argentina', true,
   ARRAY['crucianelli', 'crusianelli'])
ON CONFLICT (name) DO NOTHING;

-- PULVERIZADORAS - Marcas principales
INSERT INTO brands (name, display_name, logo_url, website, country, is_active, ml_aliases)
VALUES 
  ('hagie', 'Hagie', NULL, 'https://www.hagie.com', 'USA', true,
   ARRAY['hagie', 'haggie']),
  
  ('montana', 'Montana', NULL, NULL, 'Argentina', true,
   ARRAY['montana', 'montaña'])
ON CONFLICT (name) DO NOTHING;

-- IMPLEMENTOS - Marcas principales
INSERT INTO brands (name, display_name, logo_url, website, country, is_active, ml_aliases)
VALUES 
  ('kuhn', 'Kuhn', NULL, 'https://www.kuhn.com', 'France', true,
   ARRAY['kuhn', 'kun']),
  
  ('lemken', 'Lemken', NULL, 'https://www.lemken.com', 'Germany', true,
   ARRAY['lemken', 'lemcken']),
  
  ('ombu', 'Ombú', NULL, NULL, 'Argentina', true,
   ARRAY['ombu', 'ombú'])
ON CONFLICT (name) DO NOTHING;

-- RIEGO - Marcas principales
INSERT INTO brands (name, display_name, logo_url, website, country, is_active, ml_aliases)
VALUES 
  ('valley', 'Valley', NULL, 'https://www.valleyirrigation.com', 'USA', true,
   ARRAY['valley', 'valey']),
  
  ('lindsay', 'Lindsay', NULL, 'https://www.lindsayirrigation.com', 'USA', true,
   ARRAY['lindsay', 'lindsey', 'linzey']),
  
  ('reinke', 'Reinke', NULL, 'https://www.reinke.com', 'USA', true,
   ARRAY['reinke', 'reineke'])
ON CONFLICT (name) DO NOTHING;

-- MIXER - Marcas principales
INSERT INTO brands (name, display_name, logo_url, website, country, is_active, ml_aliases)
VALUES 
  ('akron', 'Akron', NULL, NULL, 'Argentina', true,
   ARRAY['akron', 'acron']),
  
  ('silobolsa', 'Silobolsa', NULL, NULL, 'Argentina', true,
   ARRAY['silobolsa', 'silo bolsa', 'silo-bolsa'])
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- VINCULAR MARCAS CON SUBCATEGORÍAS
-- =====================================================

-- Tractores
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT s.id, b.id, 
  CASE b.name
    WHEN 'john-deere' THEN 1
    WHEN 'case-ih' THEN 2
    WHEN 'new-holland' THEN 3
    WHEN 'massey-ferguson' THEN 4
    WHEN 'valtra' THEN 5
    WHEN 'deutz-fahr' THEN 6
    WHEN 'fendt' THEN 7
    WHEN 'kubota' THEN 8
    WHEN 'landini' THEN 9
    WHEN 'pauny' THEN 10
  END
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'tractores'
  AND b.name IN ('john-deere', 'case-ih', 'new-holland', 'massey-ferguson', 'valtra', 
                 'deutz-fahr', 'fendt', 'kubota', 'landini', 'pauny')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- Cosechadoras
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT s.id, b.id,
  CASE b.name
    WHEN 'john-deere' THEN 1
    WHEN 'case-ih' THEN 2
    WHEN 'new-holland' THEN 3
    WHEN 'massey-ferguson' THEN 4
    WHEN 'claas' THEN 5
    WHEN 'gleaner' THEN 6
  END
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'cosechadoras'
  AND b.name IN ('john-deere', 'case-ih', 'new-holland', 'massey-ferguson', 'claas', 'gleaner')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- Sembradoras
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT s.id, b.id,
  CASE b.name
    WHEN 'apache' THEN 1
    WHEN 'air-drill' THEN 2
    WHEN 'john-deere' THEN 3
    WHEN 'case-ih' THEN 4
    WHEN 'metalfor' THEN 5
    WHEN 'crucianelli' THEN 6
  END
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'sembradoras'
  AND b.name IN ('apache', 'air-drill', 'john-deere', 'case-ih', 'metalfor', 'crucianelli')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- Pulverizadoras
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT s.id, b.id,
  CASE b.name
    WHEN 'hagie' THEN 1
    WHEN 'case-ih' THEN 2
    WHEN 'john-deere' THEN 3
    WHEN 'montana' THEN 4
    WHEN 'metalfor' THEN 5
  END
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'pulverizadoras'
  AND b.name IN ('hagie', 'case-ih', 'john-deere', 'montana', 'metalfor')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- Equipos de Riego
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT s.id, b.id,
  CASE b.name
    WHEN 'valley' THEN 1
    WHEN 'lindsay' THEN 2
    WHEN 'reinke' THEN 3
  END
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'equipos-riego'
  AND b.name IN ('valley', 'lindsay', 'reinke')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- Mixer y Equipos de Alimentación
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT s.id, b.id,
  CASE b.name
    WHEN 'akron' THEN 1
    WHEN 'silobolsa' THEN 2
  END
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'mixer-alimentacion'
  AND b.name IN ('akron', 'silobolsa')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- =====================================================
-- ✅ VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
  total_brands INTEGER;
  total_relationships INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_brands FROM brands;
  SELECT COUNT(*) INTO total_relationships FROM subcategory_brands;
  
  RAISE NOTICE '✅ Seed de marcas completado';
  RAISE NOTICE '📊 Total marcas: %', total_brands;
  RAISE NOTICE '🔗 Total relaciones marca-subcategoría: %', total_relationships;
END $$;
