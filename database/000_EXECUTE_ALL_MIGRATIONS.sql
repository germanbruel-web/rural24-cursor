-- ================================================
-- SCRIPT COMPLETO - EJECUTAR EN ORDEN
-- ================================================
-- Este script debe ejecutarse en el SQL Editor de Supabase
-- Ejecuta las 3 migraciones en orden

-- 1. Crear tabla sources
\i 001_sources_table.sql

-- 2. Crear tabla jobs_log
\i 002_jobs_log_table.sql

-- 3. Crear tabla images
\i 003_images_table.sql

-- ================================================
-- VERIFICACIÓN
-- ================================================

-- Ver todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sources', 'jobs_log', 'images');

-- Ver fuentes de scraping insertadas
SELECT name, scraper_type, is_active, scraping_interval 
FROM public.sources;

-- Verificar que las políticas RLS estén activas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('sources', 'jobs_log', 'images');
