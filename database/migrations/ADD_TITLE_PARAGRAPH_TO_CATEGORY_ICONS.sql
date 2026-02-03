-- =====================================================
-- Agregar columnas title y paragraph a category_icons
-- =====================================================
-- Fecha: 3 de Febrero 2026
-- Descripción: Agrega campos de texto opcionales para
-- título y párrafo descriptivo en cada icono de categoría
-- =====================================================

-- Agregar columna title
ALTER TABLE category_icons
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT NULL;

-- Agregar columna paragraph  
ALTER TABLE category_icons
ADD COLUMN IF NOT EXISTS paragraph TEXT DEFAULT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN category_icons.title IS 'Título opcional para la categoría';
COMMENT ON COLUMN category_icons.paragraph IS 'Párrafo descriptivo opcional para la categoría';

-- Verificar cambios
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'category_icons'
ORDER BY ordinal_position;
