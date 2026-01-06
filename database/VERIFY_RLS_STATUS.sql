-- ============================================
-- 🔍 VERIFICAR ESTADO COMPLETO DE RLS
-- ============================================

-- 1️⃣ Ver si RLS está habilitado
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ads';

-- 2️⃣ Ver TODAS las políticas activas en ads
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as command,
  roles,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'ads'
ORDER BY cmd, policyname;

-- 3️⃣ Ver si la política SuperAdmin existe
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'ads' 
AND policyname LIKE '%superadmin%';

-- 4️⃣ TEST: Ver avisos como usuario actual (debería funcionar si sos SuperAdmin)
SELECT 
  id,
  title,
  status,
  user_id,
  created_at
FROM ads
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 5;

-- 5️⃣ Ver tu usuario y rol actual
SELECT 
  auth.uid() as current_user_id,
  u.email,
  u.role,
  u.full_name
FROM users u
WHERE u.id = auth.uid();

-- ============================================
-- 📋 INTERPRETACIÓN RESULTADOS:
-- ============================================
-- ✅ Si rls_enabled = true → RLS está activo
-- ✅ Si ves política "ads_select_superadmin" → Política creada
-- ✅ Si el TEST devuelve avisos → RLS funciona correctamente
-- ❌ Si el TEST devuelve 0 avisos → Problema con la política o rol
