-- =====================================================
-- FIX RLS POLICIES FOR CATALOG TABLES
-- =====================================================
-- Este archivo corrige las políticas RLS para las tablas
-- de catálogo (categories, subcategories, category_types, etc)

-- =====================================================
-- CATEGORIES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos pueden ver categorías (son públicas)
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Solo SuperAdmins
CREATE POLICY "SuperAdmins manage categories" ON public.categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );

-- =====================================================
-- SUBCATEGORIES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public can view subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Authenticated users can view subcategories" ON public.subcategories;

-- Habilitar RLS
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos pueden ver subcategorías (son públicas)
CREATE POLICY "Public read subcategories" ON public.subcategories
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Solo SuperAdmins
CREATE POLICY "SuperAdmins manage subcategories" ON public.subcategories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );

-- =====================================================
-- CATEGORY_TYPES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public can view category_types" ON public.category_types;

-- Habilitar RLS
ALTER TABLE public.category_types ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos pueden ver tipos (son públicos)
CREATE POLICY "Public read category_types" ON public.category_types
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Solo SuperAdmins
CREATE POLICY "SuperAdmins manage category_types" ON public.category_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );

-- =====================================================
-- DYNAMIC_ATTRIBUTES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public can view dynamic_attributes" ON public.dynamic_attributes;

-- Habilitar RLS si no está habilitado
ALTER TABLE public.dynamic_attributes ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos pueden ver atributos (son públicos para el formulario)
CREATE POLICY "Public read dynamic_attributes" ON public.dynamic_attributes
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Solo SuperAdmins
CREATE POLICY "SuperAdmins manage dynamic_attributes" ON public.dynamic_attributes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );

-- =====================================================
-- OPERATION_TYPES (si existe)
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operation_types') THEN
    -- Habilitar RLS
    ALTER TABLE public.operation_types ENABLE ROW LEVEL SECURITY;
    
    -- SELECT: Todos pueden ver
    EXECUTE 'CREATE POLICY "Public read operation_types" ON public.operation_types FOR SELECT USING (true)';
    
    -- Manage: Solo SuperAdmins
    EXECUTE 'CREATE POLICY "SuperAdmins manage operation_types" ON public.operation_types FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''super-admin''))';
  END IF;
END $$;

-- =====================================================
-- BRANDS (si existe)
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brands') THEN
    ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
    EXECUTE 'CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "SuperAdmins manage brands" ON public.brands FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''super-admin''))';
  END IF;
END $$;

-- =====================================================
-- MODELS (si existe)
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'models') THEN
    ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
    EXECUTE 'CREATE POLICY "Public read models" ON public.models FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "SuperAdmins manage models" ON public.models FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''super-admin''))';
  END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('categories', 'subcategories', 'category_types', 'dynamic_attributes', 'operation_types', 'brands', 'models')
ORDER BY tablename, policyname;
