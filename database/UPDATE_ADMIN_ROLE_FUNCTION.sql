-- ============================================
-- UPDATE: Función is_admin_role() - Remover 'adminscrap'
-- Fecha: 2026-02-05
-- ============================================

-- Actualizar la función para que solo incluya 'superadmin' y 'admin'
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Solo SuperAdmin y Admin (Revendedores) tienen acceso administrativo
  RETURN user_role IN ('superadmin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verificar la función actualizada
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin_role';
