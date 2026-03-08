# Sprint 4D → 5B — Formularios Dinámicos + Wizard Config + Locations

> **Fecha:** 2026-03-08
> **Estado:** ✅ COMPLETADO (código + DB aplicado)
> **Commit:** `40a470f`

---

## Resumen de Sprints

| Sprint | Descripción | Estado DB |
|---|---|---|
| 4D | Formularios Maquinaria (3 templates + 5 option_lists) | ✅ Aplicado |
| 4E | Ganadería Hacienda (15 campos, razas condicionales) | ✅ Aplicado |
| 4F | wizard_configs table + WizardConfigPanel admin | ✅ Aplicado |
| Fix RLS | Políticas superadmin corregidas en 6 tablas | ✅ Aplicado |
| 5A | Provinces/Localities DB-driven (24 prov, 274 loc) | ✅ Aplicado |
| 5B | Ganadería Insumos/Servicios + Agricultura Insumos/Servicios | ✅ Aplicado |

---

## Sprint 4D — Formularios Maquinaria

### Templates creados
- `maquinaria_maquinarias` → subcategoría MAQUINARIAS (15 campos, 4 secciones)
- `maquinaria_servicios` → subcategoría SERVICIOS (3 campos, 2 secciones)
- `maquinaria_empresas` → subcategoría EMPRESAS (5 campos, 2 secciones)

### Option Lists nuevas
- `tipo-maquinaria` (23 tipos)
- `marcas-maquinaria` (17 marcas: John Deere, Case IH, New Holland, etc.)
- `tipo-traccion` (5 tipos: 2WD, 4WD, articulado, oruga)
- `servicios-maquinaria` (5 tipos)
- `tipos-empresa-maquinaria` (7 tipos)

---

## Sprint 4E — Ganadería Hacienda

### Template creado
- `ganaderia_hacienda` → subcategoría HACIENDA (15 campos, 4 secciones)

### Feature clave: razas condicionales
- Campo `raza` usa `data_source_config.list_map` para cargar opciones según `tipo_animal`
- 5 option_lists de razas: `razas-toros`, `razas-vacas`, `razas-novillos`, `razas-vaquillonas`, `razas-terneros`
- `tipo-animal-hacienda`: toros, vacas, novillos, vaquillonas, terneros, capones, mixto

### Cleanup
- Eliminado: `formulario_ganaderia_caballos` (template huérfano vinculado erróneamente a hacienda)

---

## Sprint 4F — Wizard Config

### DB: tabla `wizard_configs`
- `name` (unique), `display_name`, `category_id` (NULL = global), `steps` JSONB, `is_active`
- Config `default` seedeada con 6 steps: categoria→caracteristicas→ubicacion→fotos→informacion→revision
- Steps `categoria` y `revision` con `locked: true`

### Frontend: `WizardConfigPanel.tsx`
- Integrado en `AttributesAdmin` como tab `wizard`
- Vista: lista de configs (sidebar) + editor de steps (main)
- Permite reordenar (↑↓) y togglear visibilidad de steps no-locked
- Guarda con `updateWizardConfigSteps()` via Supabase

### Frontend: `PublicarAviso.tsx`
- Carga `getWizardConfig(selectedCategory)` al montar y cuando cambia la categoría
- Steps renderizados por `activeStepKey` (`wizardSteps[currentStep - 1]?.key`)
- Fallback a `DEFAULT_STEPS` si la DB no responde
- Validaciones y botones también usan `activeStepKey`

### Service: `wizardConfigService.ts`
- `getWizardConfig(categoryId?)` — lee config específica o default
- `getAllWizardConfigs()` — para admin
- `updateWizardConfigSteps()`, `createWizardConfig()`, `deleteWizardConfig()`
- `DEFAULT_STEPS` exportado como fallback

---

## Sprint 5A — Locations DB-driven

### DB: tablas `provinces` + `localities`
- 24 provincias (23 + CABA), ordenadas por `sort_order`
- 274 localidades, vinculadas por `province_id`
- `is_active` para toggle sin eliminar

### Service: `locationsService.ts`
- Cache en memoria (`_provinces`, `_localities` por province_id)
- `getProvinces()`, `getLocalitiesByProvince(provinceId)`
- Admin: `createLocality()`, `updateLocality()`, `deleteLocality()`, `toggleLocality()`
- `nameToSlug()` helper

### Admin: `LocationsAdmin.tsx` (280 líneas)
- Integrado en `AttributesAdmin` como tab `locations`
- Sidebar de provincias + panel de localidades
- Toggle activo/inactivo + agregar localidades nuevas

### En PublicarAviso
- Step Ubicación: `getProvinces()` al montar, `getLocalitiesByProvince()` al seleccionar provincia
- Reemplaza los arrays hardcodeados de `constants/locations.ts`

---

## Sprint 5B — Formularios Restantes

### 4 templates nuevos
- `ganaderia_insumos` → subcategoría insumos/ganadería (11 campos)
- `ganaderia_servicios` → subcategoría servicios/ganadería (9 campos)
- `agricultura_insumos` → subcategoría insumos/agricultura (12 campos)
- `agricultura_servicios` → subcategoría servicios/agricultura (11 campos)

### 7 option_lists nuevas
- `tipo-insumo-ganadero`, `tipo-servicio-ganadero`
- `cultivos-objetivo` (soja, maíz, trigo, girasol, soja+maíz, otro)
- `tipo-insumo-agricola`, `tipo-servicio-agricola`
- `unidades-cantidad` (cabezas, kg, tn, bolsas, litros, dosis, unidades)
- `area-cobertura` (local, provincial, regional, nacional)

---

## DynamicFormLoader — Actualización

- Nuevo prop `categoryId` (además de `subcategoryId`)
- Prioridad: `getFormForContext(categoryId, subcategoryId)` → legacy fallback
- Elimina el `.bak` de la versión anterior (legacy solo)

---

## Fix RLS

Todas las políticas write de superadmin corregidas de:
```sql
auth.jwt() ->> 'role' = 'superadmin'  -- ❌ no funciona
```
a:
```sql
EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin')  -- ✅ correcto
```
Tablas corregidas: `option_lists`, `option_list_items`, `form_templates_v2`, `form_fields_v2`, `form_field_options_v2`, `wizard_configs`

---

## Estado Final DB

| Tabla | Registros |
|---|---|
| form_templates_v2 | 8 templates activos |
| wizard_configs | 1 (default) |
| provinces | 24 |
| localities | 274 |
| option_lists | 24 |

---

## Pendientes / Gaps conocidos

| # | Item | Prioridad |
|---|---|---|
| 1 | WizardConfigPanel: UI para crear configs por categoría | Baja |
| 2 | ~~Razas condicionales: `DynamicFormV2Fields` debe leer `data_source_config.list_map`~~ ✅ YA IMPLEMENTADO | — |
| 3 | LocationsAdmin: importar más localidades (solo 274 de ~2000+) | Media |
| 4 | Sprint 3F: conectar RPCs featured al frontend | Media |
