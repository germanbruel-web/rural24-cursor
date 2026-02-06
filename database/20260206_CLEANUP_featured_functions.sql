-- ============================================================================
-- CLEANUP: Eliminar TODAS las versiones de funciones admin_featured_*
-- Ejecutar ANTES de re-aplicar 20260206_admin_featured_system_FIXED.sql
-- ============================================================================

-- 1) Eliminar todas las versiones de admin_get_featured_ads
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname = 'admin_get_featured_ads'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
    RAISE NOTICE 'Eliminada: %', r.oid::regprocedure;
  END LOOP;
END $$;

-- 2) Eliminar todas las versiones de admin_cancel_featured_ad
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname = 'admin_cancel_featured_ad'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
    RAISE NOTICE 'Eliminada: %', r.oid::regprocedure;
  END LOOP;
END $$;

-- 3) Eliminar todas las versiones de admin_featured_stats
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname = 'admin_featured_stats'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
    RAISE NOTICE 'Eliminada: %', r.oid::regprocedure;
  END LOOP;
END $$;

-- 4) Eliminar todas las versiones de admin_get_featured_audit
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname = 'admin_get_featured_audit'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
    RAISE NOTICE 'Eliminada: %', r.oid::regprocedure;
  END LOOP;
END $$;

-- 5) Eliminar todas las versiones de admin_get_occupancy_grid
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname = 'admin_get_occupancy_grid'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
    RAISE NOTICE 'Eliminada: %', r.oid::regprocedure;
  END LOOP;
END $$;

-- ============================================================================
-- Verificación: Debería devolver 0 funciones
-- ============================================================================
SELECT 
  routine_name,
  routine_type,
  specific_name
FROM information_schema.routines 
WHERE routine_name LIKE 'admin_%'
  AND routine_schema = 'public';

-- Si devuelve 0 filas = SUCCESS ✅
-- Si devuelve funciones = ERROR (ejecutar script de nuevo)

-- ✅ Limpieza completada. Ahora ejecutar 20260206_admin_featured_system_FIXED.sql
