# Sprint 5C — Sistema de Precio con Unidades

> **Fecha:** 2026-03-08
> **Estado:** ✅ COMPLETADO (código + DB DEV aplicado)
> **Objetivo:** Reemplazar "A convenir" por precios obligatorios + unidad contextual por template

---

## Decisiones de diseño (confirmadas con el usuario)

| Decisión | Respuesta |
|---|---|
| ¿Eliminar `price_negotiable` de DB? | NO — mantener columna para avisos legacy |
| ¿Quién define las unidades? | Admin, via option_lists asignadas al template |
| ¿Mostrar precio calculado por cabeza? | NO |

---

## Arquitectura

### DB — Nuevas columnas

```sql
ALTER TABLE ads ADD COLUMN price_unit varchar(30);
-- ej: 'hora', 'ha', 'cabeza', 'kg-vivo', 'litro', NULL = precio total
```

```sql
ALTER TABLE form_templates_v2 ADD COLUMN price_config jsonb;
-- { "required": true, "units_list": "unidades-precio-servicios" }
-- units_list = nombre de option_list. NULL o ausente = sin selector de unidad
```

### Option Lists creadas

| Lista | Ítems |
|---|---|
| `unidades-precio-servicios` | hora, ha, km, mes, viaje, unidad |
| `unidades-precio-hacienda` | cabeza, kg-vivo, kg-gancho, lote |
| `unidades-precio-insumos` | kg, litro, bolsa, dosis, unidad |

### price_config por template

| Template | price_config |
|---|---|
| ganaderia_servicios, maquinaria_servicios, agricultura_servicios | `{"required":true, "units_list":"unidades-precio-servicios"}` |
| ganaderia_hacienda | `{"required":true, "units_list":"unidades-precio-hacienda"}` |
| ganaderia_insumos, agricultura_insumos | `{"required":true, "units_list":"unidades-precio-insumos"}` |
| maquinaria_maquinarias, maquinaria_empresas | `{"required":true}` (precio total, sin unidad) |

---

## Frontend

### PublicarAviso — step "información"
- Price input + unit selector inline (si `price_config.units_list` existe)
- Price es required siempre
- Quitar toggle "A convenir" / `price_negotiable` de la UI (no de DB)
- `price_unit` se guarda junto con `price` en el payload del aviso

### AdDetail — segmento 1
- Mostrar: `$12.000 / hora` o `$12.000` (sin unidad si `price_unit` es null)

---

## Archivos tocados

| Archivo | Cambio |
|---|---|
| `supabase/migrations/20260308000011_sprint5c_price_units.sql` | Migración principal |
| `frontend/src/types/v2.ts` | Agregar `price_config` a `CompleteFormV2` |
| `frontend/src/components/pages/PublicarAviso.tsx` | UI precio + unidad |
| `frontend/src/components/pages/AdDetail.tsx` | Display precio con unidad |

---

## Estado

- [x] Migración SQL aplicada en DEV
- [x] Tipos actualizados
- [x] PublicarAviso actualizado
- [x] AdDetail actualizado
