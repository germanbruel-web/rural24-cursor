-- Migración: eliminar CHECK constraint en home_sections.type
-- El admin ya controla los tipos válidos en el frontend (HomeSectionBuilder).
-- El constraint requería una migración nueva por cada tipo agregado — eliminarlo
-- simplifica el ciclo de desarrollo sin riesgo real (la DB no valida tipos de sección).

ALTER TABLE public.home_sections
  DROP CONSTRAINT IF EXISTS home_sections_type_check;
