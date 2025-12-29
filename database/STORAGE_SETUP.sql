-- ================================================
-- CONFIGURACIÓN DE SUPABASE STORAGE PARA IMÁGENES
-- ================================================

-- 1. CREAR BUCKET PÚBLICO PARA IMÁGENES DE AVISOS
-- ================================================

-- Este comando crea el bucket desde la UI de Supabase, pero aquí está el SQL equivalente
-- Ve a: Storage > Create Bucket
-- Nombre: ads-images
-- Public: YES

-- Si tienes acceso a SQL directo, ejecuta:
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads-images', 'ads-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. CONFIGURAR POLÍTICAS DE ACCESO (RLS)
-- ================================================

-- Policy: Permitir que todos puedan VER las imágenes (bucket público)
CREATE POLICY "Public Access to ads-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads-images');

-- Policy: Usuarios autenticados pueden SUBIR imágenes
CREATE POLICY "Authenticated users can upload ads-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ads-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Usuarios pueden ACTUALIZAR sus propias imágenes
CREATE POLICY "Users can update their own ads-images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ads-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Usuarios pueden ELIMINAR sus propias imágenes
CREATE POLICY "Users can delete their own ads-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ads-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: SuperAdmin puede hacer TODO
CREATE POLICY "SuperAdmin can do everything with ads-images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'ads-images'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super-admin'
  )
);

-- ================================================
-- VERIFICACIÓN
-- ================================================

-- Ver buckets creados
SELECT * FROM storage.buckets WHERE id = 'ads-images';

-- Ver policies del bucket
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%ads-images%';

-- ================================================
-- CONFIGURACIÓN DESDE UI (MÁS FÁCIL)
-- ================================================

/*
OPCIÓN RECOMENDADA: Usar la interfaz de Supabase

1. Ve a: Storage (icono de carpeta en el menú lateral)

2. Click en "Create a new bucket"

3. Configuración:
   - Name: ads-images
   - Public bucket: ✅ YES (importante!)
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
   
4. Click "Create bucket"

5. Click en el bucket "ads-images"

6. Click en "Policies" (pestaña superior)

7. Click en "New Policy" > "For full customization"

8. Configurar políticas:

   POLICY 1 - SELECT (ver imágenes):
   - Policy name: Public Access
   - Allowed operation: SELECT
   - Target roles: public
   - USING expression: true
   - Click "Save"

   POLICY 2 - INSERT (subir imágenes):
   - Policy name: Authenticated Upload
   - Allowed operation: INSERT
   - Target roles: authenticated
   - WITH CHECK expression: true
   - Click "Save"

   POLICY 3 - DELETE (eliminar imágenes):
   - Policy name: Owner Delete
   - Allowed operation: DELETE
   - Target roles: authenticated
   - USING expression: (storage.foldername(name))[1] = auth.uid()::text
   - Click "Save"
*/

-- ================================================
-- TESTING
-- ================================================

-- Probar que el bucket existe y es público
SELECT 
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'ads-images';

-- Resultado esperado:
-- id: ads-images
-- name: ads-images
-- public: true
-- file_size_limit: 5242880 (5MB)
-- allowed_mime_types: {image/jpeg, image/png, image/webp, image/gif}
