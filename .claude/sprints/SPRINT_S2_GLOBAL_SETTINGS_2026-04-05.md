# Sprint S2 — Configurabilidad global_settings
**Fecha:** 2026-04-05
**Estado:** ✅ Completado
**Commit:** cf74f9a
**Parte del roadmap:** serialized-cooking-honey.md (S2 de 8)

---

## Prerequisitos creados

### `frontend/src/hooks/useGlobalSetting.ts` (nuevo)
Hook React que wrappea `getSetting<T>()` del servicio con `useState` + `useEffect`.
- Retorna `defaultValue` en el primer render (sincrónico)
- Actualiza estado cuando la promesa resuelve (usa cache interno de 10 min)
- Cancelación via `cancelled` flag para evitar setState en componente desmontado
- Soporta tipos genéricos: `number`, `boolean`, `string`, `string[]`

### `supabase/migrations/20260405000001_global_settings_s2_keys.sql`
Inserta 14 keys nuevas con `ON CONFLICT (key) DO NOTHING` — idempotente.

| Key | Default | Categoría |
|---|---|---|
| `card_color_category_slugs` | `["servicios","empleos"]` | `cards` |
| `card_description_max_chars` | `100` | `cards` |
| `search_results_per_page` | `20` | `search` |
| `search_banner_intercalated_freq` | `8` | `search` |
| `search_grid_cols_mobile` | `2` | `search` |
| `search_grid_cols_tablet` | `3` | `search` |
| `search_grid_cols_desktop` | `5` | `search` |
| `similar_ads_limit` | `6` | `ads` |
| `site_canonical_url` | `"https://rural24.com.ar"` | `ads` |
| `seo_description_max_chars` | `155` | `ads` |
| `home_section_default_limit` | `8` | `home` |
| `featured_bar_cards_per_page` | `5` | `featured` |
| `featured_bar_load_batch` | `10` | `featured` |
| `featured_bar_max_ads` | `30` | `featured` |

---

## Cambios por archivo

### `ProductCard.tsx`
- `THRESHOLD_MS = 48h` → `useGlobalSetting<number>('card_countdown_threshold_hours', 48)` dentro de `CountdownBadge`
- `catSlug === 'servicios' || catSlug === 'empleos'` → `useGlobalSetting<string[]>('card_color_category_slugs', [...])` → `colorSlugs.includes(catSlug)`

### `EmpleoCard.tsx`
- `desc.length > 100 ? desc.slice(0, 100)` → `desc.length > descMaxChars ? desc.slice(0, descMaxChars)` donde `descMaxChars = useGlobalSetting<number>('card_description_max_chars', 100)`

### `UserFeaturedAdsBar.tsx`
- `const CARDS_PER_PAGE = 5` → `useGlobalSetting<number>('featured_bar_cards_per_page', 5)`
- `const LOAD_BATCH = 10` → `useGlobalSetting<number>('featured_bar_load_batch', 10)`
- `const MAX_ADS = 30` → `useGlobalSetting<number>('featured_bar_max_ads', 30)`

### `SearchResultsPageMinimal.tsx`
- `const RESULTS_PER_PAGE = 20` → `useGlobalSetting<number>('search_results_per_page', 20)` — 4 referencias reemplazadas
- `(index + 1) % 8 === 0` → `(index + 1) % bannerFreq === 0` donde `bannerFreq = useGlobalSetting<number>('search_banner_intercalated_freq', 8)`
- `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` → clases dinámicas desde mapeo `{1:'grid-cols-1',...}[gridColsMobile]` — 3 settings

### `DynamicHomeSections.tsx`
- `useAds` hook: `limit ?? 8` → `limit ?? sectionDefaultLimit` donde `sectionDefaultLimit = useGlobalSetting<number>('home_section_default_limit', 8)`
- `AdGridSection`: mismo cambio (limit display también configurable)

### `useAdData.ts`
- `useGlobalSetting<number>('similar_ads_limit', 6)` en el nivel del hook
- `.limit(6)` → `.limit(similarAdsLimit)` en ambas queries de `loadSimilarAds`
- `if (items.length < 6)` → `if (items.length < similarAdsLimit)` — consistente

### `AdDetail.tsx`
- `ad.description.slice(0, 155)` → `ad.description.slice(0, seoDescMaxChars)`
- `https://rural24.com.ar/#/ad/${slug}` → `` `${canonicalBase}/#/ad/${slug}` ``

---

## Cómo verificar
1. En Supabase Studio DEV: correr la migración `20260405000001`
2. Cambiar `search_results_per_page` a `10` en `global_settings`
3. Recargar la página de búsqueda → debe mostrar 10 resultados por página
4. Cambiar `card_color_category_slugs` para agregar otra categoría → esa categoría pasa a color-card sin deploy

## Próximo sprint disponible
- **S3** (post S2): `adaptAdToProduct()` canónica — 3 sitios inline → un adaptador
- **S4** (independiente): Error boundaries 3 niveles
- **S7** (independiente): PWA
