-- ============================================================================
-- MIGRACIÓN: Agregar columnas de visualización a subscription_plans
-- Para soportar UI dinámica en PricingPage y PlansAdmin
-- ============================================================================

-- 1. Agregar columnas de UI si no existen
DO $$ 
BEGIN
  -- icon_name: nombre del icono (gift, zap, sparkles, building2)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscription_plans' AND column_name = 'icon_name') THEN
    ALTER TABLE subscription_plans ADD COLUMN icon_name VARCHAR(50) DEFAULT 'gift';
  END IF;
  
  -- badge_text: texto del badge (ej: "Más Popular", "Premium")
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscription_plans' AND column_name = 'badge_text') THEN
    ALTER TABLE subscription_plans ADD COLUMN badge_text VARCHAR(100);
  END IF;
  
  -- is_featured: si es el plan destacado (borde verde en pricing)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscription_plans' AND column_name = 'is_featured') THEN
    ALTER TABLE subscription_plans ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Actualizar planes existentes con valores visuales
-- (Ejecutar siempre para asegurar consistencia)
UPDATE subscription_plans SET icon_name = 'gift', is_featured = false WHERE name = 'free';
UPDATE subscription_plans SET icon_name = 'zap', is_featured = false WHERE name = 'starter';
UPDATE subscription_plans SET icon_name = 'sparkles', badge_text = 'Más Popular', is_featured = true WHERE name = 'pro';
UPDATE subscription_plans SET icon_name = 'building2', badge_text = 'Premium', is_featured = false WHERE name = 'empresa';

-- 3. Verificar resultado
SELECT name, display_name, icon_name, badge_text, badge_color, is_featured, is_active
FROM subscription_plans 
ORDER BY sort_order;
