-- =====================================================
-- CREAR SUPERADMIN PARA RURAL24
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- PASO 1: Crear usuario en Supabase Auth (si no existe)
-- IMPORTANTE: Esto debes hacerlo desde el Dashboard de Supabase
-- Authentication → Users → Add User
-- Email: admin@rural24.com
-- Password: [tu_password_seguro]
-- Auto-confirm: YES

-- PASO 2: Verificar si existe la tabla users
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
);

-- PASO 3: Si la tabla existe, actualizar el rol
-- Reemplaza 'admin@rural24.com' con tu email real
UPDATE public.users 
SET role = 'superadmin'
WHERE email = 'super@clasify.com';

-- PASO 4: Verificar que se actualizó correctamente
SELECT id, email, role, full_name, created_at
FROM public.users
WHERE email = 'super@clasify.com';

-- PASO 5 (ALTERNATIVO): Si la tabla users no existe, crearla
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin', 'super-admin')),
  phone VARCHAR(50),
  avatar_url TEXT,
  business_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 6: Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- PASO 7: Políticas de seguridad
-- Usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Superadmins pueden hacer todo
DROP POLICY IF EXISTS "Superadmins manage all users" ON public.users;
CREATE POLICY "Superadmins manage all users" ON public.users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('superadmin', 'super-admin')
    )
  );

-- PASO 8: Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INSTRUCCIONES FINALES
-- =====================================================

/*
1. Ve a Supabase Dashboard → Authentication → Users
2. Click "Add User" o "Invite User"
3. Email: admin@rural24.com (o tu email preferido)
4. Password: [crea un password seguro]
5. Auto Confirm User: YES (marcar esta opción)
6. Click "Create User"

7. Luego ejecuta este SQL:
   UPDATE public.users 
   SET role = 'superadmin'
   WHERE email = 'admin@rural24.com';

8. Verifica que funcionó:
   SELECT * FROM public.users WHERE role = 'superadmin';

9. Ya puedes usar esas credenciales en:
   http://localhost:3000/admin/login
*/
