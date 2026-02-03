-- ============================================================================
-- ELIMINAR TABLA ad_content_templates (SI EXISTE)
-- ============================================================================
-- Esta tabla ya no se usa. El sistema de autocompletado ahora es 100% local
-- usando patterns configurables en localStorage.
-- 
-- Fecha: 3 Febrero 2026
-- ============================================================================

-- Verificar primero si la tabla existe
DO $$
BEGIN
  -- Solo intentar eliminar si la tabla existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ad_content_templates') THEN
    -- 1. Eliminar políticas RLS
    DROP POLICY IF EXISTS "templates_public_read" ON ad_content_templates;
    DROP POLICY IF EXISTS "templates_superadmin_all" ON ad_content_templates;
    
    -- 2. Eliminar tabla (los índices se eliminan automáticamente)
    DROP TABLE ad_content_templates;
    
    RAISE NOTICE '✅ Tabla ad_content_templates eliminada correctamente';
  ELSE
    RAISE NOTICE '⚠️ La tabla ad_content_templates no existe (ya fue eliminada o nunca se creó)';
  END IF;
END $$;

