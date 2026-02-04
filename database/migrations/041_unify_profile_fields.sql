-- ============================================================================
-- MIGRACIÓN 041: Unificación de Campos de Perfil
-- ============================================================================
-- Cambios:
-- 1. Renombrar company_name → display_name (para todos)
-- 2. Renombrar company_description → bio (para todos)
-- 3. Eliminar company_cuit (no se usará)
-- 4. Los campos services, privacy_mode, métricas aplican a todos
-- ============================================================================

-- 1. Renombrar company_name → display_name
DO $$ 
BEGIN
  -- Si existe company_name, renombrarlo
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'company_name') THEN
    ALTER TABLE users RENAME COLUMN company_name TO display_name;
    RAISE NOTICE '✅ company_name renombrado a display_name';
  -- Si no existe ninguno, crear display_name
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'display_name') THEN
    ALTER TABLE users ADD COLUMN display_name VARCHAR(200);
    RAISE NOTICE '✅ display_name creado';
  ELSE
    RAISE NOTICE '⚠️ display_name ya existe';
  END IF;
END $$;

-- 2. Renombrar company_description → bio
DO $$ 
BEGIN
  -- Si existe company_description, renombrarlo
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'company_description') THEN
    ALTER TABLE users RENAME COLUMN company_description TO bio;
    RAISE NOTICE '✅ company_description renombrado a bio';
  -- Si no existe ninguno, crear bio
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'bio') THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
    RAISE NOTICE '✅ bio creado';
  ELSE
    RAISE NOTICE '⚠️ bio ya existe';
  END IF;
END $$;

-- 3. Eliminar company_cuit si existe
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'company_cuit') THEN
    ALTER TABLE users DROP COLUMN company_cuit;
    RAISE NOTICE '✅ company_cuit eliminado';
  ELSE
    RAISE NOTICE '⚠️ company_cuit no existía';
  END IF;
END $$;

-- 4. Agregar comentarios descriptivos a los campos
COMMENT ON COLUMN users.display_name IS 'Nombre profesional o razón social. Ej: "Juan Pérez - Agrónomo" o "Agro Sur SRL"';
COMMENT ON COLUMN users.bio IS 'Descripción personal o de la empresa. Qué hace, experiencia, etc.';
COMMENT ON COLUMN users.services IS 'Servicios que ofrece. Texto libre.';
COMMENT ON COLUMN users.privacy_mode IS 'public = datos visibles, private = solo formulario. Aplica a empresas y particulares premium.';
COMMENT ON COLUMN users.avatar_url IS 'Foto personal o logo de empresa.';

-- 5. Actualizar vista de métricas para incluir todos los usuarios con perfil profesional
CREATE OR REPLACE VIEW user_metrics_view AS
SELECT 
  u.id,
  u.full_name,
  u.display_name,
  u.user_type,
  u.avatar_url,
  u.profile_views,
  u.profile_contacts_received,
  sp.name as plan_name,
  sp.features as plan_features,
  CASE 
    WHEN u.profile_views > 0 
    THEN ROUND((u.profile_contacts_received::DECIMAL / u.profile_views) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  (
    SELECT COUNT(*) FROM profile_contacts pc 
    WHERE pc.profile_user_id = u.id AND pc.status = 'unread'
  ) as unread_contacts,
  (
    SELECT COUNT(*) FROM profile_views pv 
    WHERE pv.profile_user_id = u.id AND pv.created_at > NOW() - INTERVAL '7 days'
  ) as views_last_7_days,
  (
    SELECT COUNT(*) FROM profile_contacts pc 
    WHERE pc.profile_user_id = u.id AND pc.created_at > NOW() - INTERVAL '7 days'
  ) as contacts_last_7_days,
  -- Determinar si tiene acceso a features premium
  CASE 
    WHEN u.user_type = 'empresa' THEN TRUE
    WHEN sp.name IN ('premium', 'profesional', 'avanzado') THEN TRUE
    ELSE FALSE
  END as has_premium_features
FROM users u
LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id;

-- 6. Eliminar vista anterior solo para empresas
DROP VIEW IF EXISTS empresa_metrics_view;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'users' 
  AND column_name IN ('display_name', 'bio', 'services', 'privacy_mode', 'avatar_url', 'profile_views', 'profile_contacts_received')
ORDER BY ordinal_position;
