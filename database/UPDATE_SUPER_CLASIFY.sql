-- ============================================
-- CONVERTIR super@clasify.com A SUPERADMIN
-- ============================================

-- 1. Ver el usuario en auth.users
SELECT id, email, created_at, '🔍 Usuario en auth.users' as info
FROM auth.users
WHERE email = 'super@clasify.com';

-- 2. Ver el usuario en tabla users (custom)
SELECT id, email, full_name, role, created_at, '❌ Rol actual en users' as info
FROM users
WHERE email = 'super@clasify.com';

-- 3. ACTUALIZAR/INSERTAR en tabla users como SUPERADMIN
INSERT INTO users (id, email, role, full_name)
SELECT 
  id, 
  email, 
  'superadmin',
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE email = 'super@clasify.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'superadmin',
  updated_at = NOW();

-- 4. Verificar el cambio
SELECT 
  u.id,
  u.email,
  users.full_name,
  users.role,
  users.created_at,
  '✅ Ahora es SUPERADMIN' as status
FROM auth.users u
LEFT JOIN users ON users.id = u.id
WHERE u.email = 'super@clasify.com';

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ir a Supabase: https://app.supabase.com
-- 2. Seleccionar tu proyecto
-- 3. Ir a "SQL Editor"
-- 4. Pegar y ejecutar este script COMPLETO
-- 5. Cerrar sesión en tu app (importante!)
-- 6. Volver a iniciar sesión con super@clasify.com
-- 7. Ir a Dashboard → Verás "⚙️ Categorías"
-- ============================================
