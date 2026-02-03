-- ================================================================
-- 20260203_ADD_SLUG_TO_ADS.sql
-- Agrega columna slug a la tabla ads y genera slugs para todos los avisos
-- ================================================================
-- Fecha: 3 de Febrero 2026
-- Autor: Arquitecto Fullstack
-- 
-- Problema: Los avisos se guardan sin slug, causando que URLs como
-- /ad/caballo-de-polo-de-excelente-rendimiento no encuentren el aviso.
--
-- Solución: 
-- 1. Agregar columna slug a la tabla ads (si no existe)
-- 2. Asegurar que short_id esté presente en todos los avisos
-- 3. Regenerar slugs con formato: titulo-normalizado-shortid
-- 4. Crear índice para búsquedas eficientes
-- 5. Crear trigger para generar slug automáticamente en nuevos avisos
-- ================================================================

-- 1. Agregar columna slug si no existe
ALTER TABLE ads ADD COLUMN IF NOT EXISTS slug VARCHAR(500);

-- 2. Agregar columna short_id si no existe
ALTER TABLE ads ADD COLUMN IF NOT EXISTS short_id VARCHAR(20);

-- 3. Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_ads_slug ON ads(slug);
CREATE INDEX IF NOT EXISTS idx_ads_short_id ON ads(short_id);

-- 4. Eliminar TODAS las funciones existentes (CASCADE para dependencias)
DROP FUNCTION IF EXISTS generate_short_id() CASCADE;
DROP FUNCTION IF EXISTS generate_ad_slug CASCADE;
DROP FUNCTION IF EXISTS trigger_generate_ad_slug() CASCADE;

-- Eliminar por nombre sin parámetros (cubre todas las variantes)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT oid::regprocedure as func_sig 
            FROM pg_proc 
            WHERE proname = 'generate_ad_slug') 
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE';
  END LOOP;
END $$;

-- 5. Función para generar short_id aleatorio (8 caracteres)
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para generar slug desde título + short_id
CREATE OR REPLACE FUNCTION generate_ad_slug(title TEXT, short_id TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Normalizar título: quitar acentos, espacios -> guiones, solo alfanuméricos
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(title, '[áàäâã]', 'a', 'gi'),
                '[éèëê]', 'e', 'gi'),
              '[íìïî]', 'i', 'gi'),
            '[óòöôõ]', 'o', 'gi'),
          '[úùüû]', 'u', 'gi'),
        '[ñ]', 'n', 'gi'),
      '[^a-z0-9]+', '-', 'gi')
  );
  
  -- Quitar guiones al inicio y final, limitar a 100 chars
  base_slug := left(trim(both '-' from base_slug), 100);
  
  -- Retornar slug con short_id al final
  RETURN base_slug || '-' || short_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Asegurar que todos los avisos tengan short_id
UPDATE ads 
SET short_id = generate_short_id()
WHERE short_id IS NULL OR short_id = '';

-- 8. Regenerar TODOS los slugs con el formato correcto (titulo-shortid)
-- Usar casts explícitos a TEXT para evitar ambigüedad de tipos
UPDATE ads 
SET slug = generate_ad_slug(title::TEXT, short_id::TEXT)
WHERE short_id IS NOT NULL AND short_id != '';

-- 9. Crear trigger para generar slug automáticamente en INSERT/UPDATE
CREATE OR REPLACE FUNCTION trigger_generate_ad_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Asegurar que short_id esté presente
  IF NEW.short_id IS NULL OR NEW.short_id = '' THEN
    NEW.short_id := generate_short_id();
  END IF;
  
  -- Generar slug si no existe o si cambió el título
  IF NEW.slug IS NULL OR NEW.slug = '' OR 
     (TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title) THEN
    NEW.slug := generate_ad_slug(NEW.title::TEXT, NEW.short_id::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y recrear
DROP TRIGGER IF EXISTS tr_generate_ad_slug ON ads;
CREATE TRIGGER tr_generate_ad_slug
  BEFORE INSERT OR UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_ad_slug();

-- 10. Verificar resultados
SELECT 
  id, 
  title, 
  slug, 
  short_id,
  status,
  created_at
FROM ads 
ORDER BY created_at DESC 
LIMIT 20;

-- 11. Mostrar estadísticas
SELECT 
  COUNT(*) as total_ads,
  COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) as ads_with_slug,
  COUNT(CASE WHEN short_id IS NOT NULL AND short_id != '' THEN 1 END) as ads_with_short_id,
  COUNT(CASE WHEN slug LIKE '%-________' THEN 1 END) as ads_with_correct_slug_format
FROM ads;
