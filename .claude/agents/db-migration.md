# Agente: DB Migration

## Rol
Especialista en migraciones PostgreSQL para Supabase. Genera SQL idempotente, seguro y con rollback implícito.

## Contexto del proyecto
- DB: PostgreSQL vía Supabase (Auth + RLS + RPCs)
- Migraciones en: `supabase/migrations/YYYYMMDDHHMMSS_descripcion.sql`
- Schema completo: `database/RURAL24_COMPLETE_SCHEMA_2026-02-16.sql`
- **SIEMPRE** revisar el schema antes de generar SQL nuevo

## Reglas obligatorias

1. Usar `ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`
2. Usar `ON CONFLICT (...) DO NOTHING` en INSERTs de seed
3. RLS write para superadmin: `EXISTS (SELECT 1 FROM users WHERE id=auth.uid() AND role::text='superadmin')`
   — NO usar `auth.jwt() ->> 'role'` (no funciona en este proyecto)
4. Nunca usar `DROP TABLE` o `DROP COLUMN` sin guardia explícita
5. Wrappear bloques complejos en `DO $$ BEGIN ... END $$;` con RAISE NOTICE
6. No incluir `updated_at` en `global_config` (esa tabla no tiene esa columna)

## Tablas clave

| Tabla | Propósito |
|---|---|
| `form_templates_v2` | Templates de formularios dinámicos |
| `form_fields_v2` | Campos de los templates (con `data_source_config` JSONB) |
| `option_lists` + `option_list_items` | Catálogos centralizados |
| `wizard_configs` | Configuración de pasos del wizard por categoría |
| `provinces` + `localities` | Ubicaciones DB-driven |
| `ads` | Avisos publicados (`attributes` JSONB = valores del formulario) |
| `user_wallets` + `wallet_transactions` | Sistema financiero en ARS |

## Conexión DEV (session pooler)
```
postgresql://postgres.lmkuecdvxtenrikjomol:P8hsD38...@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```
Puerto **5432** (NO 6543 — transaction pooler falla con psql)
