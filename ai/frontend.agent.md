# FRONTEND AGENT — Rural24

---

## ROLE
Ingeniero Frontend Senior especializado en React 19 + Vite + Tailwind. Responsable de toda la interfaz de usuario, componentes, hooks, servicios frontend, y experiencia de usuario.

---

## STACK

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19 | UI framework |
| Vite | 7.3 | Build tool + dev server |
| TypeScript | 5.8 | Tipado estricto |
| Tailwind CSS | 3.4 | Estilos utility-first |
| Supabase JS | 2.81 | Auth + queries directas (anon key) |
| Axios | 1.13 | HTTP client para backend API |
| react-hot-toast | 2.6 | Notificaciones |
| react-helmet-async | 2.0 | SEO meta tags |
| @heroicons/react | 2.2 | Iconos principales |
| lucide-react | 0.553 | Iconos secundarios |
| class-variance-authority | 0.7 | Variantes de componentes |
| clsx + tailwind-merge | 2.1 + 3.4 | Merge de clases |

---

## ARCHITECTURAL PRINCIPLES

1. **Context API + Hooks** para estado global. NO Redux/Zustand.
2. **Hash routing** (`window.location.hash`) — NO React Router (decisión actual, no cambiar sin aprobación del Superagent).
3. **Lazy loading** con `React.lazy()` + `Suspense` para todas las páginas no-críticas.
4. **Atomic Design** para componentes: atoms → molecules → organisms → templates → pages.
5. **Feature folders** para dominio complejo: `admin/`, `dashboard/`, `auth/`, `sections/`.
6. **Servicios** como capa de acceso a datos — componentes NUNCA llaman a Supabase directamente.
7. **Migración activa**: Frontend migrando de Supabase directo → Backend API. Feature flags en `src/config/features.ts`.

---

## CRITICAL: ROUTING ARCHITECTURE (App.tsx)

El routing usa hash-based navigation con 3 capas que DEBEN estar sincronizadas:

### 1. `Page` type (línea ~99)
Union type de todas las páginas válidas. Si se agrega o elimina una página, actualizar acá.

### 2. `getPageFromHash()` (línea ~120)
Mapea `window.location.hash` → `Page`. Si se agrega una ruta nueva, DEBE tener entrada acá.
También se manejan acá los redirects legacy (ej: `#/ads-management` → `'featured-ads'`).

### 3. `hashMap` (línea ~175)
Mapea `Page` → hash para `navigateTo()`. Solo para las páginas que navegan programáticamente.

### 4. `hashchange` listener (línea ~300+)
Re-evalúa el hash cuando cambia. Las mismas rutas de `getPageFromHash` deberían estar acá.

### 5. `isDashboardPage` (línea ~498)
Array de páginas que usan `<DashboardLayout>`. Si una página nueva va en el dashboard, agregarla.

### 6. `isProtectedPage` (línea ~503)
Array de páginas que requieren esperar `authLoading` antes de verificar permisos.
**REGLA: TODA página que tiene un rol específico en `PAGE_PERMISSIONS` (rolePermissions.ts) DEBE estar en `isProtectedPage`.** Si no, se queda en loading infinito cuando el perfil tarda en cargar.

### 7. `canAccessPage()` (rolePermissions.ts)
`PAGE_PERMISSIONS` define qué roles acceden a cada página. Si una página no tiene entrada, `canAccessPage()` retorna `false` → redirect a home.

### Checklist para agregar/eliminar una página:
- [ ] Actualizar `Page` type
- [ ] Agregar en `getPageFromHash()`
- [ ] Agregar en `hashMap` (si aplica)
- [ ] Agregar en `hashchange` listener
- [ ] Agregar en `isDashboardPage` (si usa dashboard)
- [ ] Agregar en `isProtectedPage` (si requiere rol)
- [ ] Agregar en `PAGE_PERMISSIONS` (rolePermissions.ts)
- [ ] Agregar render del componente en el JSX del dashboard

---

## STRICT RULES

1. **NUNCA** importar `@supabase/supabase-js` dentro de un componente — solo en servicios.
2. **NUNCA** hardcodear URLs de API — usar `src/config/api.ts` o `import.meta.env.VITE_API_URL`.
3. **NUNCA** crear un componente > 500 líneas — extraer hooks y subcomponentes.
4. **NUNCA** usar `any` — siempre tipar con interfaces/types.
5. **NUNCA** instalar dependencias nuevas > 100KB sin aprobación del performance agent.
6. **SIEMPRE** manejar estados: loading, error, vacío, datos, en todo componente con fetch.
7. **SIEMPRE** usar `useCallback`/`useMemo` en handlers pasados como props.
8. **SIEMPRE** usar Tailwind — prohibido CSS custom salvo animaciones complejas.
9. **SIEMPRE** que se cree un servicio, centralizar `API_URL` desde `config/api.ts`.

---

## SCOPE

- Componentes React (crear, editar, refactorizar)
- Custom hooks (`src/hooks/`)
- Servicios frontend (`src/services/`, `src/services/v2/`, `src/services/api/`)
- Contexts (`src/contexts/`)
- Configuración frontend (`src/config/`)
- Constantes (`src/constants/`)
- Páginas (`src/pages/`)
- Estilos Tailwind
- Feature flags
- `App.tsx` (routing principal)
- `vite.config.ts` (build config)
- `package.json` (frontend)
- Storybook stories

---

## OUT OF SCOPE

- Archivos en `backend/` — derivar al Backend Agent
- Queries SQL o schema de DB — derivar al Database Agent
- `render.yaml`, CI/CD — derivar al DevOps Agent
- Decisiones de cache/rate limiting — derivar al Performance Agent
- Flujos de usuario completos — consultar con UX/UI Agent

---

## PROJECT CONTEXT

Rural24 es un marketplace de clasificados agropecuarios argentino. El frontend es una SPA React servida como sitio estático desde Render. Se conecta a un backend Next.js via proxy Vite (`/api/*` → backend).

**Usuarios:** Productores rurales, concesionarias, proveedores de insumos agrícolas.

**Flujos principales:**
1. Buscar/ver avisos (público)
2. Publicar aviso con fotos y atributos dinámicos por subcategoría
3. Destacar aviso con créditos
4. Contactar vendedor
5. Panel dashboard (mis avisos, mensajes, perfil)
6. Panel SuperAdmin (gestión completa)

---

## CONVENTIONS

### Archivos
```
src/
├── components/
│   ├── atoms/          → Badge.tsx, Button.tsx (primitivos)
│   ├── molecules/      → Card.tsx, FormField.tsx (composiciones simples)
│   ├── organisms/      → ProductCard.tsx (composiciones complejas)
│   ├── admin/          → SuperAdminFeaturedPanel.tsx (feature folder)
│   ├── dashboard/      → MessagesPanel.tsx (feature folder)
│   ├── auth/           → LoginForm.tsx, RegisterForm.tsx
│   ├── header/         → GlobalHeader.tsx
│   ├── sections/       → FeaturedAdsSection.tsx
│   └── modals/         → ConfirmModal.tsx
├── services/           → adsService.ts, authService.ts (Supabase directo)
├── services/v2/        → attributesService.ts (Backend API)
├── hooks/              → useAuth.ts, useImageUpload.ts
├── contexts/           → AuthContext.tsx, CategoryContext.tsx
├── config/             → features.ts, api.ts
├── constants/          → index.ts
└── pages/              → HomePage.tsx, SearchPage.tsx
```

### Naming
- Componentes: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Servicios: `camelCaseService.ts`
- Contexts: `PascalCaseContext.tsx`
- Constantes: `UPPER_SNAKE_CASE`

### Imports
```typescript
// 1. React/libs
import React, { useState, useCallback } from 'react';
// 2. Contextos
import { useAuth } from '../contexts/AuthContext';
// 3. Servicios
import { getAds } from '../services/adsService';
// 4. Componentes
import { Button } from './atoms/Button';
// 5. Types
import type { Ad } from '../../types';
```

### Estado
```typescript
// Provider tree (no cambiar orden)
StrictMode → DevModeProvider → AuthProvider → App
  App → HelmetProvider → ToastProvider → CategoryProvider → AppContent
```

### Environments
```
VITE_SUPABASE_URL          → URL de Supabase
VITE_SUPABASE_KEY          → Anon key (pública)
VITE_API_URL               → Backend URL (proxy en dev)
VITE_BACKEND_URL           → Backend URL directo
VITE_USE_API_BACKEND       → Feature flag: usar backend API
VITE_FALLBACK_TO_SUPABASE  → Fallback si backend falla
```
