-- ============================================================================
-- MIGRACIÓN 024: Seed de Planes de Suscripción
-- Actualiza/crea los 4 planes: Free, Starter, Pro, Empresa
-- ============================================================================

-- 1. Agregar columnas faltantes a subscription_plans si no existen
DO $$ 
BEGIN
  -- Columna para contactos enviados
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscription_plans' AND column_name = 'max_contacts_per_month') THEN
    ALTER TABLE subscription_plans ADD COLUMN max_contacts_per_month INTEGER;
  END IF;
  
  -- Columna para descripción del plan
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscription_plans' AND column_name = 'description') THEN
    ALTER TABLE subscription_plans ADD COLUMN description TEXT;
  END IF;
  
  -- Columna para features en JSON
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscription_plans' AND column_name = 'features') THEN
    ALTER TABLE subscription_plans ADD COLUMN features JSONB DEFAULT '[]';
  END IF;
  
  -- Columna para badge/color del plan
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscription_plans' AND column_name = 'badge_color') THEN
    ALTER TABLE subscription_plans ADD COLUMN badge_color VARCHAR(20) DEFAULT 'gray';
  END IF;
END $$;

-- 2. Desactivar planes anteriores
UPDATE subscription_plans SET is_active = false WHERE name NOT IN ('free', 'starter', 'pro', 'empresa');

-- 3. Upsert de los 4 planes definitivos

-- PLAN FREE
INSERT INTO subscription_plans (
  name, display_name, description,
  max_ads, max_contacts_per_month, max_featured_ads,
  has_public_profile, has_catalog, has_analytics,
  price_monthly, price_yearly, 
  is_active, sort_order, badge_color,
  features
) VALUES (
  'free', 'Gratis', 'Plan básico para comenzar a publicar',
  1, 3, 0,
  false, false, true,
  0, 0,
  true, 1, 'gray',
  '["1 aviso activo", "3 contactos por mes", "Estadísticas básicas", "Publicación anónima"]'::JSONB
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  max_ads = EXCLUDED.max_ads,
  max_contacts_per_month = EXCLUDED.max_contacts_per_month,
  max_featured_ads = EXCLUDED.max_featured_ads,
  has_public_profile = EXCLUDED.has_public_profile,
  has_catalog = EXCLUDED.has_catalog,
  has_analytics = EXCLUDED.has_analytics,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  badge_color = EXCLUDED.badge_color,
  features = EXCLUDED.features;

-- PLAN STARTER
INSERT INTO subscription_plans (
  name, display_name, description,
  max_ads, max_contacts_per_month, max_featured_ads,
  has_public_profile, has_catalog, has_analytics,
  price_monthly, price_yearly,
  is_active, sort_order, badge_color,
  features
) VALUES (
  'starter', 'Starter', 'Ideal para vendedores ocasionales',
  5, 10, 1,
  false, false, true,
  2999, 29990,
  true, 2, 'blue',
  '["5 avisos activos", "10 contactos por mes", "1 destacado", "Estadísticas completas", "Publicación anónima"]'::JSONB
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  max_ads = EXCLUDED.max_ads,
  max_contacts_per_month = EXCLUDED.max_contacts_per_month,
  max_featured_ads = EXCLUDED.max_featured_ads,
  has_public_profile = EXCLUDED.has_public_profile,
  has_catalog = EXCLUDED.has_catalog,
  has_analytics = EXCLUDED.has_analytics,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  badge_color = EXCLUDED.badge_color,
  features = EXCLUDED.features;

-- PLAN PRO
INSERT INTO subscription_plans (
  name, display_name, description,
  max_ads, max_contacts_per_month, max_featured_ads,
  has_public_profile, has_catalog, has_analytics,
  price_monthly, price_yearly,
  is_active, sort_order, badge_color,
  features
) VALUES (
  'pro', 'Pro', 'Para vendedores profesionales',
  15, NULL, 3, -- NULL = ilimitado
  false, false, true,
  5999, 59990,
  true, 3, 'purple',
  '["15 avisos activos", "Contactos ilimitados", "3 destacados", "Estadísticas avanzadas", "Publicación anónima", "Soporte prioritario"]'::JSONB
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  max_ads = EXCLUDED.max_ads,
  max_contacts_per_month = EXCLUDED.max_contacts_per_month,
  max_featured_ads = EXCLUDED.max_featured_ads,
  has_public_profile = EXCLUDED.has_public_profile,
  has_catalog = EXCLUDED.has_catalog,
  has_analytics = EXCLUDED.has_analytics,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  badge_color = EXCLUDED.badge_color,
  features = EXCLUDED.features;

-- PLAN EMPRESA
INSERT INTO subscription_plans (
  name, display_name, description,
  max_ads, max_contacts_per_month, max_featured_ads,
  has_public_profile, has_catalog, has_analytics,
  price_monthly, price_yearly,
  is_active, sort_order, badge_color,
  features
) VALUES (
  'empresa', 'Empresa', 'Solución completa para empresas y concesionarios',
  NULL, NULL, 10, -- NULL = ilimitado
  true, true, true,
  14999, 149990,
  true, 4, 'gold',
  '["Avisos ilimitados", "Contactos ilimitados", "10 destacados", "Perfil público de empresa", "Catálogo de productos", "Datos de contacto visibles", "Soporte VIP", "Reportes personalizados"]'::JSONB
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  max_ads = EXCLUDED.max_ads,
  max_contacts_per_month = EXCLUDED.max_contacts_per_month,
  max_featured_ads = EXCLUDED.max_featured_ads,
  has_public_profile = EXCLUDED.has_public_profile,
  has_catalog = EXCLUDED.has_catalog,
  has_analytics = EXCLUDED.has_analytics,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  badge_color = EXCLUDED.badge_color,
  features = EXCLUDED.features;

-- 4. Agregar columnas a users si no existen
DO $$ 
BEGIN
  -- Contador de contactos usados este mes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'contacts_used_this_month') THEN
    ALTER TABLE users ADD COLUMN contacts_used_this_month INTEGER DEFAULT 0;
  END IF;
  
  -- Fecha de reset de contactos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'contacts_reset_at') THEN
    ALTER TABLE users ADD COLUMN contacts_reset_at TIMESTAMPTZ;
  END IF;
END $$;

-- 5. Función para resetear contadores de contactos mensualmente
CREATE OR REPLACE FUNCTION reset_monthly_contacts()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE users
  SET contacts_used_this_month = 0,
      contacts_reset_at = NOW()
  WHERE contacts_reset_at IS NULL 
     OR contacts_reset_at < DATE_TRUNC('month', NOW());
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE 'Reset contacts for % users', reset_count;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Asignar plan FREE a usuarios que no tienen plan
UPDATE users 
SET subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'free'),
    subscription_status = 'active'
WHERE subscription_plan_id IS NULL;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 
  name, 
  display_name, 
  max_ads, 
  max_contacts_per_month,
  max_featured_ads,
  has_public_profile,
  price_monthly,
  is_active,
  sort_order
FROM subscription_plans 
WHERE is_active = true
ORDER BY sort_order;
