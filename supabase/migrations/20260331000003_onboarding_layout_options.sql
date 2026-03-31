-- Layout options por slide: color de fondo + modo de imagen
ALTER TABLE public.onboarding_slides
  ADD COLUMN IF NOT EXISTS bg_color text NOT NULL DEFAULT '#14532d',
  ADD COLUMN IF NOT EXISTS image_fit text NOT NULL DEFAULT 'cover'
    CHECK (image_fit IN ('cover', 'contain'));
