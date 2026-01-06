-- ============================================
-- 🚨 DEBUG MODE: Deshabilitar RLS temporalmente
-- ============================================
-- ⚠️  SOLO DESARROLLO - NO PRODUCCIÓN
-- 
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1️⃣ Ver estado actual de RLS
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ads';

-- 2️⃣ Ver políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'ads'
ORDER BY cmd;

-- 3️⃣ DESHABILITAR RLS (permite ver todos los avisos sin restricción)
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ads';

-- 4️⃣ Test query (debería devolver TODOS los avisos)
SELECT 
  id, 
  title, 
  user_id, 
  status,
  created_at
FROM ads
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- ✅ PARA RE-HABILITAR (EJECUTAR DESPUÉS):
-- ============================================
/*
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Verificar re-habilitación
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ads';
*/
