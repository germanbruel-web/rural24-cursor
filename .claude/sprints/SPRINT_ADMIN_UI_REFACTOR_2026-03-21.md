# Sprint: Admin UI Refactor + CMS-A Homepage Builder
> Fecha: 2026-03-21
> Estado: ✅ Completado
> Commit: 422ba0d + commit CMS-A pendiente

---

## 1. BannersCleanPanel Refactor (Prompt #1)

**Archivo:** `frontend/src/components/admin/BannersCleanPanel.tsx`

### Cambios implementados:

| # | Mejora | Detalle |
|---|---|---|
| 1 | **Toast system** | Reemplaza todos los `alert()`. Array de toasts con auto-dismiss 4s, botón dismiss manual. `ToastContainer` inline sin deps externas. |
| 2 | **Miniatura Cloudinary** | Columna "Vista" con `<img>` usando transformación `w_100,h_50,c_fill,g_auto,f_auto`. Click abre Quick View. |
| 3 | **QuickViewModal** | Muestra todas las imágenes del banner (Desktop/Mobile/Carousel) a tamaño real + link de destino. |
| 4 | **ExpiryBadge** | `getExpiryStatus(expires_at)` → badge amber "Vence pronto" (≤7 días) o rojo "Vencido". |
| 5 | **isSaving + Loader2** | Spinner en botón Guardar durante submit. `disabled` mientras guarda. |
| 6 | **isFormValid (useMemo)** | Derivado por placement — bloquea submit si faltan campos requeridos. |
| 7 | **Hover fix** | `hover:bg-brand-600` → `hover:bg-brand-700` en Crear Banner y Guardar. |
| 8 | **Filtros responsive** | `grid-cols-3` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. |
| 9 | **TZ fix** | `toLocalDatetimeInput(utc)` ↔ `fromLocalDatetimeInput(local)` para UTC correcto en Supabase. |
| 10 | **"Ver en sitio"** | Ícono ExternalLink junto al nombre del cliente en tabla → abre link en nueva pestaña. |

---

## 2. CategoryQuickNav (nuevo componente)

**Archivo:** `frontend/src/components/CategoryQuickNav.tsx`

- Barra horizontal de pills, `lg:hidden` (solo mobile)
- Carga categorías activas desde DB ordenadas por `sort_order`
- `IntersectionObserver` resalta la categoría visible al scrollear (threshold 0.25)
- Scroll suave con offset 100px (header + nav)
- Centrado automático del pill activo en la barra
- Integrado en `HomePage.tsx` entre Hero y HowItWorks

---

## 3. Auditoría de Arquitectura Cloudinary (Prompt #2)

**Archivo:** `backend/infrastructure/cloudinary.service.ts`

### Problema detectado:
- DEV y PROD comparten el mismo namespace `rural24/` — riesgo de contaminación
- No había separación UGC vs CMS

### Fix implementado — `buildFolder(folder)`:
```
Antes:  rural24/{folder}
Ahora:
  UGC (ads, avisos):   rural24/{dev|prod}/ugc/{YYYY}/{MM}
  CMS (banners, logos): rural24/{dev|prod}/cms/{folder}
```
Backward compatible: public_ids existentes no se tocan.

### JSONB banners_clean (pendiente aplicar a DEV/PROD):
**Migración:** `supabase/migrations/20260321000004_banners_clean_image_meta_jsonb.sql`
- Columnas `desktop_image_meta jsonb`, `mobile_image_meta jsonb`, `carousel_image_meta jsonb`
- Backfill automático desde columnas _url existentes
- Índices GIN para queries sobre JSONB

### PWA Check:
- Iconos preparados en `frontend/public/images/Apprural/web/` (192/512/maskable)
- **No existe `manifest.json` ni `sw.js`** → Sprint PWA pendiente (separado)

---

## 4. Sprint CMS-A — Homepage Section Builder

### Archivos creados:

| Archivo | Propósito |
|---|---|
| `supabase/migrations/20260321000005_home_sections.sql` | Tabla + RPC + RLS + seed |
| `backend/app/api/home/composition/route.ts` | GET /api/home/composition |
| `frontend/src/services/v2/homeSectionsService.ts` | CRUD + caché 60s |
| `frontend/src/components/admin/HomeSectionBuilder.tsx` | Admin CRUD con reorder |
| `frontend/src/components/sections/DynamicHomeSections.tsx` | Renderer en homepage |

### Archivos modificados:
- `frontend/App.tsx` — tipo `home-cms`, hash, URL map, isDashboardPage, isProtectedPage, render
- `frontend/src/utils/rolePermissions.ts` — permiso + ítem de menú
- `frontend/src/pages/HomePage.tsx` — integra `<DynamicHomeSections />`

### Esquema `home_sections`:
```sql
id uuid PK, type text (enum CHECK), title text,
query_filter jsonb, display_config jsonb,
active_schedule jsonb, sort_order int, is_active bool,
created_at timestamptz, updated_at timestamptz
```

### Tipos de sección:
- `featured_grid` — Grid de avisos (featured_only, category_slug, limit, columns)
- `category_carousel` — Igual a featured_grid pero sin filtro featured_only
- `ad_list` — Lista de avisos por filtros
- `banner` — Placeholder (conectar a banners_clean en Sprint CMS-B)
- `stats` — Contadores de plataforma (ads, users, categories)

### RPC `get_home_composition()`:
- Devuelve secciones activas filtradas por `active_schedule` si aplica
- SECURITY DEFINER, públicamente accesible (homepage sin auth)

### HomeSectionBuilder admin:
- Lista ordenada por sort_order con botones ↑↓
- Toggle activo/pausado, delete con confirm
- Modal crear/editar: tipo (radio), título, category_slug, limit, featured_only, columns
- JSON editor avanzado colapsable (query_filter + display_config)
- Toast system, loading state en submit

### DynamicHomeSections renderer:
- Carga secciones con `getHomeComposition()` (caché 60s)
- `AdGridSection`: resuelve category_slug → category_id, filtra por featured_ads si aplica
- `StatsSection`: 3 contadores (ads activos, users, categorías)
- `BannerSection`: placeholder visual hasta Sprint CMS-B
- Skeleton loading mientras carga

### Ruta admin:
- `#/home-cms` → `HomeSectionBuilder` (solo superadmin)
- Accesible desde Menú > CONFIGURACIÓN > Homepage Builder

---

## 5. Migraciones pendientes de aplicar

| Migración | Estado |
|---|---|
| `20260321000004_banners_clean_image_meta_jsonb.sql` | Creada — pendiente `db-run-migrations.mjs dev` |
| `20260321000005_home_sections.sql` | Creada — pendiente `db-run-migrations.mjs dev` |

---

## Próximos pasos sugeridos

1. Aplicar migraciones a DEV y PROD
2. Sprint CMS-B: conectar sección tipo `banner` a `banners_clean` (query_filter.banner_placement)
3. PWA Sprint: `manifest.json` + `sw.js` (iconos ya listos)
4. Sprint 7C: ProductCard badge INSUMO/SERVICIO
