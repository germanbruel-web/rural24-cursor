-- Verifica tu usuario actual y su rol
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- Si necesitas cambiar tu usuario a superadmin, ejecuta esto:
-- UPDATE profiles SET role = 'superadmin' WHERE email = 'tu-email@ejemplo.com';
