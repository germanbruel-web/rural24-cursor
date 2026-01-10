-- =====================================================
-- DIAGNÓSTICO: ¿Por qué no se ven los avisos?
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1️⃣ Ver TODOS los avisos (sin filtro RLS)
SELECT 
  id,
  title,
  status,
  approval_status,
  user_id,
  created_at,
  CASE 
    WHEN status = 'active' AND approval_status = 'approved' THEN '✅ VISIBLE'
    WHEN status = 'active' AND approval_status != 'approved' THEN '❌ NO APROBADO'
    WHEN status != 'active' THEN '❌ INACTIVO'
    ELSE '❓ OTRO'
  END as visibility_status
FROM ads
ORDER BY created_at DESC
LIMIT 20;

-- 2️⃣ Contar avisos por estado
SELECT 
  status,
  approval_status,
  COUNT(*) as count
FROM ads
GROUP BY status, approval_status
ORDER BY count DESC;

-- 3️⃣ Ver políticas RLS activas
SELECT 
  policyname,
  cmd,
  qual as condition_preview
FROM pg_policies
WHERE tablename = 'ads'
ORDER BY policyname;

-- 4️⃣ SOLUCIÓN: Aprobar todos los avisos activos
-- ⚠️ Ejecutar esta línea para aprobar TODOS los avisos activos
UPDATE ads SET approval_status = 'approved' WHERE status = 'active';

-- 5️⃣ Verificar avisos visibles para público
SELECT 
  id,
  title,
  status,
  approval_status
FROM ads
WHERE status = 'active' 
  AND approval_status = 'approved'
ORDER BY created_at DESC;
