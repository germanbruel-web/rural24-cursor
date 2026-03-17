-- Asignar seed demo ads al superadmin para que aparezcan en Mis Avisos
UPDATE public.ads
SET user_id = 'fadd0359-ae43-4cad-9612-cbd639583196'
WHERE short_id LIKE 'DMA%'
   OR short_id LIKE 'DMH%'
   OR short_id LIKE 'DMR%'
   OR short_id LIKE 'DMI%'
   OR short_id LIKE 'DMS%'
   OR short_id LIKE 'DME%';
