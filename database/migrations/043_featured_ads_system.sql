-- ============================================================================
-- MIGRACIÓN 043: Sistema de Avisos Destacados
-- ============================================================================
-- Fecha: 2026-02-04
-- Descripción: Crea el sistema completo de avisos destacados con créditos,
--              programación y control de slots por ubicación
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE CRÉDITOS DE DESTACADOS POR USUARIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_featured_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_total INT NOT NULL DEFAULT 0,        -- Créditos comprados totales
  credits_used INT NOT NULL DEFAULT 0,         -- Créditos ya consumidos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_featured_credits_user_unique UNIQUE(user_id),
  CONSTRAINT credits_check CHECK (credits_used <= credits_total AND credits_total >= 0 AND credits_used >= 0)
);

-- ============================================================================
-- 2. TABLA PRINCIPAL DE AVISOS DESTACADOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS featured_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ubicación del destacado
  placement VARCHAR(20) NOT NULL CHECK (placement IN ('homepage', 'results', 'detail')),
  category_id UUID NOT NULL REFERENCES categories(id),  -- Categoría principal del aviso
  
  -- Programación temporal
  scheduled_start DATE NOT NULL,               -- Fecha elegida por usuario
  actual_start TIMESTAMPTZ,                    -- Cuándo realmente se activó
  expires_at TIMESTAMPTZ,                      -- actual_start + duración
  duration_days INT NOT NULL DEFAULT 15,       -- Duración en días
  
  -- Estado del destacado
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  
  -- Metadata
  priority INT DEFAULT 0,                      -- Para ordenamiento FIFO
  credit_consumed BOOLEAN DEFAULT FALSE,       -- Si ya consumió el crédito
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CONSTRAINTS ÚNICOS PARA REGLAS DE NEGOCIO
-- ============================================================================

-- Un aviso no puede estar destacado 2 veces en el mismo placement
CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_ads_unique_ad_placement 
  ON featured_ads(ad_id, placement) 
  WHERE status IN ('pending', 'active');

-- Un usuario solo puede tener 1 destacado activo/pendiente por placement
CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_ads_unique_user_placement 
  ON featured_ads(user_id, placement) 
  WHERE status IN ('pending', 'active');

-- ============================================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_featured_ads_status ON featured_ads(status);
CREATE INDEX IF NOT EXISTS idx_featured_ads_placement ON featured_ads(placement);
CREATE INDEX IF NOT EXISTS idx_featured_ads_category ON featured_ads(category_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_user ON featured_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_expires ON featured_ads(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_featured_ads_scheduled ON featured_ads(scheduled_start) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_featured_ads_placement_category_status 
  ON featured_ads(placement, category_id, status);

-- ============================================================================
-- 5. TRIGGER PARA UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_featured_ads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_featured_ads_updated ON featured_ads;
CREATE TRIGGER trigger_featured_ads_updated
  BEFORE UPDATE ON featured_ads
  FOR EACH ROW
  EXECUTE FUNCTION update_featured_ads_timestamp();

-- ============================================================================
-- 6. CONFIGURACIONES EN GLOBAL_SETTINGS
-- ============================================================================
INSERT INTO global_settings (key, value, category, display_name, description, value_type, is_public)
VALUES 
  -- Slots por ubicación
  ('featured_slots_homepage', '10'::jsonb, 'featured', 'Slots Homepage por categoría', 
   'Cantidad máxima de avisos destacados por categoría en homepage', 'number', true),
  ('featured_slots_results', '4'::jsonb, 'featured', 'Slots Resultados', 
   'Cantidad de avisos destacados en página de resultados', 'number', true),
  ('featured_slots_detail', '6'::jsonb, 'featured', 'Slots Detalle', 
   'Cantidad de avisos destacados relacionados en página de detalle', 'number', true),
  
  -- Duración
  ('featured_duration_days', '15'::jsonb, 'featured', 'Duración destacado (días)', 
   'Cantidad de días que dura un aviso destacado', 'number', true),
  
  -- Precios (para futuro)
  ('featured_credit_price', '2500'::jsonb, 'featured', 'Precio por crédito (ARS)', 
   'Precio de un crédito para destacar aviso', 'number', false),
  ('featured_credit_pack_5_price', '10000'::jsonb, 'featured', 'Pack 5 créditos (ARS)', 
   'Precio del pack de 5 créditos', 'number', false),
  ('featured_credit_pack_10_price', '18000'::jsonb, 'featured', 'Pack 10 créditos (ARS)', 
   'Precio del pack de 10 créditos con descuento', 'number', false)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- ============================================================================
-- 7. VISTA DE DISPONIBILIDAD DE SLOTS
-- ============================================================================
-- NOTA: En Rural24 las categorías principales están en tabla 'categories'
-- y las subcategorías en tabla 'subcategories'. No hay parent_id.
CREATE OR REPLACE VIEW featured_slots_availability AS
WITH settings AS (
  SELECT 
    (SELECT (value #>> '{}')::INT FROM global_settings WHERE key = 'featured_slots_homepage') as homepage_max,
    (SELECT (value #>> '{}')::INT FROM global_settings WHERE key = 'featured_slots_results') as results_max,
    (SELECT (value #>> '{}')::INT FROM global_settings WHERE key = 'featured_slots_detail') as detail_max
)
SELECT 
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  'homepage' as placement,
  s.homepage_max as max_slots,
  COUNT(fa.id) FILTER (WHERE fa.status = 'active') as active_count,
  COUNT(fa.id) FILTER (WHERE fa.status = 'pending') as pending_count,
  s.homepage_max - COUNT(fa.id) FILTER (WHERE fa.status IN ('active', 'pending')) as available_slots
FROM categories c
CROSS JOIN settings s
LEFT JOIN featured_ads fa ON fa.category_id = c.id 
  AND fa.placement = 'homepage' 
  AND fa.status IN ('active', 'pending')
WHERE c.is_active = true  -- Solo categorías activas
GROUP BY c.id, c.name, c.slug, s.homepage_max

UNION ALL

SELECT 
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  'results' as placement,
  s.results_max as max_slots,
  COUNT(fa.id) FILTER (WHERE fa.status = 'active') as active_count,
  COUNT(fa.id) FILTER (WHERE fa.status = 'pending') as pending_count,
  s.results_max - COUNT(fa.id) FILTER (WHERE fa.status IN ('active', 'pending')) as available_slots
FROM categories c
CROSS JOIN settings s
LEFT JOIN featured_ads fa ON fa.category_id = c.id 
  AND fa.placement = 'results' 
  AND fa.status IN ('active', 'pending')
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug, s.results_max;

-- ============================================================================
-- 8. FUNCIÓN: Verificar disponibilidad para una fecha
-- ============================================================================
CREATE OR REPLACE FUNCTION check_featured_availability(
  p_placement VARCHAR(20),
  p_category_id UUID,
  p_start_date DATE,
  p_duration_days INT DEFAULT 15
)
RETURNS TABLE (
  is_available BOOLEAN,
  slots_total INT,
  slots_used INT,
  slots_available INT,
  next_available_date DATE
) AS $$
DECLARE
  v_max_slots INT;
  v_end_date DATE;
  v_used_slots INT;
  v_next_date DATE;
BEGIN
  -- Obtener máximo de slots según placement
  SELECT (value #>> '{}')::INT INTO v_max_slots
  FROM global_settings 
  WHERE key = 'featured_slots_' || p_placement;
  
  IF v_max_slots IS NULL THEN
    v_max_slots := 10; -- Default
  END IF;
  
  v_end_date := p_start_date + p_duration_days;
  
  -- Contar destacados que se solapan con el período solicitado
  SELECT COUNT(DISTINCT user_id) INTO v_used_slots
  FROM featured_ads
  WHERE placement = p_placement
    AND category_id = p_category_id
    AND status IN ('active', 'pending')
    AND (
      (scheduled_start <= p_start_date AND COALESCE(expires_at::date, scheduled_start + duration_days) > p_start_date)
      OR (scheduled_start >= p_start_date AND scheduled_start < v_end_date)
    );
  
  -- Si no hay lugar, buscar próxima fecha disponible
  IF v_used_slots >= v_max_slots THEN
    SELECT MIN(COALESCE(expires_at::date, scheduled_start + duration_days)) INTO v_next_date
    FROM featured_ads
    WHERE placement = p_placement
      AND category_id = p_category_id
      AND status IN ('active', 'pending')
      AND COALESCE(expires_at::date, scheduled_start + duration_days) > CURRENT_DATE;
  END IF;
  
  RETURN QUERY SELECT 
    (v_used_slots < v_max_slots) as is_available,
    v_max_slots as slots_total,
    v_used_slots as slots_used,
    (v_max_slots - v_used_slots) as slots_available,
    COALESCE(v_next_date, p_start_date) as next_available_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. FUNCIÓN: Crear destacado (con validaciones)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_featured_ad(
  p_ad_id UUID,
  p_user_id UUID,
  p_placement VARCHAR(20),
  p_scheduled_start DATE
)
RETURNS TABLE (
  success BOOLEAN,
  featured_id UUID,
  error_message TEXT
) AS $$
DECLARE
  v_category_id UUID;
  v_ad_user_id UUID;
  v_credits_available INT;
  v_is_available BOOLEAN;
  v_duration INT;
  v_new_id UUID;
BEGIN
  -- 1. Verificar que el aviso existe y pertenece al usuario
  SELECT category_id, user_id INTO v_category_id, v_ad_user_id
  FROM ads WHERE id = p_ad_id;
  
  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Aviso no encontrado';
    RETURN;
  END IF;
  
  IF v_ad_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No sos el dueño de este aviso';
    RETURN;
  END IF;
  
  -- 2. Verificar créditos disponibles
  SELECT (credits_total - credits_used) INTO v_credits_available
  FROM user_featured_credits WHERE user_id = p_user_id;
  
  IF COALESCE(v_credits_available, 0) <= 0 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No tenés créditos disponibles';
    RETURN;
  END IF;
  
  -- 3. Verificar que no tenga otro destacado activo en ese placement
  IF EXISTS (
    SELECT 1 FROM featured_ads 
    WHERE user_id = p_user_id 
      AND placement = p_placement 
      AND status IN ('pending', 'active')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Ya tenés un aviso destacado en esta ubicación';
    RETURN;
  END IF;
  
  -- 4. Obtener duración de settings
  SELECT (value #>> '{}')::INT INTO v_duration
  FROM global_settings WHERE key = 'featured_duration_days';
  v_duration := COALESCE(v_duration, 15);
  
  -- 5. Verificar disponibilidad
  SELECT fa.is_available INTO v_is_available
  FROM check_featured_availability(p_placement, v_category_id, p_scheduled_start, v_duration) fa;
  
  IF NOT v_is_available THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No hay lugares disponibles para esa fecha';
    RETURN;
  END IF;
  
  -- 6. Crear el destacado
  INSERT INTO featured_ads (
    ad_id, user_id, placement, category_id, 
    scheduled_start, duration_days, status, priority
  ) VALUES (
    p_ad_id, p_user_id, p_placement, v_category_id,
    p_scheduled_start, v_duration, 'pending', EXTRACT(EPOCH FROM NOW())::INT
  ) RETURNING id INTO v_new_id;
  
  -- 7. Consumir crédito
  UPDATE user_featured_credits 
  SET credits_used = credits_used + 1
  WHERE user_id = p_user_id;
  
  UPDATE featured_ads SET credit_consumed = TRUE WHERE id = v_new_id;
  
  RETURN QUERY SELECT TRUE, v_new_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. FUNCIÓN: Activar destacados pendientes (para CRON)
-- ============================================================================
CREATE OR REPLACE FUNCTION activate_pending_featured_ads()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_duration INT;
BEGIN
  -- Obtener duración
  SELECT (value #>> '{}')::INT INTO v_duration
  FROM global_settings WHERE key = 'featured_duration_days';
  v_duration := COALESCE(v_duration, 15);
  
  -- Activar los que su fecha de inicio llegó
  UPDATE featured_ads
  SET 
    status = 'active',
    actual_start = NOW(),
    expires_at = NOW() + (duration_days || ' days')::INTERVAL
  WHERE status = 'pending'
    AND scheduled_start <= CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Expirar los que ya pasaron su fecha
  UPDATE featured_ads
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. FUNCIÓN: Obtener destacados para Homepage (FIFO, 1 por usuario)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_featured_for_homepage(
  p_category_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  ad_id UUID,
  user_id UUID,
  featured_id UUID,
  priority INT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      fa.priority,
      ROW_NUMBER() OVER (PARTITION BY fa.user_id ORDER BY fa.created_at ASC) as rn
    FROM featured_ads fa
    WHERE fa.placement = 'homepage'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
  )
  SELECT r.ad_id, r.user_id, r.featured_id, r.priority
  FROM ranked r
  WHERE r.rn = 1  -- Solo el más antiguo por usuario
  ORDER BY r.priority ASC  -- FIFO
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. FUNCIÓN: Obtener destacados para Resultados (FIFO, 1 por usuario, rotan)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_featured_for_results(
  p_category_id UUID,
  p_limit INT DEFAULT 4,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  ad_id UUID,
  user_id UUID,
  featured_id UUID
) AS $$
BEGIN
  RETURN QUERY
  WITH unique_users AS (
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      fa.created_at
    FROM featured_ads fa
    WHERE fa.placement = 'results'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
    ORDER BY fa.user_id, fa.created_at ASC
  )
  SELECT u.ad_id, u.user_id, u.featured_id
  FROM unique_users u
  ORDER BY u.created_at ASC  -- FIFO
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. RLS POLICIES
-- ============================================================================
ALTER TABLE user_featured_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_ads ENABLE ROW LEVEL SECURITY;

-- Créditos: usuario ve los suyos
CREATE POLICY "Users can view own credits" ON user_featured_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Créditos: solo sistema/admin puede modificar
CREATE POLICY "System can manage credits" ON user_featured_credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Featured Ads: usuario ve los suyos
CREATE POLICY "Users can view own featured ads" ON featured_ads
  FOR SELECT USING (auth.uid() = user_id);

-- Featured Ads: lectura pública de activos (para mostrar en frontend)
CREATE POLICY "Public can view active featured" ON featured_ads
  FOR SELECT USING (status = 'active');

-- Featured Ads: usuario puede crear (si tiene créditos - validado en función)
CREATE POLICY "Users can create featured ads" ON featured_ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Featured Ads: usuario puede cancelar los suyos pendientes
CREATE POLICY "Users can cancel own pending" ON featured_ads
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- ============================================================================
-- 14. DATOS DE PRUEBA (OPCIONAL - comentar en producción)
-- ============================================================================
-- Para testing: dar créditos a un usuario
-- INSERT INTO user_featured_credits (user_id, credits_total, credits_used)
-- SELECT id, 5, 0 FROM users WHERE email = 'test@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET credits_total = 5;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT * FROM featured_slots_availability;
-- SELECT * FROM check_featured_availability('homepage', 'category-uuid-here', CURRENT_DATE);
-- SELECT * FROM global_settings WHERE category = 'featured';
