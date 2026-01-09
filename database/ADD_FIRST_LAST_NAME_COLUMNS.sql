-- ============================================
-- AGREGAR COLUMNAS FIRST_NAME Y LAST_NAME
-- Mantener full_name por compatibilidad
-- ============================================

-- Paso 1: Agregar nuevas columnas
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Paso 2: Migrar datos existentes (separar full_name en first_name y last_name)
-- Esto asume que full_name tiene formato "Nombre Apellido"
UPDATE public.users
SET 
  first_name = CASE 
    WHEN position(' ' in full_name) > 0 THEN 
      TRIM(substring(full_name from 1 for position(' ' in full_name)))
    ELSE 
      TRIM(full_name)
  END,
  last_name = CASE 
    WHEN position(' ' in full_name) > 0 THEN 
      TRIM(substring(full_name from position(' ' in full_name) + 1))
    ELSE 
      ''
  END
WHERE first_name IS NULL AND last_name IS NULL;

-- Paso 3: Crear función para auto-actualizar full_name cuando cambie first_name o last_name
CREATE OR REPLACE FUNCTION update_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Concatenar first_name y last_name para crear full_name
  NEW.full_name := TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 4: Crear trigger para actualizar automáticamente
DROP TRIGGER IF EXISTS trigger_update_full_name ON public.users;
CREATE TRIGGER trigger_update_full_name
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_full_name();

-- Paso 5: Añadir índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_users_first_name ON public.users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON public.users(last_name);

-- Paso 6: Verificar resultados
SELECT 
  id,
  first_name,
  last_name,
  full_name,
  email
FROM public.users
LIMIT 10;
