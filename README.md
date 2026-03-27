# Rural24

Plataforma de clasificados rurales — compra/venta de hacienda, maquinaria, insumos y servicios agropecuarios.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 7.3 (SPA, sin SSR) |
| Backend | Next.js 15 (API Routes — BFF) |
| Base de datos | PostgreSQL via Supabase (Auth + RLS + RPCs) |
| ORM | Supabase JS SDK (Prisma solo para documentación de schema) |
| Imágenes | Cloudinary CDN |
| CSS | Tailwind 3.4 + CSS vars `brand-*` |
| Deploy | Render (monorepo), Turborepo + npm workspaces |

## Estructura

```
rural24-cursor/
├── frontend/        # React SPA (Vite)
├── backend/         # Next.js BFF (API Routes)
├── database/        # Schema SQL + migraciones
├── supabase/        # Migraciones Supabase
└── .claude/         # Sprints, docs y agentes Claude Code
```

## Entornos

- **DEV / Staging** — rama `main`, deploy automático en Render
- **PROD** — rama `prod`, PR manual + trigger en Render

## Variables de entorno

Copiar `.env.example` → `.env.local` en `frontend/` y `backend/`.

Variable clave: `CLOUDINARY_ENV=dev` (local y Render DEV) / `CLOUDINARY_ENV=prod` (Render PROD).

## Desarrollo local

```bash
npm install
npm run dev        # levanta frontend (5173) + backend (3001) en paralelo
```

## Migraciones DB

```bash
node scripts/db-run-migrations.mjs dev    # aplica en DEV
node scripts/db-run-migrations.mjs prod   # aplica en PROD (requiere confirmación)
```

Ver `.claude/docs/` para guías detalladas de base de datos y arquitectura.
