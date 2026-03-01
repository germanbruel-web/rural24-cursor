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
**Estado: EN CURSO**

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

- [ ] `vite-plugin-pwa` + Workbox (App Shell + cache Cloudinary + API NetworkFirst)
- [ ] `manifest.json` completo (icons 192/512, theme_color, display standalone, start_url)
- [ ] JWT expiry a 7 días en Supabase Dashboard (Auth → JWT expiry: 604800)
- [ ] Supabase Realtime selectivo (solo activo cuando pestaña visible)
- [ ] TanStack Query con staleTime diferenciado por criticidad

**Configuración Supabase Dashboard requerida:**
```
Auth → JWT expiry: 604800 (7 días)
Auth → Refresh token reuse interval: 10s
Auth → Refresh token rotation: ON
```

**Workbox runtime caching:**
```
res.cloudinary.com  → CacheFirst  (30 días)
/api/*              → NetworkFirst (5s timeout)
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
