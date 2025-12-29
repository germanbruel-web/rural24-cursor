-- ============================================
-- SOLUCIÓN TEMPORAL: Desactivar RLS completamente
-- Usar SOLO en desarrollo mientras diagnosticamos
-- ============================================

-- ⚠️ ADVERTENCIA: Esto desactiva la seguridad temporalmente
-- Solo usar en ambiente de desarrollo

ALTER TABLE ads DISABLE ROW LEVEL SECURITY;

-- Verificar que se desactivó
SELECT 
  tablename,
  rowsecurity as "RLS Activo"
FROM pg_tables
WHERE tablename = 'ads';

-- ============================================
-- IMPORTANTE: 
-- ============================================
-- Con esto, el error 400 debería desaparecer inmediatamente.
-- Una vez que funcione, ejecutá DIAGNOSE_RLS_ISSUE.sql para
-- entender por qué las políticas no funcionan correctamente.
--
-- Para reactivar RLS después:
-- ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
