-- ================================================================
-- FIX: Reemplazar imágenes placeholder rotas en seeds de
-- Inmobiliaria Rural (DIR*) y Empleos (DME*)
-- Las URLs de Cloudinary en esos seeds nunca existieron
-- Reemplazar con Supabase Storage (mismo patrón que otros seeds)
-- ⚠️ DEV ONLY — datos de prueba
-- ================================================================

-- Inmobiliaria Rural (DIR*) → placeholder inmobiliaria
UPDATE public.ads
SET images = '[{"url":"https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/default/1766774654119-4y5bi9.webp","path":"default/1766774654119-4y5bi9.webp"}]'
WHERE short_id LIKE 'DIR%'
  AND images::text LIKE '%ruralcloudinary%';

-- Empleos (DME*) → placeholder empleos
UPDATE public.ads
SET images = '[{"url":"https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/default/1766774654119-4y5bi9.webp","path":"default/1766774654119-4y5bi9.webp"}]'
WHERE short_id LIKE 'DME%'
  AND images::text LIKE '%ruralcloudinary%';
