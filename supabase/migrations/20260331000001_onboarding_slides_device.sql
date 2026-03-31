-- Migration: agregar target_device a onboarding_slides
-- Permite segmentar slides por dispositivo: desktop, mobile, both

ALTER TABLE public.onboarding_slides
  ADD COLUMN IF NOT EXISTS target_device text NOT NULL DEFAULT 'both'
  CHECK (target_device IN ('desktop', 'mobile', 'both'));

COMMENT ON COLUMN public.onboarding_slides.target_device IS
  'desktop = solo carrusel desktop | mobile = solo intro full-screen mobile | both = ambos';
