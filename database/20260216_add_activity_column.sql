-- ============================================================
-- Agregar columna 'activity' a tabla users
-- Representa la actividad/rubro del usuario
-- Valores: productor, empresa, comerciante, profesional, usuario_general
-- ============================================================

-- 1. Agregar columna
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS activity VARCHAR(50) DEFAULT NULL;

-- 2. Agregar CHECK constraint
ALTER TABLE public.users
ADD CONSTRAINT chk_users_activity 
CHECK (activity IS NULL OR activity IN ('productor', 'empresa', 'comerciante', 'profesional', 'usuario_general'));

-- 3. Comentario descriptivo
COMMENT ON COLUMN public.users.activity IS 'Actividad/rubro del usuario: productor, empresa, comerciante, profesional, usuario_general';

-- 4. Índice para analytics futuro
CREATE INDEX IF NOT EXISTS idx_users_activity ON public.users(activity) WHERE activity IS NOT NULL;

-- ============================================================
-- ROLLBACK (si necesario):
-- DROP INDEX IF EXISTS idx_users_activity;
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_activity;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS activity;
-- ============================================================
