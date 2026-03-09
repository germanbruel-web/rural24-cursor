# Sprint 8 — URL Routing: Hash → History API (Clean URLs)
> Planificado: 2026-03-09 | Estado: PENDIENTE | Prioridad: Media-Alta

---

## Objetivo

Eliminar el `#` de todas las URLs de Rural24. Pasar de hash routing custom
a React Router v6 con History API.

**Antes:** `https://rural24.com/#/empresa/agrowellness-1a2b`
**Después:** `https://rural24.com/empresa/agrowellness-1a2b`

---

## Diagnóstico del sistema actual

### Routing custom actual
- `window.location.hash` leído directamente en cada componente
- `navigateTo(path)` helper en `frontend/src/hooks/useNavigate.ts`
- `onNavigate(page: Page)` prop drilling desde `App.tsx` hacia todos los componentes
- `Page` type union en `App.tsx` (todos los nombres de página como string literals)
- Switch/case en `App.tsx` para renderizar la página correcta

### Páginas internas (dashboard)
| Hash actual | URL objetivo |
|---|---|
| `#/my-ads` | `/dashboard` o `/mis-avisos` |
| `#/mis-empresas` | `/mis-empresas` |
| `#/profile` | `/perfil` |
| `#/inbox` | `/mensajes` |
| `#/deleted-ads` | `/avisos-eliminados` |
| `#/users` | `/admin/usuarios` |
| `#/banners` | `/admin/banners` |
| `#/ad-finder` | `/admin/buscador` |
| `#/categories-admin` | `/admin/categorias` |
| `#/attributes-admin` | `/admin/atributos` |
| `#/publicar` | `/publicar` |

### Páginas públicas (ya tienen slug — mantener)
| Hash actual | URL objetivo |
|---|---|
| `#/empresa/:slug` | `/empresa/:slug` ✅ |
| `#/ad/:slug` | `/aviso/:slug` |
| `#/search` | `/buscar` |
| `#/` | `/` |

---

## Plan de implementación

### Paso 1 — Instalar React Router v6
```bash
npm install react-router-dom@6 --workspace=frontend
```

### Paso 2 — Configurar Render para SPA redirect
En `render.yaml` o panel de Render (Static Site):
```
Rewrite rules:
  Source: /*
  Destination: /index.html
  Action: Rewrite
```
Sin esto, un refresh directo en `/empresa/slug` devuelve 404.

### Paso 3 — Refactorear App.tsx
- Reemplazar hash switch por `<BrowserRouter>` + `<Routes>` + `<Route>`
- Eliminar el tipo `Page` y `onNavigate` prop
- Cada componente de página usa `useNavigate()` de React Router y `useParams()`
- `navigateTo(path)` helper reemplazado por `navigate(path)` de useNavigate

### Paso 4 — Migrar páginas públicas (SEO crítico)
Prioridad alta porque impactan SEO:
- `/` → HomePage
- `/empresa/:slug` → EmpresaPublicPage
- `/aviso/:slug` → AdDetailPage
- `/buscar` → SearchPage (con query params)

### Paso 5 — Migrar páginas de dashboard (auth-gated)
Usar un `<PrivateRoute>` wrapper:
```tsx
<Route element={<PrivateRoute />}>
  <Route path="/dashboard" element={<MyAdsPanel />} />
  <Route path="/mis-empresas" element={<MisEmpresasPanel />} />
  <Route path="/perfil" element={<ProfilePanel />} />
  ...
</Route>
```

### Paso 6 — Migrar rutas admin
```tsx
<Route element={<AdminRoute requiredRole="superadmin" />}>
  <Route path="/admin/usuarios" element={<UsersPanel />} />
  <Route path="/admin/banners" element={<BannersPanel />} />
  ...
</Route>
```

### Paso 7 — Eliminar prop drilling de onNavigate
Actualmente `onNavigate` se pasa a todos los componentes. Con React Router,
cada componente llama `useNavigate()` directamente. Esto simplifica mucho
la jerarquía de props.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Render 404 en refresh | Configurar rewrite rule ANTES de deployar |
| Links hardcodeados con `#/` en toda la app | Grep + replace sistemático |
| `onNavigate` prop en 20+ componentes | Migrar gradualmente, coexistencia temporal posible |
| AccountSwitcher usa hash navigation | Migrar a `useNavigate()` |
| EmpresaPublicPage lee hash directamente | Migrar a `useParams()` |

---

## Dependencias previas
- [ ] Decidir mapa completo de URLs nuevas (español vs inglés)
- [ ] Configurar rewrite en Render (staging primero)
- [ ] Freeze de feature nuevas durante la migración (1-2 sesiones)

---

## Estimación
- Instalación + config Render: 30 min
- Migrar App.tsx + páginas públicas: 3-4h
- Migrar dashboard + admin: 2-3h
- Testing + fix edge cases: 1-2h
- **Total: 1 sesión completa intensiva (6-8h)**

---

## URLs finales propuestas (para validar con usuario)

```
/                          → Home
/buscar                    → Búsqueda
/aviso/:slug               → Detalle de aviso
/empresa/:slug             → Fanpage empresa

/publicar                  → Wizard publicación
/dashboard                 → Mis avisos (antes my-ads)
/mis-empresas              → Gestión de empresas
/perfil                    → Mi perfil
/mensajes                  → Inbox

/admin                     → Panel admin (redirect a /admin/usuarios)
/admin/usuarios            → Gestión usuarios
/admin/banners             → Banners
/admin/buscador            → Ad finder
/admin/categorias          → Categorías
/admin/atributos           → Formularios dinámicos
```
