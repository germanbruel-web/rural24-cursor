-- ============================================
-- FIX: Avisos huérfanos sin usuario
-- ============================================
-- PROBLEMA: Hay avisos con user_id que no existe en tabla users
-- SOLUCIÓN: Crear usuario o reasignar avisos

-- 1️⃣ VER AVISOS HUÉRFANOS
SELECT 
  a.id, 
  a.title, 
  a.user_id,
  u.email as user_exists
FROM ads a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL
LIMIT 10;

-- 2️⃣ OPCIÓN A: Crear el usuario faltante (si es usuario válido)
-- NOTA: Reemplazar con datos reales del usuario
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'fadd0359-ae43-4cad-9612-cbd639583196',
  'usuario@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO public.users (id, email, role, full_name)
VALUES (
  'fadd0359-ae43-4cad-9612-cbd639583196',
  'usuario@example.com',
  'superadmin',
  'Usuario Admin'
);
*/

-- 2️⃣ OPCIÓN B: Reasignar avisos a tu usuario actual (SuperAdmin)
-- NOTA: Reemplazar 'TU_USER_ID' con tu UUID real
/*
UPDATE ads
SET user_id = 'TU_USER_ID'
WHERE user_id = 'fadd0359-ae43-4cad-9612-cbd639583196';
*/

-- 3️⃣ VERIFICAR USUARIOS EXISTENTES
SELECT id, email, role, full_name, created_at
FROM users
WHERE role = 'superadmin'
ORDER BY created_at DESC;
