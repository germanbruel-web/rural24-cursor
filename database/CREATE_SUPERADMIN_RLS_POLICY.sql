-- ============================================
-- ✅ SOLUCIÓN PERMANENTE: Política RLS para SuperAdmin
-- ============================================
-- PROBLEMA: SuperAdmins no pueden ver todos los avisos (RLS los bloquea)
-- SOLUCIÓN: Crear política que permita a SuperAdmins ver TODO

-- 1️⃣ Verificar políticas actuales
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'ads'
ORDER BY cmd, policyname;

-- 2️⃣ CREAR POLÍTICA SUPERADMIN (bypass RLS)
-- ⚠️  Ejecutar SOLO UNA VEZ
CREATE POLICY "ads_select_superadmin" ON public.ads
  FOR SELECT
  USING (
    -- SuperAdmin puede ver TODOS los avisos
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- 3️⃣ Verificar que la política se creó
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'ads' 
AND policyname = 'ads_select_superadmin';

-- 4️⃣ RE-HABILITAR RLS (ahora con política SuperAdmin)
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- 5️⃣ Verificar RLS habilitado
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ads';

-- 6️⃣ TEST: Verificar acceso como SuperAdmin
-- Deberías poder ejecutar esto y ver TODOS los avisos
SELECT 
  id,
  title,
  user_id,
  status,
  created_at
FROM ads
WHERE status = 'active'
ORDER BY created_at DESC;

-- ============================================
-- 📋 RESULTADO ESPERADO:
-- ============================================
-- ✅ RLS habilitado
-- ✅ Política SuperAdmin creada
-- ✅ SuperAdmins ven TODOS los avisos
-- ✅ Usuarios normales solo ven sus propios avisos (política existente)
-- ✅ Seguridad mantenida
