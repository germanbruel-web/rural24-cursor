# Análisis Técnico Stack PWA — Rural24
**Fecha:** Marzo 2026 | **Versión:** V1 | **Autor:** Lead Software Architect session

---

## Stack actual

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | Vite + React 18 (SPA) | Hash-based routing propio |
| BFF | Next.js 15 (API Routes only) | No renderiza HTML |
| DB | Supabase (PostgreSQL + RLS) | Auth + RPCs |
| Media | Cloudinary CDN | `ruralcloudinary` cloud |
| Deploy | Render (monorepo) | Cold starts en free tier |

---

## Diagnóstico de cuellos de botella

| Problema | Impacto Lighthouse | Prioridad |
|---|---|---|
| 88% de imágenes sin `loading="lazy"` | LCP, Performance | P0 |
| 0/74 `<img>` con `width`/`height` explícito | CLS crítico | P0 |
| Banners homepage sin Cloudinary optimization | LCP | P0 |
| Code splitting | ✅ YA IMPLEMENTADO (App.tsx L48-88) | — |
| Sin Service Worker | PWA score | P1 |
| Sin manifest.json PWA | PWA score | P1 |
| Supabase WS siempre activo | Batería mobile | P1 |
| JWT expiry corto para PWA instalada | Auth offline | P2 |
| Sin ISR en Next.js para páginas SEO | LCP bots | P2 |
| Next.js BFF cold start en Render free | TTFB | P3 |

### Cloudinary: sistema existente pero sub-utilizado

- ✅ `frontend/src/utils/imageOptimizer.ts` — utilities completas (f_auto, q_auto, srcSet, blur placeholder)
- ✅ `getImageVariant('card' | 'detail' | 'hero' | 'thumb')` — variantes preconfiguradas
- ✅ `useOptimizedImage()` hook — srcSet + sizes listos
- ❌ No se aplican en `HomepageBannerSection`, `HeroVIPBanner`, `AdDetailPage`, modales

### Patrón de referencia existente

`frontend/src/components/ProductCard.OPTIMIZED.example.tsx` — implementa el patrón correcto:
blur placeholder → lazy load → srcSet responsivo → aspect-ratio via container

---

## Métricas objetivo

| Métrica | Estado estimado | Target |
|---|---|---|
| LCP | ~2.5s | < 1.2s |
| CLS | ~0.15 | < 0.05 |
| TBT | ~600ms | < 200ms |
| Lighthouse Performance | ~55-65 | > 90 |
| Lighthouse PWA | ~30 | > 90 |

---

## Hoja de Ruta

---

### Sprint 1 — Quick wins imágenes (1-2 días)
**Estado: ✅ COMPLETADO (2026-03-01)**

| Tarea | Archivo | Impacto | Estado |
|---|---|---|---|
| ~~Code splitting por ruta~~ | App.tsx L48-88 | LCP | ✅ YA HECHO |
| `loading="lazy"` + `decoding="async"` en imágenes out-of-fold | ProductCard, AdDetailPage, banners | LCP | ✅ Sprint 1 |
| Aspect-ratio / width+height en `<img>` críticos | HomepageBannerSection, HeroVIPBanner, AdDetailPage | CLS | ✅ Sprint 1 |
| `f_auto,q_auto` en banners homepage | HomepageBannerSection, HeroVIPBanner | LCP | ✅ Sprint 1 |

**Archivos intervenidos en Sprint 1:**
- `frontend/src/components/banners/HomepageBannerSection.tsx`
- `frontend/src/components/banners/HeroVIPBanner.tsx`
- `frontend/src/components/AdDetailPage.tsx`
- `frontend/src/components/organisms/ProductCard/ProductCard.tsx`

---

### Sprint 2 — PWA base (3-5 días)
**Estado: ✅ COMPLETADO (2026-03-01)**

| Tarea | Estado |
|---|---|
| `vite-plugin-pwa` + Workbox (App Shell + cache Cloudinary + API NetworkFirst) | ✅ |
| `manifest.json` completo vía VitePWA (auto-inyectado en build) | ✅ |
| Icons PNG reales en `frontend/public/images/AppImages/android/` (48→512px) | ✅ |
| `apple-touch-icon` → `/images/AppImages/ios/180.png` | ✅ |
| Meta tags PWA + SEO/OG en `index.html` | ✅ |
| `id: '/'` en manifest (requerido para identificar la PWA) | ✅ |
| `purpose: 'any'` y `purpose: 'maskable'` en entradas separadas | ✅ |
| `screenshots` con `preview-image.webp` (Richer Install UI en desktop) | ✅ |
| JWT expiry a 7 días en Supabase Dashboard | ⏸ Requiere plan pago (Supabase free no permite) |
| Supabase Realtime selectivo | ⬜ Sprint 3 |
| TanStack Query con staleTime diferenciado | ⬜ Sin TanStack Query en el proyecto — no aplica |

**Configuración Supabase Dashboard (pendiente, plan pago):**
```
Auth → JWT expiry: 604800 (7 días)
Auth → Refresh token reuse interval: 10s
Auth → Refresh token rotation: ON
```
> Mientras tanto: `autoRefreshToken: true` ya configurado en el cliente Supabase cubre el uso normal.

**Workbox runtime caching implementado:**
```
res.cloudinary.com  → CacheFirst  (30 días, max 100 entries)
/api/*              → NetworkFirst (5s timeout, 5min cache)
*.supabase.co       → NetworkFirst (5s timeout, 5min cache)
fonts.googleapis.com → StaleWhileRevalidate
fonts.gstatic.com   → CacheFirst  (1 año)
```

**Assets PWA:**
```
frontend/public/images/AppImages/
  android/  ← 6 PNGs usados en manifest (48, 72, 96, 144, 192, 512px)
  ios/      ← 26 PNGs (16px → 1024px)
  windows11/ ← tiles, splash, store logo
```

**Notas de limpieza:**
- `frontend/public/public/` — carpeta duplicada eliminada (era artefacto de una copia manual incorrecta)
- `frontend/dev-dist/` — agregada a `.gitignore` (archivos generados por VitePWA en modo dev, no van a repo)

---

### Sprint 2.5 — PWA hardening + Admin Inspector (2026-03-01)
**Estado: ✅ COMPLETADO**

#### Fixes críticos — Vite + Service Worker

| Problema | Fix | Archivo |
|---|---|---|
| `server.headers: immutable` aplicado a todos los JS → React duplicate instance con SW activo | Eliminado el bloque `headers` del server | `frontend/vite.config.ts` |
| Falta `resolve.dedupe` → dos instancias de React con `lazy()` + VitePWA dev | Agregado `dedupe: ['react', 'react-dom', 'react/jsx-runtime']` | `frontend/vite.config.ts` |
| Síntoma: `Cannot read properties of null (reading 'useState')` en HeroCmsPanel | Fix combinado arriba | — |

**Procedimiento de recuperación si reaparece:**
```
1. rm -rf frontend/node_modules/.vite
2. DevTools → Application → Storage → Clear site data
3. Application → Service Workers → Unregister
4. npm run dev (frontend)
5. Ctrl+Shift+R (hard refresh)
```

#### iOS — apple-touch-icon completo

Antes: solo 1 tag con 180px. Ahora 4 tamaños en `frontend/index.html`:
```html
<link rel="apple-touch-icon" sizes="180x180" href="/images/AppImages/ios/180.png" />
<link rel="apple-touch-icon" sizes="167x167" href="/images/AppImages/ios/167.png" />
<link rel="apple-touch-icon" sizes="152x152" href="/images/AppImages/ios/152.png" />
<link rel="apple-touch-icon" sizes="120x120" href="/images/AppImages/ios/120.png" />
```
> iOS ignora el manifest.json — lee SOLO los `<link>` del HTML.

#### PWA Screenshots — estado actual y mejora pendiente

| | Actual | Recomendado |
|---|---|---|
| Archivo | `preview-image.webp` (1.9 KB) | Screenshots reales |
| Wide | 401×301 px | **1280×720** mínimo |
| Narrow | 401×301 px (mismo archivo) | **390×844** (portrait) |
| form_factor wide | ✅ configurado | — |
| form_factor narrow | ⚠️ usa mismo archivo | Archivo separado |

**Para actualizar screenshots** (`vite.config.ts` → bloque `screenshots`):
```javascript
screenshots: [
  {
    src: '/screenshot-desktop.webp',  // 1280×720, ~150-300KB
    type: 'image/webp',
    sizes: '1280x720',
    form_factor: 'wide',
    label: 'RURAL24 — Clasificados Agropecuarios',
  },
  {
    src: '/screenshot-mobile.webp',   // 390×844, ~80-150KB
    type: 'image/webp',
    sizes: '390x844',
    form_factor: 'narrow',
    label: 'RURAL24 — Clasificados Agropecuarios',
  },
],
```
Poner los archivos en `frontend/public/` y commitear.

#### PWA Inspector — Backend Dashboard

Nuevo módulo en el backend admin para verificar assets estáticos sin acceso al filesystem:

```
backend/app/api/admin/cms/public-assets/route.ts
  GET /api/admin/cms/public-assets[?category=logos|icons|hero|pwa-android|pwa-ios|pwa-win]
  → Lee frontend/public/ via fs (Node.js), auth Bearer token (superadmin)
  → Devuelve: { categories: [{ id, label, files: [{ name, path, size, ext }] }], total }

backend/app/api/admin/cms/asset/route.ts
  GET /api/admin/cms/asset?path=images/AppImages/android/512.png&token=XXX
  → Proxy seguro: auth + validación path traversal + Content-Type correcto
  → Cache-Control: private, max-age=300

backend/app/admin/dashboard/cms/page.tsx
  UI: tabs por plataforma, grid miniaturas, modal detalle (ruta, tamaño, formato)
  Acceso desde: Dashboard → card "PWA Inspector"
```

**Propósito:** verificar visualmente antes de cada deploy que los íconos PWA están completos y correctos. NO permite subir/reemplazar (los íconos PWA son estáticos, cambiarlos requiere deploy).

#### URLs Render

| Ambiente | Frontend (PWA) |
|---|---|
| Staging | `rural24-1.onrender.com` |
| Producción | `prod-frontend-uxzm.onrender.com` |

#### Checklist install PWA — por plataforma

**Chrome Desktop:**
```
1. Abrir https://[frontend-url]/
2. Buscar ⊕ en barra de direcciones (o menú → "Instalar RURAL24")
3. DevTools → Application → Manifest → verificar íconos y screenshots
4. DevTools → Application → Service Workers → "activated and running"
```

**Chrome Android:**
```
1. Abrir en Chrome mobile
2. Aparece banner "Agregar a pantalla de inicio" (si no, menú ⋮ → Instalar app)
3. Verificar ícono 192px en launcher
```

**iOS Safari (iPhone/iPad):**
```
1. Abrir en Safari
2. Share (cuadrado con flecha) → "Agregar a pantalla de inicio"
3. Verifica título "Rural24" e ícono 180px
4. Al abrir: status bar verde (#138A2C), sin barra de Safari
```

---

### Sprint 3 — Performance avanzada (1 semana)

- [ ] ISR en Next.js BFF para `/`, `/avisos/[slug]`, `/categorias/[cat]`
- [ ] Mutation queue offline para creación de avisos (localStorage + `online` event)
- [ ] Visibilidad-aware Realtime: `document.visibilitychange` → subscribe/unsubscribe

**Regla de renderizado:**
- Google necesita indexarlo → SSR/ISR en Next.js BFF
- Requiere auth → Vite SPA

---

### Sprint 4 — Infra (opcional)

- [ ] Render paid plan (elimina cold starts de ~800ms)
- [ ] O: migrar BFF a Vercel Edge (sin cold start, gratis en tier hobby)

---

## Referencias técnicas

### Supabase Realtime — patrón visibilidad

```ts
function useRealtimeWallet(userId: string) {
  useEffect(() => {
    let channel: RealtimeChannel | null = null
    const subscribe = () => {
      channel = supabase
        .channel(`wallet:${userId}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public',
          table: 'user_wallets', filter: `user_id=eq.${userId}`
        }, () => queryClient.invalidateQueries(['wallet', userId]))
        .subscribe()
    }
    const unsubscribe = () => { channel?.unsubscribe(); channel = null }
    document.addEventListener('visibilitychange', () =>
      document.hidden ? unsubscribe() : subscribe()
    )
    subscribe()
    return unsubscribe
  }, [userId])
}
```

### Cloudinary — variantes fijas (no ad-hoc)

```ts
// Usar SIEMPRE getImageVariant() — NO construir URLs manualmente
import { getImageVariant } from '@/utils/imageOptimizer'

// Card avisos
getImageVariant(url, 'card')     // w_600, ar_4:3, f_auto, q_auto
// Detalle
getImageVariant(url, 'detail')   // w_1200, ar_16:9, f_auto, q_auto
// Thumb
getImageVariant(url, 'thumb')    // w_150, ar_1:1, f_auto, q_auto
```

### CLS — regla práctica

> Si el contenedor padre tiene `aspect-[4/3]` (o similar) y el img tiene `w-full h-full`,
> el CLS se elimina aunque no haya `width`/`height` en el `<img>` tag.
> Agregar `width`/`height` explícitos es backup adicional.

### Mutation queue offline (patrón simple)

```ts
// Sin Web Worker — localStorage + evento 'online'
const QUEUE_KEY = 'rural24:mutation_queue'
window.addEventListener('online', flushMutationQueue)
```

---

## Archivos clave del sistema de imágenes

```
frontend/src/utils/imageOptimizer.ts               ← Core utilities Cloudinary
frontend/src/utils/imageDiagnostics.ts             ← Debug tool
frontend/src/hooks/useProductImage.ts              ← Extrae URL de imagen de producto
frontend/src/components/ProductCard.OPTIMIZED.example.tsx  ← Patrón de referencia
frontend/src/components/organisms/ProductCard/ProductCard.tsx  ← Producción (parcialmente optimizado)
```
