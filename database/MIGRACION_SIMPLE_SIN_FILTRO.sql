-- =====================================================
-- MIGRACIÓN SIMPLE - TODAS LAS MARCAS SIN FILTRO
-- Usa cuando subcategory_brands está vacía
-- =====================================================

-- IMPORTANTE: Este script copia TODAS las marcas a TODAS las categorías
-- Solo usar si quieres empezar de cero y asignar marcas manualmente después

-- =====================================================
-- 1. MAQUINARIAS - COPIAR TODAS LAS MARCAS
-- =====================================================

-- Copiar TODAS las marcas existentes a maquinarias
-- Luego puedes eliminar las que no corresponden manualmente
INSERT INTO maquinarias_marcas (id, name, display_name, is_active, created_at)
SELECT 
  id,
  name,
  display_name,
  is_active,
  created_at
FROM brands
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- 2. GANADERÍA - COPIAR TODAS LAS RAZAS
-- =====================================================

-- Para ganadería, necesitamos asignar a una subcategoría
-- Opción: Asignar todas a "Vacas" por defecto

-- Primero, obtener ID de subcategoría "vacas"
DO $$
DECLARE
  vacas_id UUID;
BEGIN
  SELECT id INTO vacas_id FROM ganaderia_subcategorias WHERE name = 'vacas' LIMIT 1;
  
  IF vacas_id IS NOT NULL THEN
    INSERT INTO ganaderia_razas (id, subcategoria_id, name, display_name, sort_order, is_active, created_at)
    SELECT 
      id,
      vacas_id, -- Asignar todas a vacas por defecto
      name,
      display_name,
      0, -- sort_order por defecto
      is_active,
      created_at
    FROM brands
    WHERE name IN ('Angus', 'Hereford', 'Holando', 'Aberdeen Angus', 'Brangus', 'Braford', 'Charolais', 'Limousin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;


-- =====================================================
-- 3. INSUMOS - COPIAR TODAS LAS MARCAS
-- =====================================================

INSERT INTO insumos_marcas (id, name, display_name, is_active, created_at)
SELECT 
  id,
  name,
  display_name,
  is_active,
  created_at
FROM brands
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 
  'Maquinarias - Marcas' AS tabla,
  COUNT(*) AS registros
FROM maquinarias_marcas

UNION ALL

SELECT 
  'Ganadería - Razas' AS tabla,
  COUNT(*) AS registros
FROM ganaderia_razas

UNION ALL

SELECT 
  'Insumos - Marcas' AS tabla,
  COUNT(*) AS registros
FROM insumos_marcas;


-- =====================================================
-- NOTAS
-- =====================================================

/*
Este script copia TODAS las marcas de la tabla brands original
a las nuevas tablas independientes.

DESPUÉS de ejecutar esto, puedes:

1. Ir al panel de admin de cada categoría
2. Eliminar las marcas que no corresponden
3. Agregar nuevas marcas específicas

Por ejemplo:
- En maquinarias_marcas, eliminar "Angus", "Hereford" (son razas)
- En ganaderia_razas, solo dejar razas reales
- En insumos_marcas, solo dejar marcas de insumos

Este enfoque es más simple que arreglar subcategory_brands.
*/
