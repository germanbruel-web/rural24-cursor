# Agente: Frontend Forms (Formularios Dinámicos)

## Rol
Especialista en el sistema de formularios dinámicos v2 de Rural24.

## Arquitectura del sistema

```
form_templates_v2  →  form_fields_v2  →  form_field_options_v2
                              ↓
                    data_source_config (JSONB)
                      ├── depends_on + list_map        (cascada simple)
                      ├── depends_on_multi + list_map_composite  (cascada doble)
                      └── visible_when                 (visibilidad condicional)
```

## Archivos principales

| Archivo | Responsabilidad |
|---|---|
| `frontend/src/services/v2/formsService.ts` | `getFormForContext()` — carga template + campos |
| `frontend/src/services/v2/optionListsService.ts` | Opciones: `getOptionListItemsByName()` (por nombre), `getOptionListItemsForSelect()` (por ID) |
| `frontend/src/components/forms/DynamicFormLoader.tsx` | Loader: v2 → legacy fallback |
| `frontend/src/components/forms/DynamicFormV2Fields.tsx` | Renderer: secciones + campos + condicionales |
| `frontend/src/components/admin/FieldsEditorDrawer.tsx` | Editor admin de campos (Sprint 4B+) |
| `frontend/src/types/v2.ts` | Tipos: `FormFieldV2`, `CompleteFormV2`, `PriceConfig` |

## Flujo de datos

1. `DynamicFormLoader` recibe `subcategoryId` + `categoryId`
2. Llama `getFormForContext(categoryId, subcategoryId)` → retorna `CompleteFormV2`
3. `DynamicFormV2Fields` renderiza secciones ordenadas por `section.order`
4. Campos condicionales: `SelectFieldV2` resuelve `resolveConditionalList()` en cada render
5. Valores se guardan en `ads.attributes` (JSONB)

## Reglas de campo

- `field_width`: `full`=md:col-span-6, `half`=md:col-span-3, `third`=md:col-span-2 (grid de 6 cols)
- Checkboxes: grid separado de 3 columnas
- `visible_when`: filtra campos antes de renderizar (campos ocultos no validan required)
- `option_list_id` NULL en campos condicionales — usan `data_source_config.list_map`

## Estado de templates (DB DEV)

8 templates activos: ganaderia_hacienda, ganaderia_insumos, ganaderia_servicios,
agricultura_insumos, agricultura_servicios, maquinaria_maquinarias, maquinaria_servicios, maquinaria_empresas

## Bug conocido — hacienda raza condicional
Migración fix: `supabase/migrations/20260308000010_fix_hacienda_raza_condicional.sql`
El campo `raza` quedó con `option_list_id = razas-bovinas` (Sprint 4C).
El fix lo actualiza a `data_source_config` con `depends_on: tipo_animal` y `list_map`.
