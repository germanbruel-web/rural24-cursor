-- =====================================================
-- CONFIGURACIÓN OPTIMIZADA PARA MOBILE-FIRST
-- =====================================================
-- Actualiza el bucket para limitar archivos a 1MB por imagen
-- Total: 8 imágenes x 1MB = 8MB máximo por aviso

-- 1. Actualizar límite del bucket a 1MB por archivo
UPDATE storage.buckets 
SET file_size_limit = 1048576  -- 1MB en bytes
WHERE name = 'ads-images';

-- 2. Verificar configuración
SELECT 
  name,
  public,
  file_size_limit,
  CASE 
    WHEN file_size_limit = 1048576 THEN '✅ 1MB - Optimizado Mobile-First'
    WHEN file_size_limit IS NULL THEN '⚠️ Sin límite'
    ELSE '⚠️ ' || (file_size_limit / 1024 / 1024)::text || 'MB'
  END as config_status
FROM storage.buckets 
WHERE name = 'ads-images';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- ✅ Con esta configuración:
-- - Cada imagen: máximo 1MB
-- - Por aviso (8 fotos): máximo 8MB
-- - Compresión automática en frontend
-- - Optimización móvil
--
-- 📱 Mobile-First:
-- - Carga rápida en conexiones 3G/4G
-- - Menor consumo de datos
-- - Mejor experiencia de usuario
--
-- 🔧 El frontend (imageOptimizer.ts) comprime automáticamente
--    todas las imágenes ANTES de subirlas
