## ⚠️ REGLA DE ORO #0 — LOCAL = DEV (ABSOLUTA, PRIORIDAD MÁXIMA DE TODAS)

**ANTES de cualquier acción en PROD: LOCAL debe ser 100% igual a DEV.**

Esto significa SIN EXCEPCIÓN:
1. Cero archivos sin commitear (`git status` limpio)
2. Cero commits sin pushear a `origin/main` (`git log origin/main..HEAD` vacío)
3. DEV DB y LOCAL usan la misma instancia Supabase DEV — misma DB, sin divergencia posible
4. Migraciones: SIEMPRE descargar backup SQL antes de aplicar cualquier migración
5. El flujo es: LOCAL ✓ → DEV ✓ → comparar `main` vs `prod` en GitHub → recién ahí PROD

**El Sync Panel en `#/sync-panel` es la herramienta que verifica y ejecuta este flujo.**
**Las acciones de PROD están bloqueadas si LOCAL tiene pendientes.**

---

# CLAUDE.md — Rural24 Orchestrator
> Auto-cargado por Claude Code al inicio de cada sesión.
> Última actualización: 2026-03-28
> Governance detallado: `.claude/` | Legado Cursor: `OlderCursor/`

---

## ⚠️ REGLA DE ORO — DISEÑO UI/UX (PRIORIDAD MÁXIMA)

**NUNCA modificar layouts, estilos, componentes visuales o estructura de pantallas sin aprobación explícita del usuario.**

Esto incluye SIN EXCEPCIÓN:
- Cambios de layout (grid, flex, columnas, stacking)
- Cambios de colores, tipografía, espaciado
- Reemplazar componentes visuales (ej: accordion → miller columns)
- Agregar o quitar secciones visibles al usuario
- Cambios responsive (breakpoints, mobile vs desktop)

**Flujo obligatorio:**
1. Consultar al agente diseñador UX/UI (`subagent_type: Plan`) con contexto completo
2. Presentar propuesta al usuario con mockup/descripción clara
3. Usuario aprueba explícitamente
4. Solo entonces se implementa

Si un cambio funcional implica también un cambio visual → preguntar antes igualmente.

---

## ⚠️ REGLA DE ORO — PRODUCCIÓN (PRIORIDAD MÁXIMA)

**ANTES de ejecutar cualquier acción que afecte PROD, el Orquestador DEBE pedir confirmación explícita al usuario.**

Esto incluye SIN EXCEPCIÓN:
- Migraciones DB contra PROD (`db-run-migrations.mjs prod`, `db-apply-snapshot.mjs prod`)
- Push de schema/datos a PROD (`db-push.mjs prod`, `db-clone-config.mjs`)
- Deploy manual de código a Render Prod
- Cualquier script o SQL que escriba, borre o altere datos/schema en Supabase PROD

**Flujo obligatorio:**
1. Orquestador propone la acción con detalle de qué va a hacer
2. Usuario (único superadmin del sistema) aprueba explícitamente
3. Solo entonces se ejecuta

Esta regla aplica también a agentes/subagentes delegados: deben reportar al Orquestador primero y NO ejecutar acciones PROD por su cuenta.

---

## ⚠️ REGLA DE ORO — SISTEMA DESTACADOS / pg_cron (FUNCIONALIDAD CORE)

**Los Destacados son la principal fuente de monetización de Rural24. Los cron jobs de pg_cron son SAGRADOS.**

### Jobs pg_cron — ÚNICOS, INMUTABLES, NO DUPLICAR

| Job | Schedule | Función |
|---|---|---|
| `rural24-activate-featured` | `*/15 * * * *` | `pending → active` cuando `scheduled_start <= NOW()` |
| `rural24-expire-featured` | `*/15 * * * *` | `active → expired` cuando `expires_at <= NOW()` |
| `rural24-featured-expiry-check` | `0 12 * * *` | Inserta notificación campanita 24h antes de vencer |

### Ciclo de vida de un Destacado

```
PAGO CONFIRMADO
      ↓
featured_ads.status = 'pending'  (scheduled_start = fecha futura o NOW)
      ↓  (pg_cron cada 15 min)
featured_ads.status = 'active'   (activated_at seteado, visible en homepage/resultados)
      ↓  (pg_cron cada 15 min)
featured_ads.status = 'expired'  (expires_at alcanzado, sale de homepage/resultados)
      ↓  (pg_cron diario 12:00, 24h antes)
notificación campanita → "¡Tu destacado vence mañana!"
```

### Columnas canónicas de featured_ads
- `status`: `pending | active | expired`
- `scheduled_start`: cuándo debe activarse
- `expires_at`: cuándo debe expirar  ← **NO `ends_at`** (columna legacy eliminada)
- `activated_at`: timestamp de activación real

### Reglas ABSOLUTAS para nuevas migraciones con pg_cron

1. **ANTES** de crear un cron job: `SELECT jobname FROM cron.job` — verificar que no existe
2. **SIEMPRE** usar `cron.unschedule('nombre')` antes de `cron.schedule('nombre', ...)` en la migración
3. **NUNCA** crear jobs con nombres distintos a los canónicos de arriba
4. **NUNCA** usar columnas `ends_at` o `activated_at` — son legacy y no existen
5. Si hay duda: consultar `cron.job` en DEV y PROD antes de tocar nada

**Violación de esta regla = doble-activación de destacados = bugs de facturación.**

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
database/RURAL24_SCHEMA_DEV_2026-03-28.sql
```
Dump real de DEV generado 2026-03-28. Consultar SIEMPRE antes de crear tablas, columnas o RPCs.
Schema anterior disponible en `database/RURAL24_SCHEMA_DEV_2026-03-23.sql`.
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
- Auth guard: `withAuth(request, handler)` en `backend/infrastructure/auth/guard.ts` → expone `user.id`, `user.email`, `user.role`, `user.full_name`

### Git / Deploy
- Trabajo diario en `main` → Render auto-deploya Staging
- Producción: PR `main → prod` + trigger manual en Render Prod

---

## SISTEMA DE EMAILS TRANSACCIONALES

**Supabase NO envía emails.** `enable_confirmations = false` en `supabase/config.toml`. El backend maneja todo vía Zoho Mail.

| Tipo | Disparador | Flujo |
|---|---|---|
| `welcome` (OAuth) | Trigger SQL `trg_welcome_email` → `email_queue` | Worker 2min → `sendWelcomeEmail()` |
| `welcome_verify` (email/pwd) | Mismo trigger | Worker → `generateLink('magiclink')` → `sendWelcomeVerifyEmail()` |
| `featured_activated` | Trigger SQL en `featured_ads` (pending→active) | Worker 2min → `sendFeaturedActivatedEmail()` |
| `contact_form` | POST `/api/contact` | Sync directo → `sendContactEmail()` |

- **Templates**: tabla `email_templates` en DB, editables desde `#/email-templates-admin`. Fallback hardcodeado en `emailService.ts` si no existe en DB.
- **Resend verification**: `POST /api/auth/resend-verification` (requiere Bearer). EmailGatePage: 120s cooldown + localStorage `rural24_resend_{email}` + máx 1 resend.
- **Magic link confirm**: redirige a `/#/auth/confirm` → `EmailConfirmationPage.tsx`
- **NUNCA usar `supabase.auth.resend()`** — no funciona con `enable_confirmations = false`

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
| 5D | AdDetail — reescritura completa (Hero + Secciones v2 + Contacto) | ✅ Completo |
| 3F | Display Logic — conectar RPCs featured a frontend | ✅ Completo |
| 6A-6D | Sistema Multi-Empresa completo | ✅ Completo |
| 7A | Account Switcher + Social Proof EmpresaPublicPage | ✅ Completo |
| 7B | ProfileGate + Unificación Taxonomía Servicios/Empresas + Fix Roles | ✅ Completo |
| 8A | Constructor Formularios + Taxonomía 3 niveles + Backend BFF | ✅ Completo |
| 8A fixes | Icons FormBuilderAdmin, toggle colapso, delete CRUD TaxonomiaAdmin, 194 dups DB | ✅ 2026-03-14 |
| 8B | PublicarAviso: Step 1 navegar 3 niveles + BlockRenderer + DynamicFormLoader | ✅ Completo |
| 8C | TaxonomiaAdmin 4 niveles + seed 369 subcategorías | ✅ Completo |
| 8D | wizard_configs DB + option_list price-currencies | ✅ Completo |
| 9 | Mobile UX: BottomNav, drill-down wizard, edit unificado, slugs informativos | ✅ Completo |
| 10 | Notificaciones campanita + Favoritos (Fase 1) | ✅ Completo |
| Chat-A | Chat P2P: canales, mensajes, realtime, ChatWindow/ChatList/Badges | ✅ 2026-03-18 |
| Chat-B | Notificación vendedor + enmascarado datos sensibles | ✅ 2026-03-18 |
| UX-Mobile | BottomNav 80px + safe-area, 5 tabs (FAB Publicar + Chat + Alertas) | ✅ 2026-03-18 |
| UX-Desktop | Header: campanita reemplaza Favoritos, Chat abre overlay inline | ✅ 2026-03-18 |
| 7C | ProductCard badge INSUMO/SERVICIO + price_unit + completeness bar | ✅ Ya implementado (verificado 2026-03-24) |
| 3D.6 | Notificación al activar Destacado (pg_cron → email) | Pendiente |
| Email-Resend | Resend verification email: 120s cooldown + localStorage + max 1 resend | ✅ 2026-03-28 |
| CI-Fix | GitHub Actions: job security tenía bundle size check sin build previo | ✅ 2026-03-28 |

## TAXONOMÍA (Sprint 7B — decisión de producto)
- **PRODUCTO** (ad_type=particular): Hacienda, Insumos, Maquinarias — sin gate, cualquier usuario
- **SERVICIO** (ad_type=company): Servicios — gate bloqueante, requiere empresa creada
- Subcategorías "Empresas" desactivadas del wizard (unificadas con "Servicios")
- `role` es la fuente de verdad para plan/features — NO `plan_name`
