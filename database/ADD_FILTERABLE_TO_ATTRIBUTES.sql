-- ============================================================
-- MIGRACIÓN: Agregar campos para filtros dinámicos
-- Fecha: 2026-01-12
-- Propósito: Permitir configurar qué atributos aparecen como filtros en página de resultados
-- ============================================================

-- 1. Agregar columna is_filterable (¿mostrar en filtros de búsqueda?)
ALTER TABLE dynamic_attributes 
ADD COLUMN IF NOT EXISTS is_filterable BOOLEAN DEFAULT false;

-- 2. Agregar columna filter_type (tipo de control en filtros)
-- Valores: 'select' (dropdown), 'range' (min-max), 'checkbox' (múltiple), 'chips' (tags)
ALTER TABLE dynamic_attributes 
ADD COLUMN IF NOT EXISTS filter_type VARCHAR(20) DEFAULT 'select';

-- 3. Agregar columna filter_order (orden en panel de filtros)
ALTER TABLE dynamic_attributes 
ADD COLUMN IF NOT EXISTS filter_order INTEGER DEFAULT 99;

-- 4. Comentarios para documentación
COMMENT ON COLUMN dynamic_attributes.is_filterable IS 'Si true, este atributo aparece como filtro en página de resultados';
COMMENT ON COLUMN dynamic_attributes.filter_type IS 'Tipo de control: select, range, checkbox, chips';
COMMENT ON COLUMN dynamic_attributes.filter_order IS 'Orden de aparición en panel de filtros (menor = primero)';

-- 5. Índice para queries de filtros
CREATE INDEX IF NOT EXISTS idx_dynamic_attributes_filterable 
ON dynamic_attributes(category_id, subcategory_id, is_filterable) 
WHERE is_filterable = true;

-- 6. Marcar algunos atributos comunes como filtrables por defecto
UPDATE dynamic_attributes 
SET is_filterable = true, filter_type = 'select', filter_order = 1
WHERE field_name IN ('marca', 'brand');

UPDATE dynamic_attributes 
SET is_filterable = true, filter_type = 'range', filter_order = 2
WHERE field_name IN ('año', 'year', 'anio');

UPDATE dynamic_attributes 
SET is_filterable = true, filter_type = 'select', filter_order = 3
WHERE field_name IN ('condicion', 'condition', 'estado');

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT field_name, field_label, is_filterable, filter_type, filter_order 
-- FROM dynamic_attributes 
-- WHERE is_filterable = true 
-- ORDER BY filter_order;
