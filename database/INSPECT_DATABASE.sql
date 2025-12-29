-- ============================================
-- INSPECCIÓN DE BASE DE DATOS - SISTEMA PREMIUM
-- ============================================
-- Ejecutar estas queries ANTES de la migración

-- 1. Ver estructura completa de tabla ads
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ads'
ORDER BY ordinal_position;

-- ============================================

-- 2. Buscar campos relacionados con "premium" o "featured"
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'ads'
AND (
    column_name LIKE '%premium%' 
    OR column_name LIKE '%featured%'
    OR column_name LIKE '%highlight%'
    OR column_name LIKE '%sponsor%'
);

-- ============================================

-- 3. Ver si hay avisos marcados como premium (cualquier campo booleano sospechoso)
SELECT 
    column_name,
    COUNT(*) as total_true
FROM information_schema.columns
CROSS JOIN ads
WHERE table_name = 'ads'
AND data_type = 'boolean'
GROUP BY column_name;

-- ============================================

-- 4. Inspeccionar estructura de categorías
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- ============================================

-- 5. Ver sample de avisos actuales (primeros 5)
SELECT 
    id,
    title,
    category_id,
    status,
    created_at
FROM ads
ORDER BY created_at DESC
LIMIT 5;

-- ============================================

-- 6. Verificar si existe tabla profiles y campo role
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('role', 'id', 'user_id');

-- ============================================

-- 7. Ver políticas RLS existentes en ads
SELECT 
    policyname,
    tablename,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'ads';

-- ============================================

-- 8. Verificar índices existentes en ads
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ads';

-- ============================================
-- ANÁLISIS DE RESULTADOS:
-- 
-- ✓ Verificar si ya existe: is_premium, featured_on_homepage, etc.
-- ✓ Ver cómo se maneja actualmente el sistema premium
-- ✓ Confirmar relación con categories (category_id existe?)
-- ✓ Verificar estructura de profiles.role
-- ============================================
