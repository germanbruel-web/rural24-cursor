-- =====================================================
-- APROBAR AVISOS EXISTENTES (PENDING → APPROVED)
-- =====================================================

-- Ver cuántos avisos están pendientes
SELECT 
  COUNT(*) as total_pending,
  user_id
FROM public.ads
WHERE approval_status = 'pending'
GROUP BY user_id;

-- EJECUTAR ESTO: Aprobar todos tus avisos pendientes
UPDATE public.ads
SET 
  approval_status = 'approved',
  status = 'active',
  updated_at = NOW()
WHERE approval_status = 'pending'
  AND user_id = auth.uid(); -- Solo aprueba TUS avisos

-- Verificar resultado
SELECT 
  id,
  title,
  approval_status,
  status,
  created_at
FROM public.ads
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
