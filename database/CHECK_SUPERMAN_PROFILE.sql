-- Verificar perfil de super@clasify.com
SELECT 
    id, 
    email, 
    full_name, 
    role,
    created_at,
    updated_at
FROM users 
WHERE email = 'super@clasify.com';

-- Si full_name está vacío, actualizarlo
UPDATE users 
SET full_name = 'Superman',
    updated_at = NOW()
WHERE email = 'super@clasify.com' 
  AND (full_name IS NULL OR full_name = '');

-- Verificar el resultado
SELECT 
    id, 
    email, 
    full_name, 
    role
FROM users 
WHERE email = 'super@clasify.com';
