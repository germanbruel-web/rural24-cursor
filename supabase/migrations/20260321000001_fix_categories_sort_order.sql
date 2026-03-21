-- ================================================================
-- Fix: sort_order de categorías según orden de producto
-- Fecha: 2026-03-21
-- Orden deseado:
--   1. Maquinaria Agrícola
--   2. Hacienda
--   3. Insumos
--   4. Inmobiliaria Rural
--   5. Servicios
--   6. Equipamiento
--   7. Repuestos
--   8. Empleos
-- ================================================================

UPDATE public.categories SET sort_order = 1 WHERE slug = 'maquinaria-agricola';
UPDATE public.categories SET sort_order = 2 WHERE slug = 'hacienda';
UPDATE public.categories SET sort_order = 3 WHERE slug = 'insumos';
UPDATE public.categories SET sort_order = 4 WHERE slug = 'inmobiliaria-rural';
UPDATE public.categories SET sort_order = 5 WHERE slug = 'servicios';
UPDATE public.categories SET sort_order = 6 WHERE slug = 'equipamiento';
UPDATE public.categories SET sort_order = 7 WHERE slug = 'repuestos';
UPDATE public.categories SET sort_order = 8 WHERE slug = 'empleos';
