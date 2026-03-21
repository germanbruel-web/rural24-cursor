# Sprint CMS-B: Category Section Banner Integration
> Fecha: 2026-03-21 15:24
> Estado: EN CURSO

---

## Contexto y decisión arquitectónica

### Problema identificado
El tipo `category_section` del CMS Homepage tiene un espacio publicitario hardcodeado como placeholder:
```tsx
<div className="hidden md:flex ... bg-gray-50 border border-dashed border-gray-200 ...">
  Espacio publicitario · 650×100
</div>
```
No estaba conectado al sistema de banners (`banners_clean`) ya desarrollado.

### Opciones evaluadas

**Opción A — 8 secciones CMS manuales (una por categoría)**
- El admin crea 8 secciones `category_section` desde el Constructor de Homepage
- Cada una se puede activar/pausar/reordenar independientemente
- Ya funciona hoy
- Contra: el espacio publicitario sigue siendo un placeholder

**Opción B — `category_section` con banner interno integrado (ELEGIDA)**
- Campo `query_filter.banner_placement` en `category_section`
- `CategorySectionRenderer` fetcha el primer banner activo de ese placement + categoría
- El admin configura en un solo lugar: categoría L1 + placement del banner
- Reutiliza la infraestructura ya existente de `banners_clean` + `bannersCleanService`
- Elimina la necesidad de un sistema separado

**Decisión: Opción B**
- Una arquitectura unificada: cada `category_section` es autónoma (avisos + índice taxonómico + banner propio)
- El espacio publicitario se resuelve desde `banners_clean` filtrando por `placement` y `category`
- Sistema ya existente: `bannersCleanService.getHeroVIPBanners(category)` soporta filtro por categoría

---

## Estado previo al sprint (completado en sesión anterior)

### Fixes ya aplicados (2026-03-21, sesión CMS-A)
- `category_section` renderer funciona: header bold + grid destacados + índice taxonómico
- `SectionHeader` rediseñado: barra verde vertical + `font-black text-2xl text-gray-900`
- `AdsSubLabel` component: "AVISOS DESTACADOS (N)" con barra verde pequeña
- `adToProduct()` helper: mapea `AdItem` → `Product` con `province`, `city`, `price_unit`, `attributes`
- `useAds` select expandido: incluye `province, city, price_unit, ad_type, attributes`
- `ProductCard` en secciones CMS: `showLocation` dinámico según si tiene `city || province`
- `BannerSection` (tipo `banner`): conectado a `banners_clean` vía `query_filter.banner_placement`
- `HomeSectionBuilder`: campo `banner_placement` para tipo `banner`
- `filters/route.ts`: usa `display_name || name` en todos los selects de categorías/subcategorías

### Migraciones pendientes de aplicar a DEV
- `20260321000004` banners_clean JSONB meta
- `20260321000005` home_sections CMS-A
- `20260321000006` home_sections cta_cards CHECK
- `20260321000007` home_sections category_section CHECK

---

## Implementación: Opción B

### Objetivo
Conectar el espacio publicitario dentro de `CategorySectionRenderer` al sistema `banners_clean`.

### Flujo de datos
```
category_section (home_sections)
  query_filter.category_slug   → "maquinaria-agricola"
  query_filter.banner_placement → "hero_vip"
        ↓
CategorySectionRenderer
  → fetch banners_clean WHERE placement='hero_vip' AND is_active=true
  → filtrar por category ≈ "maquinaria-agricola" (usando normalizeForComparison)
  → mostrar desktop_image_url (hidden sm:block) + mobile_image_url (sm:hidden)
  → envolver en <a href={link_url}> si tiene link
```

### Cambios requeridos

#### 1. HomeSectionBuilder.tsx
En el bloque `form.type === 'category_section'`, agregar selector de `banner_placement`:
```tsx
<select value={query_filter.banner_placement} onChange={...}>
  <option value="">Sin banner (espacio reservado)</option>
  <option value="hero_vip">Hero VIP</option>
  <option value="category_carousel">Carrusel Categorías</option>
</select>
```

#### 2. DynamicHomeSections.tsx — `CategorySectionRenderer`
- Agregar `useState` + `useEffect` para fetch del banner
- La query: `supabase.from('banners_clean').select('*').eq('placement', placement).eq('is_active', true)`
- Filtro por categoría: usar `normalizeForComparison` (igual que `bannersCleanService`)
- Reemplazar el placeholder por la imagen real del banner (desktop + mobile)
- Si no hay banner activo para esa categoría → no mostrar nada (no placeholder en prod)

### Normalización de categoría (reutilizar lógica existente)
```ts
function normalizeForComparison(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, '');
}
// "maquinaria-agricola" → "maquinariaagricola"
// "MAQUINARIAS AGRÍCOLAS" → "maquinariasagricolas"
// banners_clean.category = "Maquinaria Agrícola" → "maquinariaagricola"
```

### Migración de secciones hardcodeadas (plan posterior)
Una vez que el CMS tenga las 8 categorías configuradas con sus banners:
1. Comentar / remover `FeaturedAdsSection` y `CategoryBannerSlider` hardcodeadas de `HomePage.tsx`
2. El CMS reemplaza completamente esas secciones
3. Sprint separado para no romper producción durante la transición

---

## Archivos involucrados

| Archivo | Cambio |
|---|---|
| `frontend/src/components/admin/HomeSectionBuilder.tsx` | Agregar selector `banner_placement` en bloque `category_section` |
| `frontend/src/components/sections/DynamicHomeSections.tsx` | `CategorySectionRenderer`: fetch banner real, reemplazar placeholder |

---

## Criterios de completitud
- [x] Admin puede seleccionar un `banner_placement` al configurar una `category_section`
- [x] `CategorySectionRenderer` muestra la imagen del banner activo para esa categoría
- [x] En desktop: `desktop_image_url` inline junto al título (max-w-[680px], h-[72px])
- [x] En mobile: `mobile_image_url` debajo del título, ancho completo
- [x] Si el banner tiene `link_url` → toda la imagen es clickeable con `target`
- [x] Si no hay banner activo → el espacio desaparece (no placeholder visible en prod)
- [x] El filtro de categoría usa `normalizeCategory()` igual que `bannersCleanService`

## Sprint CMS-C: Limpieza HomePage + Verificación integración (2026-03-21)

### HomePage.tsx — secciones eliminadas
- `FeaturedAdsSection` → eliminada (reemplazada por `DynamicHomeSections`)
- `heroBanners` state + `loadHeroBanners` useEffect → eliminados (BannersVipHero se fetcha solo)
- `featuredLimit` state + `loadFeaturedLimit` useEffect → eliminados
- Imports huérfanos eliminados: `FeaturedAdsSection`, `getHeroVIPBanners`, `getSettingNumber`, `Banner`, `navigateTo`

### Integración verificada y corregida

#### Featured Ads — RPC con deduplicación
`DynamicHomeSections` (`useAds` + `CategorySectionRenderer`) ahora usa:
```
get_featured_for_homepage(p_category_id, p_limit)
  → deduplicación: 1 aviso por vendedor, prioriza pagos sobre manuales
  → fallback: featured_ads WHERE status='active' AND placement='homepage'
```
Mismo sistema que el legacy `FeaturedAdsSection` → comportamiento idéntico.

#### Banners — flujo completo cableado
| Componente | Fuente | Filtro |
|---|---|---|
| `BannersVipHero` (hero) | `banners_clean` | `placement='hero_vip'` |
| `BannerSection` (tipo `banner`) | `banners_clean` | `placement=query_filter.banner_placement` |
| `CategorySectionRenderer` header | `banners_clean` | `placement=banner_placement` + normalizeCategory |

#### AdsSubLabel — label dinámico
- `featured_only=true` → "Avisos Destacados (N)"
- `featured_only=false` → "Últimos Avisos (N)"

## Sprint CMS-D: Banner Carousel + Dimensiones exactas (2026-03-21 17:30)

### Fixes aplicados

#### Bug: `carousel_image_url` no se leía
- Select original solo traía `desktop_image_url, mobile_image_url` → banners de `category_carousel` tenían ambos en null
- Fix: agregar `carousel_image_url` al select, usarlo como fallback en el render

#### Multi-banner carrusel
- `setBanner(match)` → `setBanners(matches)` — se toman TODOS los banners activos de la categoría
- Estado: `banners: Record<string,any>[]` + `bannerIdx: number`
- Autoplay: `setInterval` 4000ms, se limpia con cleanup en useEffect
- Bullets línea: `h-[3px]`, gris inactivo (`bg-gray-300 w-4`) → verde activo (`bg-brand-600 w-6`), transición 300ms
- Click en bullet → `setBannerIdx(i)` para navegación manual

#### Dimensiones exactas por placement
- `BANNER_DIMS` map fuera del componente — lookup `O(1)`
- `aspectRatio` inline style (`dw/dh` desktop, `mw/mh` mobile) — no clases dinámicas Tailwind
- `maxWidth` inline style según `dw` del placement
- Valores: `hero_vip` 1100×200 / 480×100 | `category_carousel` 650×100 | `results_below_filter` 280×250

#### Sin transformaciones Cloudinary en banners
- Eliminado `getImageVariant()` de todos los banners en `CategorySectionRenderer` y `BannerSection`
- URLs servidas sin modificar — usuario sube imágenes a medida exacta
- `getImageVariant` se mantiene para ProductCard y otras imágenes de UGC

### DB — Migraciones aplicadas a PROD
- `20260321000004` ✅ | `20260321000005` ✅ | `20260321000008` ✅
- PROD sincronizado con DEV (sin seeds)

## Estado final: COMPLETADO 2026-03-21 17:30
