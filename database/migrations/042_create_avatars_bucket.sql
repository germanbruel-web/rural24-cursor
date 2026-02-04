-- ============================================================================
-- MIGRACIÓN 042: Crear bucket de avatars para Storage
-- ============================================================================
-- Fecha: 2026-02-04
-- Descripción: Crea el bucket público "avatars" para subir fotos de perfil
-- ============================================================================

-- 1. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,  -- Público para que las imágenes sean accesibles
  5242880,  -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: Cualquier usuario autenticado puede subir su avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Política: Cualquier usuario autenticado puede actualizar su avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Política: Cualquier usuario autenticado puede eliminar su avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política: Cualquiera puede ver avatars (bucket público)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT * FROM storage.buckets WHERE id = 'avatars';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%avatar%';
