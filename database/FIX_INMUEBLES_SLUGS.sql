-- ============================================================
-- FIX: Subcategorías sin slug - Basado en consulta real BD
-- Rural24 - 2 Feb 2026
-- ============================================================

-- DIAGNÓSTICO PREVIO:
-- Se encontraron 24 subcategorías sin slug en varias categorías.
-- 11 de ellas pertenecen a "Inmuebles Rurales"

-- ============================================================
-- PASO 1: INMUEBLES RURALES (11 subcategorías)
-- ============================================================
UPDATE subcategories SET slug = 'estancias' WHERE id = 'c8db27e1-a9f1-437f-bfbd-fc17df85d243';
UPDATE subcategories SET slug = 'tambos' WHERE id = 'cfdc21bb-54ff-49dd-8692-c0976cf45bb3';
UPDATE subcategories SET slug = 'cabanas' WHERE id = 'b4d88643-9113-4d5f-97e9-2b988c717f75';
UPDATE subcategories SET slug = 'feedlots' WHERE id = '04ecac9a-8e18-4815-b321-ec729d02e804';
UPDATE subcategories SET slug = 'campos' WHERE id = '99195194-ebfe-44df-85c8-26d0903e8bce';
UPDATE subcategories SET slug = 'haras' WHERE id = '4d99dd23-6141-4055-8765-eaeda000787d';
UPDATE subcategories SET slug = 'campos-especiales' WHERE id = 'b81d153a-42ed-474a-802c-19c5a05a3123';
UPDATE subcategories SET slug = 'lotes-rurales' WHERE id = 'c9d14324-5f1d-4527-9288-9a8c2bdbfb8f';
UPDATE subcategories SET slug = 'establecimientos-forestales' WHERE id = '430078d2-1e77-4818-80d4-47c2c8e0820b';
UPDATE subcategories SET slug = 'quintas' WHERE id = 'd205abd0-ec47-4da6-ad3c-c1e7a67ddbf0';
UPDATE subcategories SET slug = 'chacras' WHERE id = '9a0c289b-4a88-48fd-b6a3-56be9cf8a7a5';

-- ============================================================
-- PASO 2: MAQUINARIAS AGRÍCOLAS (5 subcategorías)
-- ============================================================
UPDATE subcategories SET slug = 'rastras' WHERE id = '0720e6a8-246c-412c-ad97-626fef0a18ee';
UPDATE subcategories SET slug = 'arados' WHERE id = 'd9fa1e2f-7c6f-425d-818b-6475695a9e20';
UPDATE subcategories SET slug = 'camiones-camionetas' WHERE id = '1c52212a-c85d-45ca-9a15-c5e3f79385da';
UPDATE subcategories SET slug = 'fertilizadoras' WHERE id = 'd917e833-5cd1-4d1c-851a-5bb7ca2f77f0';
UPDATE subcategories SET slug = 'tolvas' WHERE id = 'e4a2e40f-bfe4-4758-86fc-211a828289e1';
UPDATE subcategories SET slug = 'infraestructura' WHERE id = 'd454fdf6-0ea7-44de-89dd-9837e726703e';

-- ============================================================
-- PASO 3: INSUMOS AGROPECUARIOS (3 subcategorías)
-- ============================================================
UPDATE subcategories SET slug = 'tierra-bioinsumos' WHERE id = 'b518f375-35e7-4ce1-9407-5f074093ef5f';
UPDATE subcategories SET slug = 'alimento-cuidado-animal' WHERE id = 'e98bfb6a-f267-4da7-95c0-29f7e279a139';
UPDATE subcategories SET slug = 'semillas-pasturas' WHERE id = 'e0185830-28d5-4e64-af51-7ad37a2570cc';

-- ============================================================
-- PASO 4: SERVICIOS RURALES (5 subcategorías)
-- ============================================================
UPDATE subcategories SET slug = 'trabajo-a-campo' WHERE id = 'cb4a63e2-0240-4137-9b9b-494584e60710';
UPDATE subcategories SET slug = 'servicios-tecnicos' WHERE id = 'ca23283d-384f-45c9-9151-02dc6d013e39';
UPDATE subcategories SET slug = 'servicios-ganaderos' WHERE id = '2f78b8d4-85a4-469a-bd7f-f8ef206c45ea';
UPDATE subcategories SET slug = 'logistica-rural' WHERE id = '7210ef15-d667-44bb-ad19-2b26a3a26c86';
UPDATE subcategories SET slug = 'infraestructura-rural' WHERE id = '06f171aa-2355-49d0-9c0c-1143500b31fd';

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT 
  s.id,
  s.name,
  s.slug,
  c.name as categoria
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug IS NULL
ORDER BY c.name, s.name;
