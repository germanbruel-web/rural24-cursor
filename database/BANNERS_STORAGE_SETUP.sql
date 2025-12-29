-- =====================================================
-- STORAGE: Configuración de Bucket para Banners
-- Descripción: Crear bucket y políticas para imágenes de banners
-- Fecha: 2024
-- =====================================================

-- IMPORTANTE: Este script debe ejecutarse en el SQL Editor de Supabase
-- después de ejecutar BANNERS_SCHEMA.sql

-- 1. CREAR BUCKET (si no existe)
-- Nota: Si ya existe el bucket 'ads-images', no es necesario crearlo de nuevo

INSERT INTO storage.buckets (id, name, public)
VALUES ('ads-images', 'ads-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. CONFIGURAR POLÍTICAS DE STORAGE PARA BANNERS

-- Policy: Lectura pública para la carpeta banners
CREATE POLICY "Lectura pública de banners"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ads-images' 
  AND (storage.foldername(name))[1] = 'banners'
);

-- Policy: Solo superadmins pueden subir banners
CREATE POLICY "Solo superadmins pueden subir banners"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ads-images' 
  AND (storage.foldername(name))[1] = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- Policy: Solo superadmins pueden actualizar banners
CREATE POLICY "Solo superadmins pueden actualizar banners"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ads-images' 
  AND (storage.foldername(name))[1] = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
)
WITH CHECK (
  bucket_id = 'ads-images' 
  AND (storage.foldername(name))[1] = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- Policy: Solo superadmins pueden eliminar banners
CREATE POLICY "Solo superadmins pueden eliminar banners"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ads-images' 
  AND (storage.foldername(name))[1] = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el bucket existe
SELECT * FROM storage.buckets WHERE id = 'ads-images';

-- Verificar políticas creadas
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%banners%';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
ESTRUCTURA DE CARPETAS EN STORAGE:
- ads-images/
  - ads/           (avisos de usuarios)
  - banners/       (banners publicitarios - solo superadmin)
  - heroes/        (imágenes hero - si existen)

FORMATOS PERMITIDOS PARA BANNERS:
- JPG / JPEG
- WEBP

DIMENSIONES RECOMENDADAS:
- homepage_search: 1200x200 px
- homepage_carousel: 648x100 px
- results_intercalated: 648x100 px
- results_lateral: Variable

LÍMITE DE TAMAÑO:
- Máximo 5MB por imagen (configurado en uploadService)
*/
