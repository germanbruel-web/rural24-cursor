-- Agregar campos de teléfono y celular a la tabla users
-- Ejecutar en Supabase SQL Editor

-- Agregar columna phone (teléfono fijo)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Agregar columna mobile (celular)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN users.phone IS 'Teléfono fijo del usuario';
COMMENT ON COLUMN users.mobile IS 'Teléfono celular del usuario';

-- Nota: Al menos uno de los dos campos (phone o mobile) debe estar presente
-- La validación se hace en el frontend
