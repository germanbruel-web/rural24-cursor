-- EJECUTAR ESTE SQL EN SUPABASE SQL EDITOR
-- Para actualizar el nombre del superadmin a "Superman"

-- 1. Ver estado actual
SELECT 
    id, 
    email, 
    full_name, 
    role,
    created_at
FROM users 
WHERE email = 'super@clasify.com';

-- 2. Actualizar el nombre
UPDATE users 
SET 
    full_name = 'Superman',
    updated_at = NOW()
WHERE email = 'super@clasify.com';

-- 3. Verificar que se actualizó correctamente
SELECT 
    id, 
    email, 
    full_name, 
    role,
    updated_at
FROM users 
WHERE email = 'super@clasify.com';
