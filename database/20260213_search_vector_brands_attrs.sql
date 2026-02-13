-- ====================================================================
-- MIGRACIÓN: Indexar marcas, modelos y atributos JSONB en search_vector
-- Fecha: 2026-02-13
-- Problema: Buscar "Vassalli", "Angus", "John Deere" no encuentra resultados
--           porque search_vector solo indexa title, description, province, city
-- Solución: Incluir brand (from brands table), model (from models table),
--           y atributos clave del JSONB attributes (raza, marca, modelo, etc.)
-- ====================================================================

-- 1. ACTUALIZAR TRIGGER para incluir brands, models y atributos JSONB
CREATE OR REPLACE FUNCTION public.update_ads_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_brand_name TEXT := '';
  v_model_name TEXT := '';
  v_attrs_text TEXT := '';
BEGIN
  -- Resolver nombre de marca desde tabla brands
  IF NEW.brand_id IS NOT NULL THEN
    SELECT COALESCE(b.name, '') INTO v_brand_name
    FROM brands b WHERE b.id = NEW.brand_id;
  END IF;

  -- Resolver nombre de modelo desde tabla models
  IF NEW.model_id IS NOT NULL THEN
    SELECT COALESCE(m.name, '') INTO v_model_name
    FROM models m WHERE m.id = NEW.model_id;
  END IF;

  -- Extraer atributos clave del JSONB attributes
  -- Estos son los atributos de "segundo nivel" que los usuarios buscan
  IF NEW.attributes IS NOT NULL AND NEW.attributes != '{}'::jsonb THEN
    v_attrs_text := CONCAT_WS(' ',
      COALESCE(NEW.attributes->>'marca', ''),
      COALESCE(NEW.attributes->>'brand', ''),
      COALESCE(NEW.attributes->>'modelo', ''),
      COALESCE(NEW.attributes->>'model', ''),
      COALESCE(NEW.attributes->>'raza', ''),
      COALESCE(NEW.attributes->>'breed', ''),
      COALESCE(NEW.attributes->>'tipobovino', ''),
      COALESCE(NEW.attributes->>'tipo', ''),
      COALESCE(NEW.attributes->>'variedad', ''),
      COALESCE(NEW.attributes->>'cultivo', ''),
      COALESCE(NEW.attributes->>'especie', '')
    );
  END IF;

  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(v_brand_name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(v_model_name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(v_attrs_text, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.province, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.city, '')), 'C');
  RETURN NEW;
END;
$function$;

-- 2. REINDEXAR todos los avisos existentes (dispara el trigger)
UPDATE ads SET updated_at = now() WHERE status = 'active';

-- 3. VERIFICAR: Contar cuántos avisos tienen search_vector actualizado
-- SELECT count(*) as total, 
--        count(search_vector) as con_vector,
--        count(brand_id) as con_marca
-- FROM ads WHERE status = 'active';
