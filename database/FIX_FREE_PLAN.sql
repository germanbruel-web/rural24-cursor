-- ============================================================================
-- VERIFICAR Y ACTIVAR PLAN FREE
-- Ejecutar en Supabase SQL Editor si el registro de empresa falla
-- ============================================================================

-- 1. Ver todos los planes
SELECT id, name, display_name, is_active, sort_order 
FROM subscription_plans 
ORDER BY sort_order;

-- 2. Activar el plan free si está inactivo
UPDATE subscription_plans 
SET is_active = true 
WHERE LOWER(name) = 'free';

-- 3. Si no existe el plan free, crearlo
INSERT INTO subscription_plans (
  name, display_name, description,
  max_ads, max_contacts_per_month, max_featured_ads,
  has_public_profile, has_catalog, has_analytics,
  price_monthly, price_yearly, 
  is_active, sort_order, badge_color,
  features, icon_name
) 
SELECT 
  'free', 'Gratis', 'Plan básico para comenzar a publicar',
  1, 3, 0,
  false, false, true,
  0, 0,
  true, 1, 'gray',
  '["1 aviso activo", "3 contactos enviados/mes", "3 contactos recibidos/mes", "Estadísticas básicas"]'::jsonb,
  'gift'
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE LOWER(name) = 'free'
);

-- 4. Verificar resultado
SELECT id, name, display_name, is_active 
FROM subscription_plans 
WHERE LOWER(name) = 'free';
