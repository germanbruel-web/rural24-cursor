-- PASO 1: Crear usuario superadmin en auth.users (si no existe)
-- Ejecuta esto en el SQL Editor de Supabase

-- Verifica si el usuario existe
SELECT email, id FROM auth.users WHERE email = 'admin@agrobuscador.com';

-- Si NO existe, créalo:
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@agrobuscador.com',
  crypt('Admin123!', gen_salt('bf')), -- Password: Admin123!
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Super Admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- PASO 2: Asegúrate de que existe en la tabla users con rol superadmin
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
  au.id,
  au.email,
  'Super Admin',
  'superadmin',
  NOW()
FROM auth.users au
WHERE au.email = 'admin@agrobuscador.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'superadmin',
  email = EXCLUDED.email;

-- PASO 3: Verifica que todo esté correcto
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.created_at
FROM public.users u
WHERE u.email = 'admin@agrobuscador.com';

-- CREDENCIALES:
-- Email: admin@agrobuscador.com
-- Password: Admin123!
