-- ================================================================
-- FIX: Actualizar imágenes de seed demo ads con placeholder por categoría
-- ================================================================

UPDATE public.ads SET images = '[{"url":"https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/default/1773711518473-jji7wq.webp","path":"default/1773711518473-jji7wq.webp"}]'
WHERE short_id LIKE 'DMA%';

UPDATE public.ads SET images = '[{"url":"https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/default/1773711146800-6nrzzk.webp","path":"default/1773711146800-6nrzzk.webp"}]'
WHERE short_id LIKE 'DMH%';

UPDATE public.ads SET images = '[{"url":"https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/default/1773711195266-9t00il.webp","path":"default/1773711195266-9t00il.webp"}]'
WHERE short_id LIKE 'DMR%';

UPDATE public.ads SET images = '[{"url":"https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/default/1773711169473-hdqe5p.webp","path":"default/1773711169473-hdqe5p.webp"}]'
WHERE short_id LIKE 'DMI%';

UPDATE public.ads SET images = '[{"url":"https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/default/1773711210291-ld6y1p.webp","path":"default/1773711210291-ld6y1p.webp"}]'
WHERE short_id LIKE 'DMS%';

UPDATE public.ads SET images = '[{"url":"https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/default/1773711135657-mcg8c.webp","path":"default/1773711135657-mcg8c.webp"}]'
WHERE short_id LIKE 'DME%';
