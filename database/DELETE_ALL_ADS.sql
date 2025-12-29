-- =====================================================
-- ELIMINAR TODOS LOS AVISOS
-- =====================================================

-- Ver cuántos avisos hay
SELECT COUNT(*) as total_ads FROM public.ads;

-- EJECUTAR: Eliminar TODOS los avisos
DELETE FROM public.ads;

-- Verificar que se eliminaron
SELECT COUNT(*) as total_ads FROM public.ads;
