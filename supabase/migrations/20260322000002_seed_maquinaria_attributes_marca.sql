-- DEV ONLY: Enriquecer ads de maquinaria-agricola con marca extraída del título
-- Los seeds originales solo tenían {ano, estado} sin marca ni modelo

UPDATE public.ads
SET attributes = attributes || jsonb_build_object(
  'marca', CASE
    WHEN title ILIKE 'John Deere%'      THEN 'John Deere'
    WHEN title ILIKE 'Case IH%'         THEN 'Case IH'
    WHEN title ILIKE 'New Holland%'     THEN 'New Holland'
    WHEN title ILIKE 'Massey Ferguson%' THEN 'Massey Ferguson'
    WHEN title ILIKE 'Claas%'           THEN 'Claas'
    WHEN title ILIKE 'Same %'           THEN 'Same'
    WHEN title ILIKE 'Deutz-Fahr%'      THEN 'Deutz-Fahr'
    WHEN title ILIKE 'Fendt%'           THEN 'Fendt'
    WHEN title ILIKE 'Ford %'           THEN 'Ford'
    WHEN title ILIKE 'Fiat %'           THEN 'Fiat'
    WHEN title ILIKE 'Oxbo%'            THEN 'Oxbo'
    WHEN title ILIKE 'Grosspal%'        THEN 'Grosspal'
    WHEN title ILIKE 'Mainero%'         THEN 'Mainero'
    WHEN title ILIKE 'Geringhoff%'      THEN 'Geringhoff'
    WHEN title ILIKE 'MacDon%'          THEN 'MacDon'
    WHEN title ILIKE 'AGCO%'            THEN 'AGCO'
    WHEN title ILIKE '%Kubota%'         THEN 'Kubota'
    WHEN title ILIKE '%Farmtrac%'       THEN 'Farmtrac'
    WHEN title ILIKE '%Sigma%'          THEN 'Sigma'
    WHEN title ILIKE 'Draper%'          THEN 'Draper'
    WHEN title ILIKE 'Acoplado%volca%'  THEN 'Mainero'
    WHEN title ILIKE 'Acoplado%tolva%'  THEN 'Grosspal'
  END
)
WHERE category_id IN (
  SELECT id FROM public.categories WHERE slug = 'maquinaria-agricola'
)
AND NOT (attributes ? 'marca')
AND title ~* '(John Deere|Case IH|New Holland|Massey Ferguson|Claas|Same |Deutz-Fahr|Fendt|Ford |Fiat |Oxbo|Grosspal|Mainero|Geringhoff|MacDon|AGCO|Kubota|Farmtrac|Sigma|Draper)';

-- Eliminar entradas null (ads que no matchearon ninguna marca)
UPDATE public.ads
SET attributes = attributes - 'marca'
WHERE category_id IN (
  SELECT id FROM public.categories WHERE slug = 'maquinaria-agricola'
)
AND (attributes->>'marca') IS NULL
AND attributes ? 'marca';
