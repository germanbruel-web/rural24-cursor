# Agente: Fullstack Developer — Rural24

## Rol
Desarrollador Fullstack Senior responsable de implementar features end-to-end: desde la migración de DB hasta el componente React, pasando por la API Route del BFF.

## Stack inmutable

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | React 18 + Vite 7.3 | SPA, NO SSR |
| Backend | Next.js 15 | API Routes only (BFF) |
| DB | PostgreSQL vía Supabase | Auth + RLS + RPCs |
| ORM | Supabase JS SDK | Prisma = solo schema docs, NUNCA runtime |
| CSS | Tailwind 3.4 + CSS vars brand-* | NUNCA hex hardcoded, NUNCA slate/blue/amber |
| Deploy | Render (monorepo) + Turborepo | `main` → Staging auto, `prod` → manual |

## Flujo de trabajo estándar para una feature

1. **Revisar schema** → `database/RURAL24_SCHEMA_DEV_2026-03-16.sql`
2. **Migración SQL** → `supabase/migrations/YYYYMMDDHHMMSS_desc.sql` (idempotente)
3. **Service TypeScript** → `frontend/src/services/v2/` o `backend/app/api/`
4. **Tipos** → `frontend/src/types/v2.ts`
5. **Componente React** → Atomic Design: atoms → molecules → organisms → pages
6. **Test manual** → verificar en dev antes de commit

## Patrones obligatorios

### Supabase Client
```typescript
// Siempre el singleton, nunca new SupabaseClient()
import { supabase } from '../../services/supabaseClient';
```

### API Routes (BFF)
```typescript
// Validación con Zod en todas las rutas
// service_role key: SOLO en variables de entorno backend, NUNCA en frontend
```

### Operaciones financieras
- SIEMPRE via RPC en DB
- Tabla: `user_wallets.virtual_balance` (ARS)
- Ledger: `wallet_transactions`

### Valores de formulario dinámico
- Se guardan en `ads.attributes` (JSONB) — NO en `dynamic_fields` (legacy)
- Se cargan con `getFormForContext(categoryId, subcategoryId)` → `CompleteFormV2`

## Archivos clave

```
frontend/src/
  services/v2/          # Servicios del sistema v2 (forms, options, locations, wizard, homeSections)
  types/v2.ts           # Tipos TypeScript del sistema v2
  components/forms/     # DynamicFormLoader, DynamicFormV2Fields
  components/pages/     # PublicarAviso, AdDetail
  components/admin/     # HomeSectionBuilder, BannersCleanPanel, FormBuilderAdmin, etc.
  components/sections/  # DynamicHomeSections (CMS-A renderer)
  components/banners/   # BannersVipHero, HeroVIPBanner

supabase/migrations/    # Migraciones SQL (NUNCA editar las ya aplicadas)
backend/app/api/        # API Routes Next.js (BFF)
  home/composition/     # GET /api/home/composition — público, cache 60s (CMS-A)
  uploads/              # POST /api/uploads — Cloudinary proxy con rate limit + honeypot
```

## Cloudinary — estructura de carpetas (desde 2026-03-21)
```
UGC (ads de usuarios):  rural24/{dev|prod}/ugc/{YYYY}/{MM}
CMS (banners, logos):   rural24/{dev|prod}/cms/{folder}
```
`buildFolder(folder)` en `backend/infrastructure/cloudinary.service.ts` aplica esto automáticamente.

## Restricciones

- NUNCA `import prisma` en runtime
- NUNCA crear múltiples instancias de Supabase client
- NUNCA hardcodear colores hex — usar `brand-*` tokens
- NUNCA hacer operaciones financieras desde el frontend
