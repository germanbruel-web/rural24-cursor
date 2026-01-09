-- ================================================================================
-- RLS DUAL MODE: DEVELOPMENT vs PRODUCTION
-- ================================================================================
-- Fecha: 9 de Enero 2026
-- 
-- OBJETIVO: 
-- Permitir desarrollo sin restricciones en DEV pero seguridad estricta en PROD
--
-- USO:
-- 1. Copiar este archivo completo
-- 2. Abrir Supabase SQL Editor
-- 3. Pegar y ejecutar
-- 4. Cambiar mode_flag según ambiente:
--    - 'dev' = Sin restricciones (desarrollo local)
--    - 'prod' = Restricciones completas (producción)
-- ================================================================================

-- ================================================================================
-- PASO 1: CREAR TABLA DE CONFIGURACIÓN
-- ================================================================================
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valor por defecto: 'dev' (cambiar a 'prod' en producción)
INSERT INTO public.system_config (key, value) 
VALUES ('environment_mode', 'dev')
ON CONFLICT (key) DO UPDATE SET value = 'dev', updated_at = NOW();

-- Función helper para obtener el modo
CREATE OR REPLACE FUNCTION get_environment_mode()
RETURNS TEXT AS $$
  SELECT value FROM public.system_config WHERE key = 'environment_mode';
$$ LANGUAGE sql STABLE;

-- ================================================================================
-- PASO 2: HABILITAR RLS EN TODAS LAS TABLAS CRÍTICAS
-- ================================================================================
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- ================================================================================
-- PASO 3: POLÍTICAS PARA TABLA 'ADS' (AVISOS)
-- ================================================================================

-- 🟢 DEV: Ver todos los avisos
-- 🔴 PROD: Solo ver avisos publicados + propios
DROP POLICY IF EXISTS "ads_select_policy" ON public.ads;
CREATE POLICY "ads_select_policy" ON public.ads
  FOR SELECT
  USING (
    CASE 
      WHEN get_environment_mode() = 'dev' THEN TRUE
      WHEN get_environment_mode() = 'prod' THEN (
        status = 'published' 
        OR user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        )
      )
      ELSE TRUE
    END
  );

-- 🟢 DEV: Insertar cualquier cosa
-- 🔴 PROD: Solo tu user_id
DROP POLICY IF EXISTS "ads_insert_policy" ON public.ads;
CREATE POLICY "ads_insert_policy" ON public.ads
  FOR INSERT
  WITH CHECK (
    CASE 
      WHEN get_environment_mode() = 'dev' THEN TRUE
      WHEN get_environment_mode() = 'prod' THEN user_id = auth.uid()
      ELSE TRUE
    END
  );

-- 🟢 DEV: Actualizar cualquier cosa
-- 🔴 PROD: Solo tus avisos
DROP POLICY IF EXISTS "ads_update_policy" ON public.ads;
CREATE POLICY "ads_update_policy" ON public.ads
  FOR UPDATE
  USING (
    CASE 
      WHEN get_environment_mode() = 'dev' THEN TRUE
      WHEN get_environment_mode() = 'prod' THEN (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        )
      )
      ELSE TRUE
    END
  );

-- 🟢 DEV: Eliminar cualquier cosa
-- 🔴 PROD: Solo tus avisos
DROP POLICY IF EXISTS "ads_delete_policy" ON public.ads;
CREATE POLICY "ads_delete_policy" ON public.ads
  FOR DELETE
  USING (
    CASE 
      WHEN get_environment_mode() = 'dev' THEN TRUE
      WHEN get_environment_mode() = 'prod' THEN (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        )
      )
      ELSE TRUE
    END
  );

-- ================================================================================
-- PASO 4: POLÍTICAS PARA TABLA 'USERS'
-- ================================================================================

-- 🟢 DEV: Ver todos los usuarios
-- 🔴 PROD: Solo tu perfil + admins ven todo
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  USING (
    CASE 
      WHEN get_environment_mode() = 'dev' THEN TRUE
      WHEN get_environment_mode() = 'prod' THEN (
        id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        )
      )
      ELSE TRUE
    END
  );

-- 🟢 DEV: Actualizar cualquier usuario
-- 🔴 PROD: Solo tu perfil
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE
  USING (
    CASE 
      WHEN get_environment_mode() = 'dev' THEN TRUE
      WHEN get_environment_mode() = 'prod' THEN (
        id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        )
      )
      ELSE TRUE
    END
  );

-- ================================================================================
-- PASO 5: POLÍTICAS PARA CATÁLOGO (lectura pública)
-- ================================================================================

-- Categories, subcategories, brands, models = READ-ONLY para todos
-- Solo admins pueden modificar

DROP POLICY IF EXISTS "catalog_read_all" ON public.categories;
CREATE POLICY "catalog_read_all" ON public.categories
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "catalog_read_all" ON public.subcategories;
CREATE POLICY "catalog_read_all" ON public.subcategories
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "catalog_read_all" ON public.brands;
CREATE POLICY "catalog_read_all" ON public.brands
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "catalog_read_all" ON public.models;
CREATE POLICY "catalog_read_all" ON public.models
  FOR SELECT USING (TRUE);

-- Solo admins pueden modificar catálogo
DROP POLICY IF EXISTS "catalog_admin_only" ON public.categories;
CREATE POLICY "catalog_admin_only" ON public.categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "catalog_admin_only" ON public.subcategories;
CREATE POLICY "catalog_admin_only" ON public.subcategories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "catalog_admin_only" ON public.brands;
CREATE POLICY "catalog_admin_only" ON public.brands
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "catalog_admin_only" ON public.models;
CREATE POLICY "catalog_admin_only" ON public.models
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- ================================================================================
-- PASO 6: POLÍTICAS PARA BANNERS (solo admins)
-- ================================================================================

DROP POLICY IF EXISTS "banners_read_all" ON public.banners;
CREATE POLICY "banners_read_all" ON public.banners
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "banners_admin_only" ON public.banners;
CREATE POLICY "banners_admin_only" ON public.banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- ================================================================================
-- PASO 7: VERIFICACIÓN
-- ================================================================================

-- Consultar modo actual
SELECT * FROM public.system_config WHERE key = 'environment_mode';

-- Ver estado de RLS
SELECT 
  schemaname,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('ads', 'users', 'categories', 'subcategories', 'brands', 'models', 'banners')
ORDER BY tablename;

-- ================================================================================
-- CÓMO CAMBIAR DE MODO
-- ================================================================================

-- DESARROLLO (sin restricciones):
-- UPDATE public.system_config SET value = 'dev', updated_at = NOW() WHERE key = 'environment_mode';

-- PRODUCCIÓN (restricciones completas):
-- UPDATE public.system_config SET value = 'prod', updated_at = NOW() WHERE key = 'environment_mode';

-- ================================================================================
-- NOTAS IMPORTANTES
-- ================================================================================
-- 
-- 1. En DESARROLLO LOCAL:
--    - Mantener mode = 'dev'
--    - RLS habilitado pero sin restricciones
--    - Puedes testear todo sin bloqueos
--
-- 2. En PRODUCCIÓN:
--    - Cambiar a mode = 'prod' ANTES del deploy
--    - RLS con seguridad completa
--    - Users solo ven sus datos
--
-- 3. Sistema_config es una tabla sencilla:
--    - No afecta performance
--    - Se consulta una vez por policy
--    - Fácil de auditar
--
-- ================================================================================
