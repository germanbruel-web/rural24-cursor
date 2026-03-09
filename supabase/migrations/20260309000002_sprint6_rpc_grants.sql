-- ============================================================
-- Sprint 6 — Fix: GRANT EXECUTE en RPCs de empresas
-- ============================================================
-- Sin estos grants, anon/authenticated no pueden ejecutar las
-- funciones y getCompanyPublicPage retorna null → "Empresa no encontrada"
-- ============================================================

-- Página pública (anon puede verla sin login)
GRANT EXECUTE ON FUNCTION public.get_company_public_page(varchar)
  TO anon, authenticated;

-- Mis empresas (solo authenticated)
GRANT EXECUTE ON FUNCTION public.get_my_companies(uuid)
  TO authenticated;
