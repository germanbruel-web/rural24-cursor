-- =====================================================
-- CAMBIAR ROLE A 'superadmin' (sin guión)
-- =====================================================

-- El código usa 'superadmin' (sin guión) en todos lados
-- Es más fácil cambiar la BD que actualizar 17+ archivos

UPDATE public.users
SET role = 'superadmin'
WHERE email = 'super@clasify.com';

-- Verificar
SELECT 
  id,
  email,
  full_name,
  role
FROM public.users
WHERE email = 'super@clasify.com';
