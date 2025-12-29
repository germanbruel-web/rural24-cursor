-- =====================================================
-- MIGRATION 009: Actualización de tabla ads para sistema de categorías
-- =====================================================
-- Actualiza la tabla ads para usar el nuevo sistema de categorías
-- y preparar para campos dinámicos

-- 1. Agregar nuevas columnas con referencias a categorías
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS operation_type_id UUID REFERENCES operation_types(id),
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id),
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id),
ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES models(id);

-- 2. Agregar índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_ads_operation_type ON public.ads(operation_type_id);
CREATE INDEX IF NOT EXISTS idx_ads_category ON public.ads(category_id);
CREATE INDEX IF NOT EXISTS idx_ads_subcategory ON public.ads(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ads_brand ON public.ads(brand_id);
CREATE INDEX IF NOT EXISTS idx_ads_model ON public.ads(model_id);

-- 3. Renombrar campos para consistencia (mantener compatibilidad)
ALTER TABLE public.ads 
RENAME COLUMN contact_phone TO phone;

-- Si contact_email no se usa, podemos dejar solo el user_id
-- ALTER TABLE public.ads DROP COLUMN IF EXISTS contact_email;

-- 4. Agregar columna para teléfono adicional (WhatsApp)
-- Ya existe 'phone' renombrado arriba

-- 5. Cambiar tipo de images de array a usar tabla ad_images
-- Las imágenes ahora están en tabla separada (ver 008_AD_IMAGES_TABLE.sql)
-- Mantener columna images por compatibilidad pero marcada como deprecated
COMMENT ON COLUMN public.ads.images IS 'DEPRECATED: Usar tabla ad_images en su lugar';

-- 6. Actualizar columnas de categoría legacy
-- category y subcategory ahora son referencias a tablas, no VARCHAR
-- Mantener por compatibilidad pero agregar comentario
COMMENT ON COLUMN public.ads.category IS 'DEPRECATED: Usar category_id en su lugar';
COMMENT ON COLUMN public.ads.subcategory IS 'DEPRECATED: Usar subcategory_id en su lugar';

-- 7. Actualizar check constraint de status para incluir nuevos estados
ALTER TABLE public.ads 
DROP CONSTRAINT IF EXISTS ads_status_check;

ALTER TABLE public.ads 
ADD CONSTRAINT ads_status_check 
CHECK (status IN ('pending', 'active', 'paused', 'expired', 'deleted', 'rejected'));

-- 8. Agregar comentarios de documentación
COMMENT ON COLUMN public.ads.operation_type_id IS 'Tipo de operación: Vendo, Compro, Alquilo, etc.';
COMMENT ON COLUMN public.ads.category_id IS 'Categoría principal: Maquinarias, Ganadería, Insumos, etc.';
COMMENT ON COLUMN public.ads.subcategory_id IS 'Subcategoría específica: Tractores, Bovinos, Semillas, etc.';
COMMENT ON COLUMN public.ads.brand_id IS 'Marca del producto (opcional, si aplica)';
COMMENT ON COLUMN public.ads.model_id IS 'Modelo específico (opcional, si aplica)';
COMMENT ON COLUMN public.ads.status IS 'Estado: pending (en revisión), active (publicado), paused (pausado), expired (vencido), deleted (eliminado), rejected (rechazado)';

-- 9. Actualizar RLS policies para nuevo flujo de aprobación
-- Los avisos inician en 'pending' y deben ser aprobados

-- Política actualizada: Todos ven avisos activos y no expirados
DROP POLICY IF EXISTS ads_select_active ON public.ads;
CREATE POLICY ads_select_active ON public.ads
  FOR SELECT
  USING (
    status = 'active' 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- SuperAdmin puede ver todos los avisos (incluyendo pending)
DROP POLICY IF EXISTS ads_superadmin_all ON public.ads;
CREATE POLICY ads_superadmin_all ON public.ads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Usuarios pueden ver sus propios avisos en cualquier estado
DROP POLICY IF EXISTS ads_select_own ON public.ads;
CREATE POLICY ads_select_own ON public.ads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Actualizar política de inserción: ahora cualquier usuario autenticado puede crear avisos
-- (quedarán en 'pending' hasta aprobación)
DROP POLICY IF EXISTS ads_insert_premium ON public.ads;
CREATE POLICY ads_insert_authenticated ON public.ads
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND auth.uid() IS NOT NULL
  );

-- 10. Función helper para obtener nombre completo de categoría
CREATE OR REPLACE FUNCTION get_full_category_name(ad_id UUID)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT 
    ot.display_name || ' > ' || c.display_name || ' > ' || sc.display_name
  INTO result
  FROM ads a
  LEFT JOIN operation_types ot ON a.operation_type_id = ot.id
  LEFT JOIN categories c ON a.category_id = c.id
  LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
  WHERE a.id = ad_id;
  
  RETURN COALESCE(result, 'Sin categoría');
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. Vista para facilitar consultas de avisos con toda su información
CREATE OR REPLACE VIEW ads_full_view AS
SELECT 
  a.*,
  ot.name as operation_type_name,
  ot.display_name as operation_type_display,
  c.name as category_name,
  c.display_name as category_display,
  sc.name as subcategory_name,
  sc.display_name as subcategory_display,
  b.display_name as brand_name,
  m.display_name as model_name,
  u.email as user_email,
  u.full_name as user_name,
  COALESCE(
    ARRAY(
      SELECT url FROM ad_images WHERE ad_id = a.id ORDER BY sort_order
    ),
    a.images
  ) as all_images
FROM ads a
LEFT JOIN operation_types ot ON a.operation_type_id = ot.id
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
LEFT JOIN brands b ON a.brand_id = b.id
LEFT JOIN models m ON a.model_id = m.id
LEFT JOIN users u ON a.user_id = u.id;

-- Grant permissions en la vista
GRANT SELECT ON ads_full_view TO authenticated;

-- 12. Ejemplo de migración de datos legacy (comentado, ejecutar manualmente si aplica)
/*
-- Migrar categorías legacy a nuevas referencias
UPDATE ads a
SET 
  category_id = c.id,
  subcategory_id = sc.id
FROM categories c
LEFT JOIN subcategories sc ON sc.category_id = c.id
WHERE 
  LOWER(a.category) = LOWER(c.name)
  AND (a.subcategory IS NULL OR LOWER(a.subcategory) = LOWER(sc.name));
*/

COMMIT;
