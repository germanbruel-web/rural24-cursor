-- ============================================
-- DIAGNÓSTICO COMPLETO: Por qué fallan las queries con 400
-- ============================================

-- 1. Ver políticas actuales de la tabla ads
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'ads'
ORDER BY cmd, policyname;

-- 2. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'ads';

-- 3. Ver estructura de la tabla ads
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ads'
ORDER BY ordinal_position;

-- 4. Intentar hacer una query simple como anónimo
-- (esto simula lo que hace el frontend)
SET ROLE anon;
SELECT id, title, status 
FROM ads 
WHERE id = '6b6c1153-c7aa-41f4-8eac-faedf1701f88';
RESET ROLE;

-- 5. Ver si hay triggers que puedan estar fallando
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'ads';

-- ============================================
-- Si la query en paso 4 falla, ejecutá esto para desactivar RLS temporalmente:
-- ============================================
-- ALTER TABLE ads DISABLE ROW LEVEL SECURITY;
-- 
-- Luego probá de nuevo en el navegador. Si funciona, el problema es RLS.
-- Después volvé a habilitar:
-- ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
