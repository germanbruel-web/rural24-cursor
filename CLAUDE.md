# CLAUDE.md — Rural24 Orchestrator
> Auto-cargado por Claude Code al inicio de cada sesión.
> Última actualización: 2026-03-09 09:00
> Governance detallado: `.claude/` | Legado Cursor: `OlderCursor/`

---

## REGLAS OBLIGATORIAS DE SESION

1. Leer este archivo + `MEMORY.md` antes de cualquier acción
2. Revisar la DB existente antes de generar SQL nuevo (ver fuente de verdad abajo)
3. Pensar como producto real, no ejemplo académico
4. Documentar cada decisión/sprint en `.claude/sprints/` con fecha y hora

---

## STACK INMUTABLE

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 7.3, SPA, NO SSR |
| Backend | Next.js 15, API Routes only (BFF) |
| DB | PostgreSQL via Supabase (Auth + RLS + RPCs) |
| ORM | Supabase JS SDK — Prisma = solo docs, NUNCA runtime |
| Imágenes | Cloudinary CDN |
| Deploy | Render (monorepo), Turborepo + npm workspaces |
| CSS | Tailwind 3.4 + CSS vars `brand-*` — NUNCA hex hardcoded |

> README.md dice React 19/Next.js 16/Prisma ORM → **INCORRECTO**. Este archivo manda.

---

## FUENTE DE VERDAD DB

```
database/RURAL24_COMPLETE_SCHEMA_2026-02-16.sql
```
Consultar SIEMPRE antes de crear tablas, columnas o RPCs.
Migraciones van en: `supabase/migrations/YYYYMMDDHHMMSS_descripcion.sql`

---

## DISEÑO — TOKENS

- Variables en `frontend/src/index.css` (:root) → `tailwind.config.js`
- Tokens: `brand-500` (primary), `brand-600` (hover), `brand-700` (active)
- NUNCA: `slate-*`, `blue-*`, `amber-*`, hex hardcoded
- Tiers destacados: baja=`brand-400→500`, media=`brand-500→600`, alta=`brand-600→700`

---

## PATRONES OBLIGATORIOS

### Operaciones financieras
- SIEMPRE via RPC en DB, NUNCA desde frontend
- Tabla canónica: `user_wallets.virtual_balance` (ARS)
- Ledger: `wallet_transactions`

### Componentes UI
- Atomic Design: `atoms/ → molecules/ → organisms/ → sections/ → pages/`
- Drawers: `fixed inset-y-0 right-0 z-50`, animación `.drawer-enter` (slideInRight 0.25s)
- Modals destructivos: confirmar con `window.confirm()` antes de ejecutar

### Backend API
- Validación: Zod en todas las rutas
- Singleton Supabase: no crear múltiples instancias
- service_role key: NUNCA en frontend, solo en variables de entorno backend

### Git / Deploy
- Trabajo diario en `main` → Render auto-deploya Staging
- Producción: PR `main → prod` + trigger manual en Render Prod

---

## SISTEMA FINANCIERO (Wallet Fase 2)

- Concepto "créditos" ELIMINADO — todo opera en ARS
- `coupons.ars_amount` + `featured_durations.price_ars`
- `global_config.featured_slot_price_ars` = 2500
- MercadoPago: deshabilitado en Profile (solo futuro checkout Destacados)
- Tablas legacy NO eliminar: `user_credits`, `user_featured_credits`, `credit_transactions`

---

## FORMULARIOS DINÁMICOS (Sprint 4A — activo)

- Sistema activo: `form_templates_v2` + `form_fields_v2`
- Sistema legacy (freeze): `dynamic_attributes`
- Nuevo: `option_lists` + `option_list_items` (catálogos centralizados)
- Admin UI: `#/attributes-admin` → tabs Atributos / Formularios / Listas de Opciones
- Doc completa: `.claude/sprints/SPRINT_4A_OPTION_LISTS.md`

---

## ARCHIVOS CLAVE

| Archivo | Propósito |
|---|---|
| `CLAUDE.md` | Este archivo — orchestrator auto-cargado |
| `.claude/sprints/` | Documentación por sprint con fecha/hora |
| `.claude/docs/` | Guías, scripts DB, análisis |
| `.claude/agents/` | Definiciones de agentes Claude Code |
| `OlderCursor/` | Legado Cursor — solo referencia histórica |
| `C:\Users\German\.claude\projects\...\memory\MEMORY.md` | Memoria dinámica persistente |

---

## PROXIMOS SPRINTS

| Sprint | Objetivo | Estado |
|---|---|---|
| 5D | AdDetail — reescritura completa (Hero + Secciones v2 + Contacto) | En progreso |
| 3F | Display Logic — conectar RPCs featured a frontend | Pendiente |
| 3D.6 | Notificación al activar Destacado (pg_cron → email) | Pendiente |
