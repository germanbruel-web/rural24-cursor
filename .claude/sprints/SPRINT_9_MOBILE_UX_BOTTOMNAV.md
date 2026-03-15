# Sprint 9 — Mobile UX + BottomNav + Edit Unificado + UI Cleanup
> Fecha: 2026-03-15
> Commits: `dcca1ac` (Sprint 9), `8f6eae1` (DB dump)
> Branch: main → pusheado a origin

---

## Objetivo

Transformar la experiencia mobile de Rural24 para que se sienta como una app nativa:
- Navegación inferior tipo app (BottomNav)
- Eliminar elementos redundantes en mobile (hamburger, TopNav, botones duplicados)
- Unificar el flujo de edición de avisos en el wizard completo
- Limpiar UI: eliminar "A convenir", tabs de filtro, Dashboard del menú

---

## 1. BottomNav — Navegación inferior mobile

**Archivo:** `frontend/src/components/BottomNav.tsx` (nuevo)

5 tabs fijos en el bottom de la pantalla, solo mobile (`lg:hidden`), `z-40`:

| Tab | Icono | Ruta |
|---|---|---|
| Mis Avisos | FileText | `#/my-ads` |
| Favoritos | Heart | `#/my-ads` (placeholder) |
| **Publicar** | Plus (FAB) | `#/publicar` |
| Mensajes | MessageCircle | `#/inbox` |
| Mi Perfil | User | `#/profile` |

**FAB central (Publicar):**
- `60×60px`, `bg-brand-600`, `-top-8` (sobresale 32px sobre la barra)
- `ring-4 ring-white` — separa visualmente del fondo
- `shadow-xl shadow-brand-600/40`
- Se oculta automáticamente en páginas wizard (`#/publicar*`, `#/edit/*`)
- Detecta cambios de ruta via `hashchange` listener

**Barra:** `h-[64px]`, `fixed bottom-0`, `safe-area-inset-bottom` para iPhones con notch

**Integración:**
- `App.tsx`: `<BottomNav />` dentro de `<AccountProvider>` — overlay fijo sobre toda la app
- `DashboardLayout.tsx`: `pb-24 lg:pb-0` en `<main>` para no tapar contenido

---

## 2. TopNav — Oculto en mobile

**Archivo:** `frontend/src/components/header/TopNav.tsx`

- Wrapper principal cambiado a `hidden md:block` — invisible en mobile
- El botón verde "PUBLICAR" mobile fue eliminado (BottomNav FAB lo reemplaza)
- Desktop sin cambios: cotización USD + links informativos

---

## 3. Hamburger menu eliminado

**Archivo:** `frontend/src/components/header/HeaderNew.tsx`

**Eliminado:**
- Estado `showMobileMenu` + panel lateral derecho
- Botón hamburger `<Menu>` del header mobile
- Imports: `Menu`, `X`, `Home`, `Package`, `MessageSquare`

**Dropdown de perfil mobile — reestructurado:**

Antes tenía: Dashboard, Mis Avisos, Mensajes, links duplicados

Ahora tiene (en orden):
1. Info usuario (avatar, nombre, email)
2. Mi Cuenta → `#/profile`
3. Avisos Eliminados (solo superadmin)
4. **Links informativos:** ¿Cómo funciona? / Precios / Contacto
5. **Sección Admin** (superadmin): Usuarios, Buscador Avisos, Banners, Categorías
6. Cerrar Sesión

**Z-index fix:** Header siempre `z-50` (antes solo al hacer scroll), dropdown `z-[100]` — evita que el wizard tape el dropdown.

---

## 4. Navegación informativa — Slugs SEO

**Archivos:** `TopNav.tsx`, `HeaderNew.tsx`, `App.tsx`

| Label | Slug nuevo | Slug anterior | Página |
|---|---|---|---|
| ¿Cómo funciona? | `#/preguntas-frecuentes-rural24` | `#/how-it-works` | HowItWorksPage |
| Precios | `#/precios-rural24` | `#/pricing`, `#/planes` | PricingPage |
| Contacto | `#/contacto-rural24` | — (nuevo) | Placeholder |

- Todos los slugs anteriores siguen funcionando (backward-compatible)
- Página `/contacto-rural24`: placeholder "Sección en desarrollo. Próximamente."
- Page type `'contact'` agregado al union type `Page` en App.tsx

**Desktop TopNav:** ¿Cómo funciona? · Precios · Contacto
**Mobile dropdown:** mismos 3 links con iconos HelpCircle / Tag / Briefcase

---

## 5. Edit flow unificado

**Archivos:** `MyAdsPanel.tsx`, `PublicarAviso.tsx`

**Antes:** botón "Modificar" abría `QuickEditAdModal` (drawer lateral sin validaciones)
**Ahora:** botón "Modificar" → `navigateTo('/edit/${ad.id}')` → wizard completo

**PublicarAviso en modo edición:**
- Detecta `#/edit/:id` → `isEditMode = true`
- Pre-llena todos los campos: categoría (L1/L2/L3), atributos dinámicos, fotos, precio, ubicación
- Auto-save deshabilitado (`if (isEditMode) return;`)
- Badge "EDIT" ámbar en header (mobile + desktop)
- Botón "Cancelar edición" → `#/my-ads`
- Post-update redirect: `data.slug || data.id` (fix para redirect correcto)
- Validación título/descripción: bloquea emails y teléfonos (ya existía en modo alta)

**QuickEditAdModal** se mantiene intacto — solo lo usa `AllAdsTab.tsx` (admin masivo)

---

## 6. Eliminación de "A convenir"

Precio obligatorio en todo el proyecto. Removido de:
- `QuickEditAdModal.tsx` — estado `priceNegotiable` + checkbox eliminados
- `adFieldsConfig.ts` — campo precio: `required: true`
- `currency.ts` — fallback `'—'` en lugar de `'A convenir'`
- Display: `EmpresaPublicPage`, `AdDetail`, `LivePreviewCard`, `ProductCard`,
  `SearchResultsPageMinimal`, `v2/AdPreviewCard`, `AdDetailModal`, `MyAdsPanel`, `AllAdsTab`
- `PublicarAviso.tsx` — `price_negotiable: false` hardcodeado en submit

---

## 7. MyAdsPanel — Limpieza UI

**Archivo:** `frontend/src/components/admin/MyAdsPanel.tsx`

- **Tabs Todos/Activos/Pausados eliminados** — el estado del aviso se ve en cada card (badge Activo/Pausado)
- **Botón "Crear Nuevo Aviso"** → `hidden sm:flex` — solo desktop (FAB lo reemplaza en mobile)
- **Taxonomía en listado:**
  - Superadmin: `Categoría › L2 › L3 · Localidad, Provincia`
  - Usuario: `Categoría · Localidad`
- **`subcategory_parent_name`** computed en `adsService.ts` para mostrar nombre del padre L2 en avisos L3

---

## 8. Sidebar — Dashboard eliminado del menú

**Archivo:** `frontend/src/utils/rolePermissions.ts`

Ítem `{ id: 'dashboard', label: 'Dashboard' }` eliminado de `MENU_STRUCTURE`.
El dashboard es accesible desde el dropdown de perfil, no desde el sidebar.

---

## 9. PublicarAviso — Mobile app feel

**Archivo:** `frontend/src/components/pages/PublicarAviso.tsx`

- **Drill-down taxonomy mobile** (L1→L2→L3):
  - Estado `mobileNavLevel: 1 | 2 | 3` + `drillDirection: 'forward' | 'back'`
  - Animaciones CSS: `drill-enter-forward` (slideInFromRight) / `drill-enter-back` (slideInFromLeft)
  - `MobileRow`: `py-[14px]`, `text-base font-medium`, iconos `w-5 h-5`
  - Desktop mantiene Miller columns (3 columnas)
- **Header wizard mobile:**
  - TopNav mobile bar oculta en wizard (hashchange listener en TopNav.tsx)
  - Botón "Volver" reemplazado por `<div className="w-10" />` spacer
  - `py-2.5` header, textos más grandes (`text-lg`, `text-sm font-semibold`)
- **Botón Continuar:** `fullWidth` cuando `currentStep > 1`, `text-base font-bold`
- **index.css:** animaciones drill-down agregadas

---

## 10. DB — Dump y push

- `pg_dump` exitoso contra `aws-0-us-west-2.pooler.supabase.com:5432` (NO port 6543)
- Archivo: `database/RURAL24_SCHEMA_DEV_2026-03-15.sql` (573KB, 19241 líneas)
- Es la nueva fuente de verdad del schema DEV

---

## Pendientes identificados

1. **PROD sync**: aplicar migraciones 000001→000012 contra PROD (pendiente aprobación)
2. **Favoritos**: tab apunta a `#/my-ads` como placeholder — página `#/favorites` a desarrollar
3. **Página Contacto**: placeholder activo en `#/contacto-rural24`
4. **Servicios link**: apunta a `how-it-works` temporalmente — página propia pendiente
5. **FormBuilderAdmin**: gestión inline de option_lists

---

## Archivos modificados (resumen)

```
frontend/App.tsx                                    +56/-18
frontend/src/components/BottomNav.tsx               NUEVO
frontend/src/components/header/HeaderNew.tsx        +60/-120
frontend/src/components/header/TopNav.tsx           +15/-18
frontend/src/components/layouts/DashboardLayout.tsx +1/-1
frontend/src/components/admin/MyAdsPanel.tsx        +40/-78
frontend/src/components/admin/QuickEditAdModal.tsx  +3/-21
frontend/src/components/pages/PublicarAviso.tsx     +300/-214
frontend/src/services/adsService.ts                 +45/-6
frontend/src/utils/rolePermissions.ts               -5
frontend/src/utils/currency.ts                      +2/-2
frontend/src/config/adFieldsConfig.ts               +2/-2
frontend/src/index.css                              +11
frontend/src/components/AdDetailModal.tsx           +1/-1
frontend/src/components/LivePreviewCard.tsx         +1/-1
frontend/src/components/SearchResultsPageMinimal.tsx +3/-4
frontend/src/components/admin/AllAdsTab.tsx         +1/-1
frontend/src/components/organisms/ProductCard/...  +1/-1
frontend/src/components/pages/AdDetail.tsx          +1/-1
frontend/src/components/pages/EmpresaPublicPage.tsx +1/-1
frontend/src/components/v2/AdPreviewCard.tsx        +1/-1
CLAUDE.md                                           +21
database/RURAL24_SCHEMA_DEV_2026-03-15.sql          NUEVO (573KB)
supabase/migrations/20260315000001_l3_sync_prod.sql NUEVO
```
