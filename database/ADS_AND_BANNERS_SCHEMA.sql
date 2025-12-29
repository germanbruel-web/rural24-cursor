-- ============================================
-- SCHEMA PARA SISTEMA DE AVISOS Y BANNERS
-- ============================================

-- 1. TABLA: ads (Avisos de usuarios premium)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  location VARCHAR(100),
  province VARCHAR(100),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  images TEXT[], -- Array de URLs de imágenes
  tags TEXT[], -- Array de tags
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Fecha de expiración del aviso
  views_count INTEGER DEFAULT 0,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para ads
CREATE INDEX idx_ads_user_id ON public.ads(user_id);
CREATE INDEX idx_ads_status ON public.ads(status);
CREATE INDEX idx_ads_category ON public.ads(category);
CREATE INDEX idx_ads_province ON public.ads(province);
CREATE INDEX idx_ads_created_at ON public.ads(created_at DESC);

-- Trigger para actualizar updated_at en ads
CREATE OR REPLACE FUNCTION update_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ads_updated_at_trigger
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION update_ads_updated_at();

-- RLS Policies para ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver avisos activos
CREATE POLICY ads_select_active ON public.ads
  FOR SELECT
  USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));

-- Usuarios pueden ver sus propios avisos (cualquier estado)
CREATE POLICY ads_select_own ON public.ads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Solo usuarios premium pueden crear avisos
CREATE POLICY ads_insert_premium ON public.ads
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('premium-particular', 'premium-empresa', 'super-admin')
    )
  );

-- Solo el propietario puede actualizar sus avisos
CREATE POLICY ads_update_own ON public.ads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Solo el propietario puede eliminar sus avisos
CREATE POLICY ads_delete_own ON public.ads
  FOR DELETE
  USING (auth.uid() = user_id);

-- SuperAdmin puede ver/editar/eliminar todos los avisos
CREATE POLICY ads_superadmin_all ON public.ads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );


-- ============================================
-- 2. TABLA: scraped_ads (Avisos scrapeados - Solo SuperAdmin)
-- ============================================
CREATE TABLE IF NOT EXISTS public.scraped_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  location VARCHAR(100),
  province VARCHAR(100),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  source_url TEXT NOT NULL, -- URL del sitio scrapeado
  scraping_source VARCHAR(100), -- Nombre de la fuente (mercadolibre, agrofy, etc.)
  image_urls TEXT[], -- Array de URLs de imágenes
  tags TEXT[],
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para scraped_ads
CREATE INDEX idx_scraped_ads_status ON public.scraped_ads(approval_status);
CREATE INDEX idx_scraped_ads_category ON public.scraped_ads(category);
CREATE INDEX idx_scraped_ads_source ON public.scraped_ads(scraping_source);
CREATE INDEX idx_scraped_ads_created_at ON public.scraped_ads(created_at DESC);

-- Trigger para actualizar updated_at en scraped_ads
CREATE TRIGGER scraped_ads_updated_at_trigger
BEFORE UPDATE ON public.scraped_ads
FOR EACH ROW
EXECUTE FUNCTION update_ads_updated_at();

-- RLS Policies para scraped_ads
ALTER TABLE public.scraped_ads ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver avisos aprobados
CREATE POLICY scraped_ads_select_approved ON public.scraped_ads
  FOR SELECT
  USING (approval_status = 'approved');

-- Solo SuperAdmin puede hacer todo
CREATE POLICY scraped_ads_superadmin_all ON public.scraped_ads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );


-- ============================================
-- 3. TABLA: banners (Banners publicitarios - Solo SuperAdmin)
-- ============================================
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  banner_type VARCHAR(50) NOT NULL CHECK (banner_type IN ('fullwidth', 'halfwidth', 'sidebar', 'sponsored-premium')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Mayor prioridad = se muestra primero
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Índices para banners
CREATE INDEX idx_banners_type ON public.banners(banner_type);
CREATE INDEX idx_banners_active ON public.banners(is_active);
CREATE INDEX idx_banners_dates ON public.banners(start_date, end_date);
CREATE INDEX idx_banners_priority ON public.banners(priority DESC);

-- Trigger para actualizar updated_at en banners
CREATE TRIGGER banners_updated_at_trigger
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION update_ads_updated_at();

-- RLS Policies para banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver banners activos vigentes
CREATE POLICY banners_select_active ON public.banners
  FOR SELECT
  USING (
    is_active = true 
    AND start_date <= NOW() 
    AND end_date >= NOW()
  );

-- Solo SuperAdmin puede crear/editar/eliminar banners
CREATE POLICY banners_superadmin_all ON public.banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );


-- ============================================
-- 4. FUNCIÓN: Validar límite de avisos según plan
-- ============================================
CREATE OR REPLACE FUNCTION check_ad_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_role VARCHAR(50);
  current_ads_count INTEGER;
  max_ads INTEGER;
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO user_role
  FROM public.users
  WHERE id = NEW.user_id;

  -- Definir límites según rol
  max_ads := CASE user_role
    WHEN 'free' THEN 0
    WHEN 'premium-particular' THEN 10
    WHEN 'premium-empresa' THEN 50
    WHEN 'super-admin' THEN 999999
    ELSE 0
  END;

  -- Contar avisos activos del usuario
  SELECT COUNT(*) INTO current_ads_count
  FROM public.ads
  WHERE user_id = NEW.user_id
    AND status IN ('active', 'paused');

  -- Validar límite
  IF current_ads_count >= max_ads THEN
    RAISE EXCEPTION 'Límite de avisos alcanzado. Tu plan permite % avisos activos.', max_ads;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar límite al crear aviso
CREATE TRIGGER ads_limit_trigger
BEFORE INSERT ON public.ads
FOR EACH ROW
EXECUTE FUNCTION check_ad_limit();


-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL - BORRAR EN PRODUCCIÓN)
-- ============================================

-- Insertar banner de ejemplo (requiere un SuperAdmin en users)
-- INSERT INTO public.banners (title, image_url, link_url, banner_type, start_date, end_date, created_by)
-- VALUES (
--   'Banner Promocional',
--   'https://picsum.photos/1200/300',
--   'https://agrobuscador.com/promo',
--   'fullwidth',
--   NOW(),
--   NOW() + INTERVAL '30 days',
--   (SELECT id FROM public.users WHERE role = 'super-admin' LIMIT 1)
-- );
