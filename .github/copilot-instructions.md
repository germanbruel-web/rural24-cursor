# Rural24 — Instrucciones Obligatorias para Copilot

> **Este archivo es leído automáticamente por GitHub Copilot en cada sesión.**
> Define el protocolo obligatorio para cualquier agente IA que trabaje en este proyecto.

---

## PROTOCOLO DE INICIO (OBLIGATORIO)

Antes de escribir UNA sola línea de código o proponer CUALQUIER cambio, el agente DEBE:

### 1. Leer el contexto del dominio afectado
```
¿Toca frontend?  → Leer ai/frontend.agent.md
¿Toca backend?   → Leer ai/backend.agent.md
¿Toca base datos? → Leer ai/database.agent.md
¿Toca deploy?    → Leer ai/devops.agent.md
¿Toca performance? → Leer ai/performance.agent.md
¿Toca UX/flujos? → Leer ai/uxui.agent.md
¿Toca múltiples? → Leer ai/SUPERAGENT.md + los agentes involucrados
```

### 2. Verificar decisiones inmutables
Leer `ai/ARCHITECTURE.md` para confirmar que el cambio propuesto NO viola decisiones arquitectónicas ya tomadas.

### 3. Verificar estado actual
- **Antes de tocar DB:** Verificar CHECK constraints, tablas existentes, columnas existentes
- **Antes de tocar routing:** Verificar las 7 capas de routing en App.tsx (Page type, getPageFromHash, hashMap, hashchange, isDashboardPage, isProtectedPage, PAGE_PERMISSIONS)
- **Antes de crear archivo:** Verificar que no existe uno similar que haga lo mismo
- **Antes de crear función SQL:** Verificar `information_schema.routines` para evitar duplicados

---

## REGLAS INQUEBRANTABLES

1. **DB compartida dev/prod.** Todo cambio de datos impacta producción inmediatamente. No hay staging.
2. **Hash routing.** El frontend usa `window.location.hash`, NO React Router. No cambiar.
3. **Singleton Supabase.** Un solo client en backend (`getSupabaseClient()`), uno en frontend (`supabaseClient.ts`).
4. **Servicios como capa de datos.** Componentes React NUNCA llaman a Supabase directamente.
5. **Backend API-only.** Next.js 16 solo sirve API routes, no SSR/SSG.
6. **Free tier Render.** Cold starts de 30-50s. Diseñar para resiliencia.
7. **Monorepo npm workspaces + Turborepo.** No cambiar estructura de workspaces.
8. **Design System RURAL24.** Usar SOLO tokens `brand-*` de CSS vars. NUNCA hex hardcoded ni `green-600`. Cards clickeables SIN botón "Ver Detalle". Ref: `ai/frontend.agent.md` → sección DESIGN SYSTEM.

---

## CHECKLIST PRE-CAMBIO

Antes de cada modificación, verificar mentalmente:

- [ ] ¿Leí el agent file correspondiente al dominio?
- [ ] ¿Verifiqué que no existe código/tabla/función duplicada?
- [ ] ¿El cambio respeta ARCHITECTURE.md?
- [ ] ¿Si toco DB, verifiqué CHECK constraints con `pg_constraint`?
- [ ] ¿Si toco routing, actualicé las 7 capas?
- [ ] ¿Si agrego página admin, la agregué a `isProtectedPage` Y `PAGE_PERMISSIONS`?
- [ ] ¿Si creo endpoint, verifiqué que no hay uno similar en `/api/`?
- [ ] ¿Si toco UI/colores, usé tokens `brand-*` del Design System? (ver `ai/frontend.agent.md`)

---

## ARCHIVOS DE REFERENCIA

| Archivo | Contenido | Cuándo leer |
|---------|-----------|-------------|
| `ai/ARCHITECTURE.md` | Decisiones inmutables, stack, scaling | Siempre al inicio |
| `ai/SUPERAGENT.md` | Coordinación entre dominios | Tareas multi-dominio |
| `ai/frontend.agent.md` | React, routing, componentes, servicios | Cambios frontend |
| `ai/backend.agent.md` | API routes, auth, domain services | Cambios backend |
| `ai/database.agent.md` | Schema, RPCs, constraints, estado datos | Cambios DB |
| `ai/devops.agent.md` | Render, cron, env vars, deploy | Cambios infra |
| `ai/performance.agent.md` | Cache, bundle, queries | Optimizaciones |
| `ai/uxui.agent.md` | Flujos, estados UI, mobile-first | Diseño UX |
| `database/RURAL24_COMPLETE_SCHEMA_2026-02-16.sql` | **FUENTE DE VERDAD** del schema DB | Antes de tocar DB, tablas, columnas, funciones |

---

## ERRORES HISTÓRICOS A NO REPETIR

### 1. No verificar CHECK constraints (Feb 2026)
Al migrar `featured_ads_queue`, se intentó usar `status = 'migrated'` que no existía en el CHECK constraint. También se usó `action = 'phase1_migration'` en audit que tampoco estaba permitido. **Regla: SIEMPRE consultar `pg_constraint` antes de INSERT/UPDATE con valores nuevos.**

### 2. No sincronizar las 7 capas de routing (Feb 2026)
Se eliminó `'featured-queue'` del `Page` type pero no se agregó en `isProtectedPage`, causando loading infinito. **Regla: Las 7 capas de routing DEBEN estar sincronizadas. Ver checklist en frontend.agent.md.**

### 3. Asumir estructura de tabla sin verificar (Feb 2026)
Se confundieron columnas entre `featured_ads` y `featured_ads_queue` múltiples veces porque se asumió la estructura sin consultar `information_schema.columns`. **Regla: SIEMPRE verificar con SQL antes de operar.**

### 4. output: standalone + next start = 404 total (Feb 2026)
Next.js 16 con `output: 'standalone'` en `next.config.js` y `next start` como startCommand causa 404 en TODAS las rutas. Next.js lo advierte: `"next start" does not work with "output: standalone"`. Se debe usar `next start` SIN standalone, o cambiar startCommand a `node .next/standalone/server.js`. **Regla: NUNCA combinar `output: standalone` con `next start`.**

### 5. URL de servicio Render no es {name}.onrender.com (Feb 2026)
El servicio `rural24-backend` en render.yaml tiene URL real `rural24.onrender.com`, no `rural24-backend.onrender.com`. El cron job apuntaba a la URL incorrecta. **Regla: SIEMPRE verificar la URL real en el Dashboard de Render antes de configurar endpoints.**

### 6. Mezclar React 19 + react-helmet-async + Next 16 causó ERESOLVE (Feb 2026)
Next 16 requiere React 19, pero `react-helmet-async` solo soporta React 18. Además, Storybook 8.6 no soporta Vite 7. El monorepo falló con ERESOLVE y `npm ci` requería `--force`. **Solución:** Downgrade a Next 15 + React 18 en todo el monorepo, agregar `overrides` en root `package.json`, remover Storybook temporalmente (re-agregar como v9+ que soporta Vite 7). **Regla: SIEMPRE verificar peerDependencies cruzadas antes de upgradear frameworks mayores. NUNCA usar `turbo: "latest"` ni versiones `latest` en producción.**

### 7. Lógica financiera en frontend con múltiples queries no atómicas (Feb 2026)
El canje de cupones (`creditsService.redeemCoupon()`) ejecutaba 7 queries separadas desde el frontend con anon key: SELECT, UPSERT, INSERT × 3, RPC helper. Sin atomicidad, con race conditions posibles, y escribiendo en la tabla incorrecta (`user_credits` en vez de `user_featured_credits`). Existía una RPC atómica `redeem_coupon()` en DB que no se usaba. **Solución:** Migrar a `POST /api/coupons/redeem` → backend invoca RPC con service_role. Frontend solo llama a la API. **Regla: NUNCA ejecutar lógica financiera (créditos, balance, transacciones) desde el frontend. Toda operación que modifique balance DEBE pasar por backend → RPC atómica.**

---

## FLUJO DE TRABAJO

```
1. Usuario pide cambio
2. Identificar dominio(s) afectado(s)
3. LEER agent file(s) correspondiente(s)
4. VERIFICAR estado actual (DB, código, routing)
5. PROPONER cambio con justificación
6. EJECUTAR cambio
7. VERIFICAR que no se rompió nada (TypeScript, tests, consistencia)
8. ACTUALIZAR agent files si el cambio introduce conocimiento nuevo
```

**El paso 8 es crítico:** si descubrís algo nuevo sobre el proyecto (un constraint, un bug, un patrón), actualizá el agent file correspondiente para que no se pierda.
