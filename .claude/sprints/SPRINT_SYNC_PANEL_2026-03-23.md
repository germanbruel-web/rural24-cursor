# Sprint Sync Panel — 2026-03-23

## Objetivo
Panel de sincronización LOCAL → DEV → PROD en el admin dashboard.

## Resultado
Panel completamente funcional en `localhost:5173/#/sync-panel` (superadmin, solo DEV).

## Arquitectura

### Etapa 1 — LOCAL → DEV
- Commits sin pushear: `git log origin/main..HEAD`
- Migraciones pendientes en Supabase DEV (`_rural24_migrations`)
- Botón: `git push origin main` → POST /api/admin/sync/local-push
- Botón: Aplicar migraciones → POST /api/admin/sync/migrate { target: 'dev' }
- Botón: Marcar como aplicadas (sin SQL) → POST /api/admin/sync/mark { target: 'dev' }

### Etapa 2 — DEV → PROD
- Commits en main no en prod: `git log prod..main`
- Migraciones pendientes en Supabase PROD
- Config: hash MD5 de global_settings + global_config (excluye audit cols, normaliza storage refs)
- Botón: Aplicar migraciones → POST /api/admin/sync/migrate { target: 'prod' }
- Botón: Marcar como aplicadas → POST /api/admin/sync/mark { target: 'prod' }
- Botón: Clonar config DEV→PROD → POST /api/admin/sync/config
- Botón: Crear PR main→prod → POST /api/admin/sync/git-push
- Botón: Deploy PROD → POST /api/admin/sync/deploy

## Endpoints BFF
```
backend/app/api/admin/sync/
  status/route.ts         — GET, polling 30s
  migrate/route.ts        — POST { target, migrations? }
  mark/route.ts           — POST { target }
  config/route.ts         — POST (clona 12 tablas DEV→PROD, batch 100 rows)
  git-push/route.ts       — POST (crea PR via GitHub API)
  deploy/route.ts         — POST (trigger Render deploy hooks)
  local-push/route.ts     — POST (git push origin main)
  config-debug/route.ts   — GET (debug diff de global_settings)
```

## Variables de entorno requeridas (backend/.env.local)
```
SYNC_DEV_DB_URL=postgresql://postgres:...@db.lmkuecdvxtenrikjomol.supabase.co:5432/postgres
SYNC_PROD_DB_URL=postgresql://postgres:...@db.ufrzkjuylhvdkrvbjdyh.supabase.co:5432/postgres
GITHUB_TOKEN=ghp_...
RENDER_DEPLOY_HOOK_PROD_FRONTEND=https://api.render.com/deploy/...
RENDER_DEPLOY_HOOK_PROD_BACKEND=https://api.render.com/deploy/...
```
IMPORTANTE: URLs de conexión directa (db.xxx.supabase.co:5432), NO el pooler.

## Issues resueltos
1. Pooler Supabase timeout → URLs conexión directa
2. Config clone timeout → batch inserts 100 filas + maxDuration=300 + commit por tabla
3. Hash siempre diferente → excluir audit cols + normalizar storage refs DEV→PROD en hash
4. global_settings JSONB types → DEV tenía "true" (string), PROD tenía true (boolean)
   Fix: UPDATE SET value = 'true'::jsonb WHERE value_type='boolean' AND value::text='"true"'
5. git log prod..main desactualizado → git fetch origin prod:prod antes de consultar

## Tabla _rural24_migrations
- Creada en DEV y PROD via migración 20260323000002
- Pre-seed de todas las migraciones históricas como 'pre-sync'
- 73 migraciones registradas al cierre del sprint

## Deploy final
- PR #5 mergeado main→prod
- Render PROD deployadomanualmente
- Estado final: LOCAL ✓ DEV ✓ PROD ✓ — todo sincronizado
