# Sprint: Deuda Técnica Global — 2026-03-27

## Contexto
Auditoría completa de deuda técnica + resolución de ítems críticos y altos.

---

## Auditoría realizada

| Categoría | Issues encontrados |
|---|---|
| `as any` / `: any` | 50+ |
| TODO/FIXME | 26 |
| `console.log` sin guarda DEV | 51+ |
| Colores hardcodeados | 25+ |
| `process.env` en frontend | 5 |
| Fetch directo externo | 2 (dolarapi) |
| URLs hardcodeadas | 4 |
| Error boundaries faltantes | 7 páginas |

---

## Resuelto esta sesión

### PWA (commit ddc3260)
- Conflicto manifest: VitePWA generaba `manifest.webmanifest` sin usar → `manifest: false`
- `public/manifest.json` + `id` y `scope` (requeridos Lighthouse PWA audit)

### C1 — console.log sin guarda en frontend (commit 43d209d)
- `AdPreviewCard.tsx`: eliminados 9 logs de debugging en render (se ejecutaban en cada render en prod)
- `categoryCache.ts`: 10 logs → detrás de `import.meta.env.DEV`
- `draftManager.ts`: 5 logs operacionales → detrás de `import.meta.env.DEV`
- `CategoryCarousel.tsx`: log de duplicados → detrás de `import.meta.env.DEV`
- `userFeaturedService.ts`: 2 logs de featured → detrás de `import.meta.env.DEV`

### C2 — fetch directo a dolarapi.com (commit 43d209d)
- Creado BFF `backend/app/api/dollar-rates/route.ts` con cache servidor 30min
- `TopNav.tsx` actualizado para consumir `/api/dollar-rates` en lugar de llamar directamente
- Beneficio: todos los usuarios comparten 1 request cada 30min (antes: 1 por usuario)

### C3 — `process.env.NODE_ENV` en frontend (commit 43d209d)
- Reemplazado por `import.meta.env.DEV` en: `CategoryContext.tsx`, `CategoryCarousel.tsx`, `userFeaturedService.ts`, `useContentModeration.ts`

### A1 — `as any` eliminados (commit cce9e45)
- `AuthContext.tsx` → `UserProfile` extendido con campos de billing/ubicación:
  `domicilio`, `codigo_postal`, `cuit`, `billing_same_address`,
  `billing_address`, `billing_localidad`, `billing_provincia`, `billing_codigo_postal`
- `ProfilePanel.tsx`: 18 casteos `(profile as any)` → tipado correcto
- `DynamicHomeSections.tsx`: 12 casteos eliminados
  - Nuevos tipos: `AdImage`, `FeaturedRow`, `SubcatRow`
  - `AdItem.images` tipado como `(string | AdImage)[]`
  - `AdItem.subcategories` agregado al interface
  - `ErrorBoundary` constructor tipado correctamente

---

## Pendiente (backlog)

### A2 — Error boundaries (7 páginas)
`HomePage`, `SearchPage`, `AdDetailPage`, `FeaturedCheckoutPage`, `PaymentResultPage`, `DiagnosticsPage`, `APITest`
→ Sin error boundary React: un crash silencioso deja pantalla en blanco sin feedback al usuario

### Backend search `as any` (moderado)
`backend/app/api/ads/search/route.ts` y `backend/app/api/config/filters/route.ts`
→ Casteos de resultado Supabase sin tipos generados — aceptable hasta tener Supabase type-gen

### Moderado (cosmético)
- Colores hardcodeados fuera de tokens `brand-*` (25+ instancias)
- 26 TODOs — mayoría features pendientes, no bugs
- URLs Cloudinary hardcodeadas como fallback en Login/Register/Header

---

## Commits
- `ddc3260` fix(pwa): eliminar conflicto de manifests y agregar id/scope
- `43d209d` fix(td): resolver deuda técnica crítica C1/C2/C3
- `cce9e45` fix(td): eliminar as any en ProfilePanel y DynamicHomeSections (A1)
