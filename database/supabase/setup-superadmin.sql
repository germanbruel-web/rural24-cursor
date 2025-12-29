-- Script para configurar usuario como SuperAdmin

-- PASO 1: Ver todos los usuarios registrados (ejecuta esto primero)
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- PASO 2: Ver la tabla users (si existe)
SELECT * FROM users;

-- PASO 3: Crear la tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 4: Insertar/Actualizar tu usuario como super-admin
-- REEMPLAZA 'tu-email@ejemplo.com' con tu email real
INSERT INTO users (id, email, role)
SELECT id, email, 'super-admin'
FROM auth.users
WHERE email = 'tu-email@ejemplo.com'  -- CAMBIA ESTO
ON CONFLICT (id) 
DO UPDATE SET role = 'super-admin', updated_at = NOW();

-- PASO 5: Verificar que quedó como super-admin
SELECT u.id, u.email, users.role
FROM auth.users u
LEFT JOIN users ON users.id = u.id
WHERE u.email = 'tu-email@ejemplo.com';  -- CAMBIA ESTO

-- PASO 6: Si no sabes tu email, actualiza todos los usuarios como super-admin
-- (CUIDADO: esto hace super-admin a TODOS los usuarios)
-- INSERT INTO users (id, email, role)
-- SELECT id, email, 'super-admin'
-- FROM auth.users
-- ON CONFLICT (id) 
-- DO UPDATE SET role = 'super-admin', updated_at = NOW();
