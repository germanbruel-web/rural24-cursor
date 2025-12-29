-- ================================================
-- TABLA: sources (Fuentes de scraping)
-- ================================================

CREATE TABLE IF NOT EXISTS public.sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  url TEXT NOT NULL,
  base_url TEXT NOT NULL,
  scraper_type VARCHAR(100) NOT NULL, -- 'mercadolibre', 'agroad', 'deremate', etc.
  is_active BOOLEAN DEFAULT true,
  scraping_interval INTEGER DEFAULT 3600, -- segundos entre scrapings (default: 1 hora)
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  total_listings_scraped INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 100.00,
  config JSONB DEFAULT '{}'::jsonb, -- configuración específica del scraper
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_sources_active ON public.sources(is_active);
CREATE INDEX IF NOT EXISTS idx_sources_type ON public.sources(scraper_type);
CREATE INDEX IF NOT EXISTS idx_sources_last_scraped ON public.sources(last_scraped_at);

-- RLS Policies
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si ya existen
DROP POLICY IF EXISTS "Anyone can view active sources" ON public.sources;
DROP POLICY IF EXISTS "Superadmin can manage sources" ON public.sources;

-- Policy: Todos pueden VER fuentes activas
CREATE POLICY "Anyone can view active sources"
ON public.sources FOR SELECT
USING (is_active = true);

-- Policy: Solo SuperAdmin puede gestionar fuentes
CREATE POLICY "Superadmin can manage sources"
ON public.sources FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'superadmin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'superadmin'
  )
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_sources_updated_at ON public.sources;
CREATE TRIGGER set_sources_updated_at
  BEFORE UPDATE ON public.sources
  FOR EACH ROW
  EXECUTE FUNCTION update_sources_updated_at();

-- Insertar fuentes iniciales
INSERT INTO public.sources (name, url, base_url, scraper_type, is_active, scraping_interval, config)
VALUES
  (
    'MercadoLibre Maquinaria Agrícola',
    'https://www.mercadolibre.com.ar/c/agro',
    'https://www.mercadolibre.com.ar',
    'mercadolibre',
    true,
    3600,
    '{"category": "agro", "max_pages": 5}'::jsonb
  ),
  (
    'AgroAd',
    'https://agroad.com.ar/avisos',
    'https://agroad.com.ar',
    'agroad',
    true,
    7200,
    '{"max_pages": 3}'::jsonb
  ),
  (
    'DeRemate',
    'https://www.deremate.com.ar/agro',
    'https://www.deremate.com.ar',
    'deremate',
    true,
    7200,
    '{"categories": ["maquinaria", "tractores", "cosechadoras"]}'::jsonb
  )
ON CONFLICT (name) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE public.sources IS 'Fuentes de scraping para clasificados rurales';
COMMENT ON COLUMN public.sources.scraper_type IS 'Tipo de scraper a utilizar (mercadolibre, agroad, deremate, etc.)';
COMMENT ON COLUMN public.sources.config IS 'Configuración JSON específica del scraper';
COMMENT ON COLUMN public.sources.success_rate IS 'Porcentaje de éxito del scraper (0-100)';
