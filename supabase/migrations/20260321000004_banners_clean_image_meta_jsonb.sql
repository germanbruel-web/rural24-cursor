-- Migration: 20260321000004_banners_clean_image_meta_jsonb
-- Agrega columnas JSONB para metadata completa de Cloudinary en banners_clean
-- Guarda {url, path, width, height, format, bytes} en lugar de solo url (string)
-- Las columnas _url existentes se mantienen como fallback durante la transición

DO $$ BEGIN
  RAISE NOTICE 'Iniciando migración: banners_clean image meta JSONB';
END $$;

-- Agregar columnas JSONB para metadata de cada imagen
ALTER TABLE public.banners_clean
  ADD COLUMN IF NOT EXISTS desktop_image_meta  jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mobile_image_meta   jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS carousel_image_meta jsonb DEFAULT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN public.banners_clean.desktop_image_meta  IS 'Metadata Cloudinary desktop: {url, path, width, height, format, bytes}';
COMMENT ON COLUMN public.banners_clean.mobile_image_meta   IS 'Metadata Cloudinary mobile: {url, path, width, height, format, bytes}';
COMMENT ON COLUMN public.banners_clean.carousel_image_meta IS 'Metadata Cloudinary carousel: {url, path, width, height, format, bytes}';

-- Índices GIN para queries sobre los JSONB (útil para filtrar por format/width)
CREATE INDEX IF NOT EXISTS idx_banners_clean_desktop_meta  ON public.banners_clean USING gin (desktop_image_meta);
CREATE INDEX IF NOT EXISTS idx_banners_clean_mobile_meta   ON public.banners_clean USING gin (mobile_image_meta);
CREATE INDEX IF NOT EXISTS idx_banners_clean_carousel_meta ON public.banners_clean USING gin (carousel_image_meta);

-- Backfill: si un banner ya tiene URL, crear un objeto mínimo en la columna meta
-- (solo path/url — ancho/alto/bytes no disponibles sin Cloudinary API)
UPDATE public.banners_clean
SET desktop_image_meta = jsonb_build_object('url', desktop_image_url)
WHERE desktop_image_url IS NOT NULL
  AND desktop_image_url <> ''
  AND desktop_image_meta IS NULL;

UPDATE public.banners_clean
SET mobile_image_meta = jsonb_build_object('url', mobile_image_url)
WHERE mobile_image_url IS NOT NULL
  AND mobile_image_url <> ''
  AND mobile_image_meta IS NULL;

UPDATE public.banners_clean
SET carousel_image_meta = jsonb_build_object('url', carousel_image_url)
WHERE carousel_image_url IS NOT NULL
  AND carousel_image_url <> ''
  AND carousel_image_meta IS NULL;

DO $$ BEGIN
  RAISE NOTICE 'Migración completada: columnas desktop/mobile/carousel_image_meta agregadas a banners_clean';
END $$;
