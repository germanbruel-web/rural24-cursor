-- =====================================================
-- FIX RLS: SUBCATEGORIES TABLE
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public read subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "SuperAdmins manage subcategories" ON public.subcategories;

-- SELECT: Todos pueden leer subcategorías (necesario para detail page)
CREATE POLICY "Public read subcategories" ON public.subcategories
  FOR SELECT
  USING (true);

-- ALL: SuperAdmins pueden hacer todo
CREATE POLICY "SuperAdmins manage subcategories" ON public.subcategories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role = 'super-admin'
    )
  );

-- Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'subcategories';
