-- ====================================================================
-- MIGRACIÓN: attribute_groups
-- Fecha: 2026-01-14
-- Descripción: Grupos dinámicos de atributos por subcategoría
-- ====================================================================

-- 1. Crear tabla de grupos
CREATE TABLE IF NOT EXISTS attribute_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,           -- slug interno (ej: "informacion_general")
  display_name VARCHAR(100) NOT NULL,   -- nombre visible (ej: "Información General")
  sort_order INT NOT NULL DEFAULT 0,    -- orden en formulario
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un grupo con el mismo nombre no puede repetirse en la misma subcategoría
  CONSTRAINT unique_group_per_subcategory UNIQUE (subcategory_id, name)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_attribute_groups_subcategory 
  ON attribute_groups(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_attribute_groups_sort 
  ON attribute_groups(subcategory_id, sort_order);

-- 3. Agregar columna group_id a dynamic_attributes (FK opcional inicialmente)
ALTER TABLE dynamic_attributes 
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES attribute_groups(id) ON DELETE SET NULL;

-- 4. Índice para el nuevo campo
CREATE INDEX IF NOT EXISTS idx_dynamic_attributes_group 
  ON dynamic_attributes(group_id);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_attribute_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_attribute_groups_updated_at ON attribute_groups;
CREATE TRIGGER trigger_attribute_groups_updated_at
  BEFORE UPDATE ON attribute_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_attribute_groups_updated_at();

-- ====================================================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- Crea grupos basados en los field_group actuales de dynamic_attributes
-- ====================================================================

-- 7. Insertar grupos únicos basados en datos existentes
INSERT INTO attribute_groups (subcategory_id, name, display_name, sort_order)
SELECT DISTINCT ON (da.subcategory_id, lower(translate(replace(da.field_group, ' ', '_'), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')))
  da.subcategory_id,
  -- Normalizar nombre: "Información General" -> "informacion_general"
  lower(
    translate(
      replace(da.field_group, ' ', '_'),
      'áéíóúÁÉÍÓÚñÑ',
      'aeiouAEIOUnN'
    )
  ) AS name,
  da.field_group AS display_name,
  -- Asignar orden basado en convención
  CASE 
    WHEN lower(da.field_group) LIKE '%general%' THEN 1
    WHEN lower(da.field_group) LIKE '%especificacion%' OR lower(da.field_group) LIKE '%tecnic%' THEN 2
    WHEN lower(da.field_group) LIKE '%caracteristic%' THEN 3
    WHEN lower(da.field_group) LIKE '%ubicacion%' THEN 4
    WHEN lower(da.field_group) LIKE '%observacion%' THEN 5
    ELSE 10
  END AS sort_order
FROM dynamic_attributes da
WHERE da.subcategory_id IS NOT NULL 
  AND da.field_group IS NOT NULL 
  AND da.field_group != ''
ORDER BY da.subcategory_id, lower(translate(replace(da.field_group, ' ', '_'), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')), sort_order
ON CONFLICT (subcategory_id, name) DO NOTHING;

-- 8. Actualizar dynamic_attributes con los group_id correspondientes
UPDATE dynamic_attributes da
SET group_id = ag.id
FROM attribute_groups ag
WHERE da.subcategory_id = ag.subcategory_id
  AND lower(
    translate(
      replace(da.field_group, ' ', '_'),
      'áéíóúÁÉÍÓÚñÑ',
      'aeiouAEIOUnN'
    )
  ) = ag.name;

-- 9. Comentarios para documentación
COMMENT ON TABLE attribute_groups IS 'Grupos de atributos dinámicos por subcategoría';
COMMENT ON COLUMN attribute_groups.name IS 'Identificador slug del grupo (ej: informacion_general)';
COMMENT ON COLUMN attribute_groups.display_name IS 'Nombre visible en UI (ej: Información General)';
COMMENT ON COLUMN attribute_groups.sort_order IS 'Orden de aparición en el formulario';
COMMENT ON COLUMN dynamic_attributes.group_id IS 'FK al grupo de atributos (reemplaza field_group string)';

-- ====================================================================
-- VERIFICACIÓN
-- ====================================================================
-- SELECT 
--   ag.display_name AS grupo,
--   ag.sort_order,
--   COUNT(da.id) AS atributos
-- FROM attribute_groups ag
-- LEFT JOIN dynamic_attributes da ON da.group_id = ag.id
-- GROUP BY ag.id, ag.display_name, ag.sort_order
-- ORDER BY ag.subcategory_id, ag.sort_order;
