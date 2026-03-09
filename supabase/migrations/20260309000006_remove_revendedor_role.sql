-- ============================================================
-- Eliminar rol 'revendedor' del sistema
-- ============================================================
-- Decisión: el rol revendedor ya no aplica al modelo de negocio.
-- Solo existen: free | premium | superadmin
-- Los usuarios con role='revendedor' pasan a role='free'.
-- ============================================================

-- Convertir usuarios revendedor → free
UPDATE public.users
  SET role = 'free'
  WHERE role = 'revendedor';

-- Verificar resultado
DO $$
DECLARE
  cnt integer;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.users WHERE role = 'revendedor';
  IF cnt > 0 THEN
    RAISE WARNING '⚠️  Aún quedan % usuarios con role=revendedor', cnt;
  ELSE
    RAISE NOTICE '✅ Todos los usuarios revendedor migrados a free';
  END IF;
END $$;

-- Nota: el CHECK CONSTRAINT en users.role (si existe) puede necesitar
-- actualizarse si restringe el dominio de valores.
-- Verificar con: \d public.users
