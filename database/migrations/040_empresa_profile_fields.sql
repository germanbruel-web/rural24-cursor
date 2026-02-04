-- ============================================================================
-- MIGRACIÓN 040: Campos de Perfil para Empresas
-- ============================================================================
-- Agrega campos para:
-- 1. Avatar/Logo
-- 2. Descripción de empresa
-- 3. Servicios principales
-- 4. Configuración de privacidad
-- 5. Métricas de perfil
-- ============================================================================

-- 1. Agregar campos de perfil extendido a users
DO $$ 
BEGIN
  -- Avatar/Logo (una sola imagen, puede ser foto personal o logo)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;

  -- Descripción de empresa (solo aplica a empresas)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'company_description') THEN
    ALTER TABLE users ADD COLUMN company_description TEXT;
  END IF;

  -- Servicios principales (texto libre, solo empresas)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'services') THEN
    ALTER TABLE users ADD COLUMN services TEXT;
  END IF;

  -- Configuración de privacidad (solo empresas)
  -- 'public' = mostrar datos de contacto + formulario
  -- 'private' = ocultar datos, solo formulario anónimo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'privacy_mode') THEN
    ALTER TABLE users ADD COLUMN privacy_mode VARCHAR(20) DEFAULT 'public';
  END IF;

  -- Métricas de perfil (solo lectura, actualizadas por triggers)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'profile_views') THEN
    ALTER TABLE users ADD COLUMN profile_views INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'profile_contacts_received') THEN
    ALTER TABLE users ADD COLUMN profile_contacts_received INTEGER DEFAULT 0;
  END IF;

  RAISE NOTICE '✅ Campos de perfil empresa agregados a users';
END $$;

-- 2. Crear tabla para contactos de perfil (formulario anónimo)
CREATE TABLE IF NOT EXISTS profile_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario empresa que recibe el contacto
  profile_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Datos del contacto (puede ser anónimo o registrado)
  sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL si es anónimo
  sender_first_name VARCHAR(100) NOT NULL,
  sender_last_name VARCHAR(100) NOT NULL,
  sender_phone VARCHAR(50) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Origen del contacto (para métricas)
  source_type VARCHAR(50) DEFAULT 'profile', -- 'profile', 'ad', 'search'
  source_ad_id UUID REFERENCES ads(id) ON DELETE SET NULL, -- Si viene de un aviso
  
  -- Estado
  status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived'
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla para trackeo de vistas de perfil
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Perfil visualizado
  profile_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Visitante (puede ser anónimo)
  visitor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  visitor_ip VARCHAR(45), -- IPv4 o IPv6
  visitor_user_agent TEXT,
  
  -- Origen de la visita
  source_type VARCHAR(50) DEFAULT 'direct', -- 'direct', 'ad', 'search', 'external'
  source_ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  source_url TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_profile_contacts_profile_user ON profile_contacts(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_contacts_status ON profile_contacts(status);
CREATE INDEX IF NOT EXISTS idx_profile_contacts_created ON profile_contacts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_user ON profile_views(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created ON profile_views(created_at DESC);

-- 5. Trigger para actualizar contador de contactos en users
CREATE OR REPLACE FUNCTION update_profile_contacts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET profile_contacts_received = (
    SELECT COUNT(*) FROM profile_contacts WHERE profile_user_id = NEW.profile_user_id
  )
  WHERE id = NEW.profile_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_contacts_count ON profile_contacts;
CREATE TRIGGER trigger_update_profile_contacts_count
  AFTER INSERT ON profile_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_contacts_count();

-- 6. Función para incrementar vistas de perfil (evita duplicados en corto tiempo)
CREATE OR REPLACE FUNCTION increment_profile_view(
  p_profile_user_id UUID,
  p_visitor_user_id UUID DEFAULT NULL,
  p_visitor_ip VARCHAR(45) DEFAULT NULL,
  p_source_type VARCHAR(50) DEFAULT 'direct',
  p_source_ad_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  last_view_time TIMESTAMPTZ;
BEGIN
  -- Verificar si hay una vista reciente (últimos 30 min) del mismo visitante
  SELECT MAX(created_at) INTO last_view_time
  FROM profile_views
  WHERE profile_user_id = p_profile_user_id
    AND (
      (p_visitor_user_id IS NOT NULL AND visitor_user_id = p_visitor_user_id)
      OR (p_visitor_ip IS NOT NULL AND visitor_ip = p_visitor_ip)
    )
    AND created_at > NOW() - INTERVAL '30 minutes';

  -- Si no hay vista reciente, registrar nueva
  IF last_view_time IS NULL THEN
    INSERT INTO profile_views (
      profile_user_id, visitor_user_id, visitor_ip, source_type, source_ad_id
    ) VALUES (
      p_profile_user_id, p_visitor_user_id, p_visitor_ip, p_source_type, p_source_ad_id
    );
    
    -- Actualizar contador en users
    UPDATE users SET profile_views = profile_views + 1 WHERE id = p_profile_user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 7. Vista para métricas de empresa
CREATE OR REPLACE VIEW empresa_metrics_view AS
SELECT 
  u.id,
  u.full_name,
  u.company_name,
  u.avatar_url,
  u.profile_views,
  u.profile_contacts_received,
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
  ) as contacts_last_7_days
FROM users u
WHERE u.user_type = 'empresa';

-- 8. RLS Policies
ALTER TABLE profile_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Profile contacts: empresa puede ver sus contactos recibidos
DROP POLICY IF EXISTS "Users can view their received contacts" ON profile_contacts;
CREATE POLICY "Users can view their received contacts" ON profile_contacts
  FOR SELECT USING (profile_user_id = auth.uid());

-- Profile contacts: cualquiera puede insertar (formulario público)
DROP POLICY IF EXISTS "Anyone can send profile contact" ON profile_contacts;
CREATE POLICY "Anyone can send profile contact" ON profile_contacts
  FOR INSERT WITH CHECK (true);

-- Profile views: solo lectura para el dueño del perfil
DROP POLICY IF EXISTS "Users can view their profile views" ON profile_views;
CREATE POLICY "Users can view their profile views" ON profile_views
  FOR SELECT USING (profile_user_id = auth.uid());

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('avatar_url', 'company_description', 'services', 'privacy_mode', 'profile_views', 'profile_contacts_received')
ORDER BY ordinal_position;
