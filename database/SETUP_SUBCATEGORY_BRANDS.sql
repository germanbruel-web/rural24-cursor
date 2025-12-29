-- =====================================================
-- TABLA SUBCATEGORY_BRANDS (Relación M2M)
-- Vincula subcategorías con marcas específicas
-- =====================================================

-- Verificar si la tabla existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subcategory_brands') THEN
    
    -- Crear tabla
    CREATE TABLE public.subcategory_brands (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
      brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      
      -- Constraint único para evitar duplicados
      UNIQUE(subcategory_id, brand_id)
    );
    
    RAISE NOTICE 'Tabla subcategory_brands creada exitosamente';
  ELSE
    RAISE NOTICE 'Tabla subcategory_brands ya existe';
  END IF;
END $$;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_subcategory_brands_subcategory 
  ON public.subcategory_brands(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_subcategory_brands_brand 
  ON public.subcategory_brands(brand_id);

CREATE INDEX IF NOT EXISTS idx_subcategory_brands_sort 
  ON public.subcategory_brands(sort_order);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.subcategory_brands ENABLE ROW LEVEL SECURITY;

-- Política de lectura: todos pueden leer
DROP POLICY IF EXISTS "Permitir lectura pública" ON public.subcategory_brands;
CREATE POLICY "Permitir lectura pública" 
  ON public.subcategory_brands 
  FOR SELECT 
  USING (true);

-- Política de inserción: usuarios autenticados (ajustar según necesites)
DROP POLICY IF EXISTS "Permitir inserción autenticados" ON public.subcategory_brands;
CREATE POLICY "Permitir inserción autenticados" 
  ON public.subcategory_brands 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política de actualización: usuarios autenticados (ajustar según necesites)
DROP POLICY IF EXISTS "Permitir actualización autenticados" ON public.subcategory_brands;
CREATE POLICY "Permitir actualización autenticados" 
  ON public.subcategory_brands 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Política de eliminación: usuarios autenticados (ajustar según necesites)
DROP POLICY IF EXISTS "Permitir eliminación autenticados" ON public.subcategory_brands;
CREATE POLICY "Permitir eliminación autenticados" 
  ON public.subcategory_brands 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- FUNCIÓN HELPER: Asignar marca a subcategoría
-- =====================================================

CREATE OR REPLACE FUNCTION assign_brand_to_subcategory(
  p_subcategory_id UUID,
  p_brand_id UUID,
  p_sort_order INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Verificar que la subcategoría existe
  IF NOT EXISTS (SELECT 1 FROM subcategories WHERE id = p_subcategory_id) THEN
    RAISE EXCEPTION 'Subcategoría no existe';
  END IF;
  
  -- Verificar que la marca existe
  IF NOT EXISTS (SELECT 1 FROM brands WHERE id = p_brand_id) THEN
    RAISE EXCEPTION 'Marca no existe';
  END IF;
  
  -- Insertar o actualizar
  INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
  VALUES (p_subcategory_id, p_brand_id, p_sort_order)
  ON CONFLICT (subcategory_id, brand_id) 
  DO UPDATE SET sort_order = p_sort_order
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- =====================================================
-- DATOS DE EJEMPLO (Opcional - ejecutar solo si necesitas datos de prueba)
-- =====================================================

-- Ejemplo: Asignar marcas a subcategoría "Tractores"
-- Descomenta las siguientes líneas si quieres agregar datos de ejemplo:

/*
DO $$ 
DECLARE
  v_tractores_id UUID;
  v_john_deere_id UUID;
  v_case_ih_id UUID;
  v_new_holland_id UUID;
BEGIN
  -- Obtener IDs (reemplaza con tus IDs reales o usa nombres)
  SELECT id INTO v_tractores_id FROM subcategories WHERE name = 'Tractores' LIMIT 1;
  SELECT id INTO v_john_deere_id FROM brands WHERE name = 'John Deere' LIMIT 1;
  SELECT id INTO v_case_ih_id FROM brands WHERE name = 'Case IH' LIMIT 1;
  SELECT id INTO v_new_holland_id FROM brands WHERE name = 'New Holland' LIMIT 1;
  
  IF v_tractores_id IS NOT NULL THEN
    IF v_john_deere_id IS NOT NULL THEN
      PERFORM assign_brand_to_subcategory(v_tractores_id, v_john_deere_id, 1);
    END IF;
    
    IF v_case_ih_id IS NOT NULL THEN
      PERFORM assign_brand_to_subcategory(v_tractores_id, v_case_ih_id, 2);
    END IF;
    
    IF v_new_holland_id IS NOT NULL THEN
      PERFORM assign_brand_to_subcategory(v_tractores_id, v_new_holland_id, 3);
    END IF;
    
    RAISE NOTICE 'Marcas asignadas a Tractores exitosamente';
  END IF;
END $$;
*/

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 
  'subcategory_brands' as tabla,
  COUNT(*) as registros,
  COUNT(DISTINCT subcategory_id) as subcategorias_con_marcas,
  COUNT(DISTINCT brand_id) as marcas_asignadas
FROM subcategory_brands;
