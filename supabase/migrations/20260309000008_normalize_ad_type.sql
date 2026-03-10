-- ============================================================
-- Normalizar ad_type: 'empresa' → 'company', 'product' → 'particular'
-- ============================================================
-- Situación encontrada en DEV:
--   19 ads con ad_type='empresa'   → deben ser 'company'
--    9 ads con ad_type='product'   → deben ser 'particular'
-- ============================================================

UPDATE ads SET ad_type = 'company'    WHERE ad_type = 'empresa';
UPDATE ads SET ad_type = 'particular' WHERE ad_type = 'product';

-- Verificación:
-- SELECT ad_type, COUNT(*) FROM ads GROUP BY ad_type ORDER BY ad_type;
