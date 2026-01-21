-- ================================================================================
-- DIAGNÓSTICO COMPLETO DE BASE DE DATOS - Rural24
-- ================================================================================
-- Fecha: 21 de Enero 2026
-- 
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Pegar este script completo
-- 3. Ejecutar y revisar los resultados
-- ================================================================================

-- ================================================================================
-- 1. LISTAR TODAS LAS TABLAS Y SUS COLUMNAS
-- ================================================================================
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- ================================================================================
-- 2. VER SI RLS ESTÁ HABILITADO EN CADA TABLA
-- ================================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ================================================================================
-- 3. LISTAR TODAS LAS POLÍTICAS RLS ACTUALES
-- ================================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  SUBSTRING(qual::text, 1, 100) as "Condition (truncated)"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ================================================================================
-- 4. CONTEO DE REGISTROS POR TABLA
-- ================================================================================

-- Users
SELECT 'users' as tabla, COUNT(*) as total FROM public.users;

-- Ads
SELECT 'ads' as tabla, COUNT(*) as total FROM public.ads;

-- Categories
SELECT 'categories' as tabla, COUNT(*) as total FROM public.categories;

-- Subcategories
SELECT 'subcategories' as tabla, COUNT(*) as total FROM public.subcategories;

-- Banners
SELECT 'banners' as tabla, COUNT(*) as total FROM public.banners;

-- Brands (si existe)
SELECT 'brands' as tabla, COUNT(*) as total FROM public.brands;

-- Models (si existe)
SELECT 'models' as tabla, COUNT(*) as total FROM public.models;

-- ================================================================================
-- 5. DETALLE DE USUARIOS Y ROLES
-- ================================================================================
SELECT 
  id,
  email,
  full_name,
  role,
  email_verified,
  created_at
FROM public.users
ORDER BY role, email;

-- ================================================================================
-- 6. FUNCIONES EXISTENTES RELACIONADAS CON AUTH/RLS
-- ================================================================================
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%admin%' 
       OR routine_name LIKE '%auth%' 
       OR routine_name LIKE '%role%'
       OR routine_name LIKE '%superadmin%')
ORDER BY routine_name;

-- ================================================================================
-- 7. VER GRANTS/PERMISOS EN TABLAS PÚBLICAS
-- ================================================================================
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ================================================================================
-- 8. DETALLE DE ADS (avisos) - Estructura
-- ================================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ads'
ORDER BY ordinal_position;

-- ================================================================================
-- 9. AVISOS DESTACADOS
-- ================================================================================
SELECT 
  id,
  title,
  status,
  featured,
  category_id,
  user_id
FROM public.ads
WHERE featured = true
ORDER BY category_id;

-- ================================================================================
-- FIN DEL DIAGNÓSTICO
-- ================================================================================
