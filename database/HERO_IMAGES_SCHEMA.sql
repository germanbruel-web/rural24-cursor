-- ================================================
-- TABLA PARA IMÁGENES DEL HERO (FONDO ROTATIVO)
-- ================================================

-- Crear tabla hero_images
CREATE TABLE IF NOT EXISTS public.hero_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  fade_duration INTEGER DEFAULT 5000, -- milisegundos que permanece cada imagen
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hero_images_active ON public.hero_images(is_active);
CREATE INDEX IF NOT EXISTS idx_hero_images_order ON public.hero_images(display_order);

-- RLS Policies
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden VER imágenes activas
CREATE POLICY "Anyone can view active hero images"
ON public.hero_images FOR SELECT
USING (is_active = true);

-- Policy: SuperAdmin puede hacer TODO
CREATE POLICY "SuperAdmin full access to hero images"
ON public.hero_images FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'super-admin'
  )
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_hero_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_hero_images_updated_at ON public.hero_images;
CREATE TRIGGER set_hero_images_updated_at
  BEFORE UPDATE ON public.hero_images
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_images_updated_at();

-- Insertar imagen inicial (la que proporcionaste)
INSERT INTO public.hero_images (image_url, alt_text, display_order, is_active, fade_duration)
VALUES (
  'https://www.expoagro.com.ar/wp-content/uploads/Cosechando-informacion-para-la-proxima-campana-de-trigo.jpeg',
  'Campo agrícola - Cosecha de trigo',
  1,
  true,
  5000
)
ON CONFLICT DO NOTHING;

-- Verificar
SELECT * FROM public.hero_images ORDER BY display_order;
