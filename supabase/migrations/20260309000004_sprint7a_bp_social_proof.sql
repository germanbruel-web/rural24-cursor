-- ============================================================
-- Sprint 7A: business_profiles — campos Social Proof
-- ============================================================
-- Estos campos permiten que la Fanpage de un contratista/empresa
-- muestre información de reputación y capacidades sin depender
-- de parsear el JSONB de los avisos.
-- ============================================================

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS anos_experiencia    integer            CHECK (anos_experiencia >= 0 AND anos_experiencia <= 100),
  ADD COLUMN IF NOT EXISTS area_cobertura      varchar(20)        CHECK (area_cobertura IN ('local','regional','nacional')),
  ADD COLUMN IF NOT EXISTS superficie_maxima   integer            CHECK (superficie_maxima >= 0),
  ADD COLUMN IF NOT EXISTS cultivos_json       jsonb              DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS equipamiento_propio boolean            DEFAULT false,
  ADD COLUMN IF NOT EXISTS aplica_precision    boolean            DEFAULT false,
  ADD COLUMN IF NOT EXISTS usa_drones          boolean            DEFAULT false,
  ADD COLUMN IF NOT EXISTS factura             boolean            DEFAULT false;

COMMENT ON COLUMN public.business_profiles.anos_experiencia  IS 'Años de experiencia en el rubro (0-100)';
COMMENT ON COLUMN public.business_profiles.area_cobertura    IS 'Alcance geográfico: local | regional | nacional';
COMMENT ON COLUMN public.business_profiles.superficie_maxima IS 'Superficie máxima de trabajo por campaña (ha)';
COMMENT ON COLUMN public.business_profiles.cultivos_json     IS 'Array de cultivos: ["soja","maiz","trigo",...]';
COMMENT ON COLUMN public.business_profiles.equipamiento_propio IS 'true = el contratista tiene equipo propio';
COMMENT ON COLUMN public.business_profiles.aplica_precision  IS 'true = trabaja con agricultura de precisión';
COMMENT ON COLUMN public.business_profiles.usa_drones        IS 'true = utiliza drones en sus servicios';
COMMENT ON COLUMN public.business_profiles.factura           IS 'true = emite factura (A o C)';
