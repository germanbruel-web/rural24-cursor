-- Agregar campo province a la tabla users
-- Ejecutar en Supabase SQL Editor

-- Agregar columna province si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS province TEXT;

-- Crear índice para mejorar rendimiento en búsquedas por provincia
CREATE INDEX IF NOT EXISTS idx_users_province ON users(province);

-- Verificar estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('province', 'location', 'phone', 'mobile');
