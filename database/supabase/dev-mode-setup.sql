-- ============================================
-- MODO DESARROLLO - Configuración para testing sin login
-- ============================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- Para permitir operaciones CRUD de avisos sin autenticación durante desarrollo

-- SOLUCIÓN: Deshabilitar RLS temporalmente en ads para desarrollo
-- Esto evita el error de "infinite recursion detected in policy for relation users"

-- 1. Deshabilitar RLS en tabla ads (SOLO DESARROLLO)
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;

-- 2. Crear perfil de usuario en tabla users con rol SuperAdmin
-- Primero verificamos si existe la tabla users
DO $$ 
BEGIN
  -- Insertar usuario de desarrollo si no existe
  INSERT INTO public.users (
    id,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'dev@agrobuscador.local',
    'super-admin',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'super-admin',
    updated_at = NOW();
EXCEPTION 
  WHEN undefined_table THEN
    RAISE NOTICE 'Tabla users no existe. Crear primero el schema.';
END $$;

-- 3. NOTA IMPORTANTE: Para volver a PRODUCCIÓN, ejecutar:
-- ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Verificación
-- ============================================
SELECT 
  'Usuario de desarrollo creado' as status,
  id,
  email,
  role
FROM public.users 
WHERE id = '00000000-0000-0000-0000-000000000000';
