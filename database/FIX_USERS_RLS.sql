-- ================================================================================
-- FIX USERS RLS - Rural24
-- ================================================================================
-- Fecha: 21 de Enero 2026
-- 
-- PROBLEMA DETECTADO:
-- Las políticas de la tabla 'users' buscan el rol en auth.jwt() -> app_metadata
-- pero el rol está guardado en la columna users.role
--
-- SOLUCIÓN:
-- 1. Crear función helper con SECURITY DEFINER para evitar recursión
-- 2. Reemplazar políticas de users para usar la tabla users.role
-- ================================================================================

-- ================================================================================
-- PASO 1: CREAR FUNCIÓN HELPER (evita recursión infinita)
-- ================================================================================

-- Esta función puede leer la tabla users sin activar RLS porque tiene SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para verificar si es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_my_role() = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para verificar si es admin o superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_my_role() IN ('superadmin', 'admin', 'adminscrap');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================================================================
-- PASO 2: ELIMINAR POLÍTICAS PROBLEMÁTICAS DE USERS
-- ================================================================================

DROP POLICY IF EXISTS "users_all_superadmin" ON public.users;
DROP POLICY IF EXISTS "users_view_all_superadmin" ON public.users;
DROP POLICY IF EXISTS "users_view_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- ================================================================================
-- PASO 3: CREAR NUEVAS POLÍTICAS PARA USERS
-- ================================================================================

-- SELECT: Usuario ve su perfil, Superadmin ve todo
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  USING (
    auth.uid() = id  -- Siempre puede ver su propio perfil
    OR public.is_superadmin()  -- Superadmin ve todo
  );

-- UPDATE: Usuario edita su perfil, Superadmin edita todo
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_superadmin()
  );

-- INSERT: Para registro de nuevos usuarios
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT
  WITH CHECK (true);  -- Auth trigger maneja esto

-- DELETE: Solo superadmin
CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE
  USING (public.is_superadmin());

-- ================================================================================
-- PASO 4: VERIFICACIÓN
-- ================================================================================

-- Verificar que las nuevas políticas están activas
SELECT 
  tablename,
  policyname,
  cmd,
  SUBSTRING(qual::text, 1, 80) as condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- ================================================================================
-- PASO 5: TEST - Verificar que superadmin puede ver usuarios
-- ================================================================================

-- Ejecutar como superadmin logueado:
-- SELECT * FROM public.users LIMIT 5;

-- ================================================================================
-- LISTO! Ahora el superadmin puede ver todos los usuarios
-- ================================================================================
