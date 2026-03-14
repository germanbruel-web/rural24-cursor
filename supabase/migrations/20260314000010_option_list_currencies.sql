-- Sprint 8C — option_list: monedas de precio
-- Crea la lista 'price-currencies' e inserta ARS/USD/EUR

INSERT INTO public.option_lists (name, display_name, scope, description)
VALUES ('price-currencies', 'Monedas', 'global', 'Monedas disponibles para el precio del aviso')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.option_list_items (list_id, value, label, sort_order, is_active)
SELECT ol.id, v.value, v.label, v.sort_order, v.is_active
FROM public.option_lists ol,
  (VALUES
    ('ARS', 'ARS $',   1, true),
    ('USD', 'USD u$s', 2, true),
    ('EUR', 'EUR €',   3, false)
  ) AS v(value, label, sort_order, is_active)
WHERE ol.name = 'price-currencies'
ON CONFLICT DO NOTHING;
