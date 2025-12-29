-- ============================================
-- VERIFICAR Y CORREGIR enriched_data del aviso
-- ============================================

-- 1. Ver qué tiene actualmente el aviso
SELECT 
  id,
  title,
  enriched_data,
  jsonb_typeof(enriched_data) as tipo_dato,
  jsonb_object_keys(enriched_data) as claves
FROM ads
WHERE id = '6b6c1153-c7aa-41f4-8eac-faedf1701f88';

-- 2. Si enriched_data está vacío o es null, actualizarlo con datos de ejemplo
UPDATE ads
SET enriched_data = jsonb_build_object(
  'características_adicionales', 'Aire acondicionadoComputadora de a bordoRadio AM/FM'
)
WHERE id = '6b6c1153-c7aa-41f4-8eac-faedf1701f88'
AND (enriched_data IS NULL OR enriched_data = '{}'::jsonb);

-- 3. Verificar que se actualizó
SELECT 
  id,
  title,
  enriched_data
FROM ads
WHERE id = '6b6c1153-c7aa-41f4-8eac-faedf1701f88';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- El campo enriched_data debería tener:
-- {
--   "características_adicionales": "Aire acondicionadoComputadora de a bordoRadio AM/FM"
-- }
--
-- Después de ejecutar esto, refrescá el navegador y deberías ver en consola:
-- 🔍 Procesando: {key: "características_adicionales", value: "Aire acondicionadoComputadora de a bordoRadio AM/FM", tipo: "string"}
--   🛠️ Después de regex: Aire acondicionado|Computadora de a bordo|Radio AM/FM
--   ✓ Separado por patrones: ["Aire acondicionado", "Computadora de a bordo", "Radio AM/FM"]
