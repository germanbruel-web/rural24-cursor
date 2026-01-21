-- ============================================================================
-- MIGRACIÓN 021: Global Settings
-- Sistema de configuración dinámica para administración del sitio
-- ============================================================================

-- 1. Crear tabla global_settings
CREATE TABLE IF NOT EXISTS global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  display_name VARCHAR(200),
  description TEXT,
  value_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json', 'array'
  is_public BOOLEAN DEFAULT false, -- Si puede ser leído sin autenticación
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_global_settings_category ON global_settings(category);
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(key);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_global_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_global_settings_updated ON global_settings;
CREATE TRIGGER trigger_global_settings_updated
  BEFORE UPDATE ON global_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_global_settings_timestamp();

-- 4. Insertar configuraciones iniciales
INSERT INTO global_settings (key, value, category, display_name, description, value_type, is_public)
VALUES 
  -- Configuración de Destacados (números como JSON)
  ('featured_max_per_category', '10'::jsonb, 'featured', 'Máx destacados por categoría', 'Cantidad máxima de avisos destacados simultáneos por categoría en la homepage', 'number', true),
  ('featured_min_days', '7'::jsonb, 'featured', 'Duración mínima (días)', 'Cantidad mínima de días que un aviso puede estar destacado', 'number', false),
  ('featured_max_days', '30'::jsonb, 'featured', 'Duración máxima (días)', 'Cantidad máxima de días que un aviso puede estar destacado', 'number', false),
  ('featured_price_per_day', '500'::jsonb, 'featured', 'Precio por día destacado (ARS)', 'Costo diario para destacar un aviso', 'number', false),
  
  -- Configuración de Contactos
  ('contacts_reset_day', '1'::jsonb, 'contacts', 'Día de reset mensual', 'Día del mes en que se reinician los contadores de contactos', 'number', false),
  
  -- Configuración General (strings necesitan comillas dobles, booleans sin comillas)
  ('site_maintenance_mode', 'false'::jsonb, 'general', 'Modo mantenimiento', 'Si está activo, solo admins pueden acceder', 'boolean', true),
  ('new_user_default_plan', '"free"'::jsonb, 'plans', 'Plan por defecto nuevos usuarios', 'Plan asignado automáticamente a usuarios nuevos', 'string', false),
  
  -- Analytics
  ('analytics_enabled', 'true'::jsonb, 'analytics', 'Analytics habilitado', 'Mostrar estadísticas de vistas a todos los usuarios', 'boolean', true)

ON CONFLICT (key) DO NOTHING;

-- 5. RLS Policies
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública para settings públicos
CREATE POLICY "Public settings are readable" ON global_settings
  FOR SELECT
  USING (is_public = true);

-- SuperAdmin puede leer todo
CREATE POLICY "SuperAdmin can read all settings" ON global_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Solo SuperAdmin puede modificar
CREATE POLICY "SuperAdmin can modify settings" ON global_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- ============================================================================
-- FUNCIONES HELPER
-- ============================================================================

-- Obtener un setting por key (con cast automático)
CREATE OR REPLACE FUNCTION get_setting(setting_key VARCHAR)
RETURNS JSONB AS $$
  SELECT value FROM global_settings WHERE key = setting_key;
$$ LANGUAGE sql STABLE;

-- Obtener setting como número
CREATE OR REPLACE FUNCTION get_setting_int(setting_key VARCHAR)
RETURNS INTEGER AS $$
  SELECT (value #>> '{}')::INTEGER FROM global_settings WHERE key = setting_key;
$$ LANGUAGE sql STABLE;

-- Obtener setting como booleano
CREATE OR REPLACE FUNCTION get_setting_bool(setting_key VARCHAR)
RETURNS BOOLEAN AS $$
  SELECT (value #>> '{}')::BOOLEAN FROM global_settings WHERE key = setting_key;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT key, value, category, display_name FROM global_settings ORDER BY category, key;
