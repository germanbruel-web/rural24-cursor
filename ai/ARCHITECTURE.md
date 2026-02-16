# ARCHITECTURE — Rural24
> Fuente de verdad arquitectónica. Ningún agente puede contradecir este documento.

**Última actualización:** 2026-02-16  
**Producto:** Marketplace de clasificados agropecuarios (Argentina)  
**Etapa:** MVP en producción, pre-growth  

---

## FILOSOFÍA TÉCNICA

1. **Pragmatismo sobre purismo.** Cada decisión se justifica por valor de usuario o reducción de riesgo, no por moda técnica.
2. **Una sola fuente de verdad por concepto.** Si hay dos tablas para lo mismo, una sobra.
3. **Interfaces primero.** Cache, rate limiting, sesiones: usan interfaces (`ICache`, `IRateLimiter`) para swap futuro sin reescribir.
4. **Crecimiento incremental.** Free tier hoy, Redis mañana, solo cuando las métricas lo exijan.
5. **Ship fast, fix forward.** Preferir soluciones que funcionen hoy y se puedan mejorar, sobre diseños perfectos que nunca se lanzan.

---

## STACK INMUTABLE

| Capa | Tecnología | Versión | Decisión |
|------|-----------|---------|----------|
| **Frontend** | React + Vite | 19 + 7.3 | SPA, NO SSR en frontend |
| **Backend** | Next.js (API Routes only) | 16 | Solo API, SSR mínimo (SEO pages) |
| **Base de datos** | PostgreSQL via Supabase | — | Auth + DB + RLS + RPCs |
| **ORM** | Supabase JS SDK | 2.89 | Prisma solo para schema docs |
| **Imágenes** | Cloudinary | 2.8 | CDN + transformaciones |
| **Deploy** | Render | — | Free tier, monorepo |
| **Monorepo** | npm workspaces + Turborepo | — | — |
| **Lenguaje** | TypeScript | 5.7-5.8 | Estricto donde se pueda |
| **CSS** | Tailwind CSS | 3.4 | Utility-first |

### NO permitido introducir
- Otro framework frontend (Vue, Svelte, Angular)
- Otro ORM runtime (Drizzle, TypeORM, Knex) — Supabase SDK es el acceso a datos
- GraphQL — REST es suficiente para este producto
- Microservicios — Monolito modular
- Docker en producción (Render no lo requiere en free tier)
- Redux/Zustand/MobX — Context API + hooks es suficiente

---

## DECISIONES INMUTABLES

### Autenticación
- **Proveedor:** Supabase Auth (email/password + OAuth)
- **Frontend:** Token via `supabase.auth.getSession()`, auto-refresh
- **Backend:** `withAuth()` guard valida Bearer token via `supabase.auth.getUser()`
- **Roles:** `superadmin`, `revendedor`, `premium`, `free`
- **Tipos de usuario:** `particular`, `empresa`
- **RLS:** Habilitado en todas las tablas con datos de usuario
- **Verificación móvil:** OTP 4 dígitos via `/api/phone/send-code` + `/api/phone/verify` (Feb 2026). Rate limit 60s, max 5 intentos, 10 min expiry. Dev mode: código "1234".

### Acceso a datos
- **Frontend → Supabase directamente** (anon key, RLS protege): lecturas públicas, auth
- **Frontend → Backend API** (Bearer token): escrituras, operaciones protegidas, admin
- **Backend → Supabase** (service_role key): operaciones privilegiadas, cron, admin
- **Migración en curso:** Frontend migrando de Supabase directo a Backend API (feature flags en `config/features.ts`)

### Imágenes
- Upload: Cliente comprime → Backend valida → Cloudinary almacena
- Servido desde CDN de Cloudinary con auto-format y auto-quality
- R2 preparado como backup, no activo

### Sesiones
- Stateless via tokens de Supabase
- `session-manager.ts` y `session-adapter.ts` existen pero NO se usan — auth real es via Supabase tokens

### Design System RURAL24
- **Fuente de verdad**: CSS variables en `frontend/src/index.css` (:root)
- **Consumo**: `frontend/tailwind.config.js` lee las CSS vars → componentes usan clases `brand-*`
- **Paleta principal**: `brand-500` (primary), `brand-600` (hover), `brand-700` (active), `brand-950` (dark headings)
- **NUNCA usar hex hardcoded** (`#16a135`, `#1b2f23`) ni clases Tailwind genéricas (`green-600`, `green-700`)
- **Componentes**: Atomic Design — `atoms/` → `molecules/` → `organisms/` → `sections/` → `pages/`
- **Showcase**: `frontend/src/components/DesignSystemShowcaseSimple.tsx` — accesible en dashboard para superadmin (`#/design-system`)
- **Card de producción**: `ProductCard` (organism) — card clickeable completa, SIN botón "Ver Detalle", precio en pill verde con `border-l-4 border-brand-500`
- **Avisos destacados**: `UserFeaturedAdsBar` — contenedor `bg-brand-50/70 border-brand-100 rounded-xl` con grid 5 cols compact

---

## ESTRATEGIA DE ESCALABILIDAD

### Fase actual: 0-300 usuarios
- In-memory cache (LRU, 10K entries)
- In-memory rate limiter (sliding window)
- Render free tier (cold starts aceptables)
- Supabase free tier
- Sin CDN adicional (Cloudinary sirve imágenes)

### Fase 2: 300-1500 usuarios
- Activar Redis (`REDIS_ENABLED=true`) para cache + rate limiting
- Render paid tier (elimina cold starts)
- Supabase Pro (más conexiones, más auth emails)
- Custom SMTP (SendGrid/Resend)

### Fase 3: 1500+ usuarios
- Redis cluster
- Connection pooling via Supabase
- CDN edge (Cloudflare) para assets estáticos
- Considerar React Router + code splitting por ruta
- Monitoreo: Sentry + PostHog

---

## ESTRATEGIA DE SEGURIDAD

### Capas de protección
1. **RLS (Row Level Security)** en Supabase — primera línea
2. **`withAuth()` guard** en backend — segunda línea
3. **Rate limiting** por IP — tercera línea
4. **Input validation** con Zod — cuarta línea
5. **CORS** — origen único desde `FRONTEND_URL`
6. **Security headers** — HSTS, X-Frame-Options, CSP (report-only), Permissions-Policy

### Reglas de seguridad
- NUNCA crear otro Supabase client inline en una ruta — usar `getSupabaseClient()` singleton
- NUNCA pasar service_role key al frontend
- NUNCA aceptar campos arbitrarios en PATCH/PUT — siempre whitelist
- SIEMPRE validar input con Zod antes de escribir a DB
- SIEMPRE verificar roles en backend, no confiar solo en frontend

---

## ESTRATEGIA DE CRECIMIENTO DEL CÓDIGO

### Estructura de carpetas
```
rural24/
├── ai/                    ← Contexto para agentes IA (este directorio)
├── backend/
│   ├── app/api/           ← Rutas API (Next.js App Router)
│   ├── app/services/      ← Servicios de aplicación (orquestación)
│   ├── domain/            ← Lógica de negocio (repository + service + types)
│   ├── infrastructure/    ← Adapters (cache, auth, DB, images, rate-limit)
│   ├── prisma/            ← Schema (documentación, no runtime)
│   └── types/             ← Schemas Zod compartidos
├── frontend/
│   ├── src/components/    ← Componentes React (Atomic Design + feature folders)
│   ├── src/services/      ← Llamadas a API/Supabase
│   ├── src/hooks/         ← Custom hooks
│   ├── src/contexts/      ← React Context providers
│   ├── src/config/        ← Feature flags, API config
│   └── src/pages/         ← Páginas principales
├── database/              ← Scripts SQL de migración
└── scripts/               ← Scripts de utilidad (PowerShell)
```

### Convenciones de naming
| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `FeaturedAdModal.tsx` |
| Hooks | camelCase con `use` | `useImageUpload.ts` |
| Servicios | camelCase + `Service` | `adsService.ts` |
| Rutas API | kebab-case | `/api/featured-ads/cron` |
| Tablas DB | snake_case | `featured_ads` |
| Columnas DB | snake_case | `created_at` |
| Tipos TS | PascalCase | `FeaturedAd` |
| Schemas Zod | PascalCase + `Schema` | `CreateAdSchema` |
| Constantes | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |

### Reglas de crecimiento
- Archivos > 500 líneas → split obligatorio
- Componentes con > 3 responsabilidades → extraer hooks/subcomponentes
- Servicios duplicados → unificar ANTES de agregar features
- Nueva tabla → agregar al schema.prisma como documentación
- Nuevo endpoint → SIEMPRE con `withAuth()` si escribe datos
- Nuevo componente → ubicar en Atomic Design (atoms/molecules/organisms) o feature folder

---

## CONTEXTO DE NEGOCIO

**Rural24** es un marketplace de clasificados agrícolas argentino:
- Compra/venta de maquinaria agrícola, vehículos rurales, insumos, servicios
- Usuarios publican avisos con fotos, atributos dinámicos por categoría
- Sistema de avisos destacados con créditos
- Panel SuperAdmin para gestión completo
- SEO optimizado via backend SSR para páginas de detalle/categorías
- Monetización: planes de suscripción + créditos para destacar avisos
- Verificación de celular con OTP para contacto confiable
- Perfil unificado ("Mi Cuenta"): datos personales + plan + créditos en una sola página
- Post-login nudge: redirige a completar perfil (nombre, celular verificado, ubicación)

**Usuarios objetivo:**
- Productores agropecuarios
- Concesionarias rurales
- Proveedores de insumos
- Target geográfico: Argentina interior (provincias agrícolas)
