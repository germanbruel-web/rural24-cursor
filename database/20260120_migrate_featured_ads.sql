-- MIGRACIÓN INICIAL DE DESTACADOS A featured_ads_queue
-- 1. Migrar destacados activos
INSERT INTO public.featured_ads_queue (
    ad_id, activated_at, expires_at, status, reason, created_at, updated_at
)
SELECT 
    id as ad_id,
    COALESCE(featured_at, now()) as activated_at,
    featured_until as expires_at,
    'active' as status,
    'migración inicial' as reason,
    now() as created_at,
    now() as updated_at
FROM public.ads
WHERE featured = true OR (featured_until IS NOT NULL AND featured_until > now());

-- 2. Migrar históricos (expirados)
INSERT INTO public.featured_ads_queue (
    ad_id, activated_at, deactivated_at, expires_at, status, reason, created_at, updated_at
)
SELECT 
    id as ad_id,
    featured_at as activated_at,
    featured_until as deactivated_at,
    featured_until as expires_at,
    'expired' as status,
    'migración inicial' as reason,
    now() as created_at,
    now() as updated_at
FROM public.ads
WHERE featured = false AND featured_until IS NOT NULL AND featured_until <= now();

-- 3. Validar cantidad de destacados activos
-- SELECT COUNT(*) FROM public.featured_ads_queue WHERE status = 'active';
