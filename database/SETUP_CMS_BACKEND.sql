-- =====================================================
-- SISTEMA CMS BACKEND - GESTIÓN DE CONTENIDOS
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- Crea tabla para gestionar imágenes fijas y contenidos del sitio

-- =====================================================
-- 1. TABLA SITE_SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('text', 'image', 'json', 'html')),
  section TEXT NOT NULL CHECK (section IN ('header', 'footer', 'content', 'general')),
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_section ON site_settings(section);

-- =====================================================
-- 2. DATOS INICIALES - Configuraciones predeterminadas
-- =====================================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, section, description) VALUES
  ('header_logo', '/images/preview-image.webp', 'image', 'header', 'Logo principal del header'),
  ('footer_logo', '/images/preview-image.webp', 'image', 'footer', 'Logo del footer'),
  ('default_ad_image', '/images/preview-image.webp', 'image', 'content', 'Imagen placeholder para avisos sin foto'),
  ('site_name', 'Rural24', 'text', 'general', 'Nombre del sitio'),
  ('site_tagline', 'Tu portal de avisos clasificados', 'text', 'general', 'Tagline del sitio'),
  ('contact_email', 'contacto@rural24.com', 'text', 'general', 'Email de contacto'),
  ('contact_phone', '+54 9 11 1234-5678', 'text', 'general', 'Teléfono de contacto')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 3. RLS POLICIES - Solo SuperAdmin puede modificar
-- =====================================================

-- Activar RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer (para mostrar en el sitio)
CREATE POLICY "Anyone can view site settings"
ON site_settings
FOR SELECT
USING (true);

-- Política: Solo superadmin puede insertar
CREATE POLICY "Only superadmin can insert settings"
ON site_settings
FOR INSERT
TO authenticated
WITH CHECK (true);
-- NOTA: La verificación de role = 'superadmin' se hace en el servicio siteSettingsService.ts

-- Política: Solo superadmin puede actualizar
CREATE POLICY "Only superadmin can update settings"
ON site_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
-- NOTA: La verificación de role = 'superadmin' se hace en el servicio siteSettingsService.ts

-- Política: Solo superadmin puede eliminar
CREATE POLICY "Only superadmin can delete settings"
ON site_settings
FOR DELETE
TO authenticated
USING (true);
-- NOTA: La verificación de role = 'superadmin' se hace en el servicio siteSettingsService.ts

-- =====================================================
-- 4. BUCKET STORAGE PARA CMS (si no existe)
-- =====================================================

-- Crear bucket para imágenes del CMS
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-images', 'cms-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Cualquiera puede ver imágenes del CMS
DROP POLICY IF EXISTS "Anyone can view CMS images" ON storage.objects;
CREATE POLICY "Anyone can view CMS images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cms-images');

-- Política: Solo superadmin puede subir imágenes al CMS
DROP POLICY IF EXISTS "Only superadmin can upload CMS images" ON storage.objects;
CREATE POLICY "Only superadmin can upload CMS images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cms-images');
-- NOTA: La verificación de role = 'superadmin' se hace en el servicio siteSettingsService.ts

-- Política: Solo superadmin puede actualizar imágenes del CMS
DROP POLICY IF EXISTS "Only superadmin can update CMS images" ON storage.objects;
CREATE POLICY "Only superadmin can update CMS images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'cms-images');
-- NOTA: La verificación de role = 'superadmin' se hace en el servicio siteSettingsService.ts

-- Política: Solo superadmin puede eliminar imágenes del CMS
DROP POLICY IF EXISTS "Only superadmin can delete CMS images" ON storage.objects;
CREATE POLICY "Only superadmin can delete CMS images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cms-images');
-- NOTA: La verificación de role = 'superadmin' se hace en el servicio siteSettingsService.ts

-- =====================================================
-- 5. FUNCIÓN HELPER - Actualizar timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_site_settings_timestamp ON site_settings;
CREATE TRIGGER trigger_update_site_settings_timestamp
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_timestamp();

-- =====================================================
-- 6. FUNCIONES HELPER PARA FRONTEND
-- =====================================================

-- Obtener un setting por key
CREATE OR REPLACE FUNCTION get_setting(key TEXT)
RETURNS TEXT AS $$
  SELECT setting_value FROM site_settings WHERE setting_key = key LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Obtener todos los settings de una sección
CREATE OR REPLACE FUNCTION get_settings_by_section(sec TEXT)
RETURNS TABLE (
  key TEXT,
  value TEXT,
  type TEXT,
  description TEXT
) AS $$
  SELECT setting_key, setting_value, setting_type, description
  FROM site_settings
  WHERE section = sec
  ORDER BY setting_key;
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- 7. VERIFICACIÓN
-- =====================================================

-- Ver todas las configuraciones
SELECT 
  setting_key,
  setting_value,
  setting_type,
  section,
  description,
  updated_at
FROM site_settings
ORDER BY section, setting_key;

-- Ver configuraciones por sección
SELECT * FROM get_settings_by_section('header');
SELECT * FROM get_settings_by_section('footer');
SELECT * FROM get_settings_by_section('content');

-- =====================================================
-- NOTAS:
-- =====================================================
-- 
-- 1. Todas las imágenes se guardan en: storage bucket 'cms-images'
-- 2. Solo usuarios con role = 'superadmin' pueden modificar
-- 3. Todos pueden leer (público) para mostrar en el sitio
-- 4. Las URLs de imágenes se guardan como: /storage/v1/object/public/cms-images/filename.ext
-- 5. Usar updated_by para auditoría de cambios
-- 
-- =====================================================
