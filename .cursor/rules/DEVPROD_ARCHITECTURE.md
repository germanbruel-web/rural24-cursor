# ARQUITECTURA DEV → PROD — Rural24
> Diseño profesional de flujo de entornos, migraciones, versionado y operación.  
> **Fecha:** 2026-02-24  
> **Estado:** Definición inicial  

---

## TABLA DE CONTENIDOS

1. [Arquitectura General](#1-arquitectura-general)
2. [Flujo Inicial DEV → PROD](#2-flujo-inicial-dev--prod)
3. [Flujo Diario Post-Lanzamiento](#3-flujo-diario-post-lanzamiento)
4. [Estrategia de Migraciones](#4-estrategia-de-migraciones)
5. [Snapshot PROD → DEV](#5-snapshot-prod--dev)
6. [Sistema de Versionado](#6-sistema-de-versionado)
7. [Checklist Operativo](#7-checklist-operativo)
8. [Reglas de Oro](#8-reglas-de-oro)

---

## 1. ARQUITECTURA GENERAL

### Diagrama Conceptual

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          REPOSITORIO GIT                                │
│                       github.com/germanbruel-web/rural24                │
│                                                                         │
│   main ──────────────────────────────────────────► Auto-deploy PROD     │
│     │                                                                   │
│     ├── staging ─────────────────────────────────► Auto-deploy TESTING  │
│     │     │                                                             │
│     │     ├── feature/xxx ──► PR → staging                              │
│     │     ├── fix/xxx ──────► PR → staging                              │
│     │     └── hotfix/xxx ──► PR → main (emergencia)                     │
│     │                                                                   │
│     └── tags: v2.1.0, v2.2.0 ... (releases)                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────── SUPABASE ──────────────────────────────────────────────────┐
│                                                                        │
│   DEV (lmkuecdvxtenrikjomol)          PROD (ufrzkjuylhvdkrvbjdyh)     │
│   ┌──────────────────────┐            ┌──────────────────────┐        │
│   │ PostgreSQL           │            │ PostgreSQL           │        │
│   │ Auth (test users)    │            │ Auth (real users)    │        │
│   │ RLS policies         │            │ RLS policies         │        │
│   │ RPCs/Functions       │            │ RPCs/Functions       │        │
│   │ Datos de prueba      │            │ Datos reales         │        │
│   └──────────────────────┘            └──────────────────────┘        │
│         ▲                                    ▲                         │
│         │ Schema migrations →→→→→→→→→→→→→→→→ │                         │
│         │ ←←←←←←←←←←←← Snapshot datos ←←←←  │                         │
└────────────────────────────────────────────────────────────────────────┘

┌─────────── RENDER ────────────────────────────────────────────────────┐
│                                                                        │
│   Testing (En-Testing-R24)            Producción (En-Produccion-R24)  │
│   ┌──────────────────────┐            ┌──────────────────────┐        │
│   │ rural24-frontend     │            │ rural24-frontend-prod│        │
│   │ (Static/Vite)        │            │ (Static/Vite)        │        │
│   │ ← branch: staging    │            │ ← branch: main       │        │
│   ├──────────────────────┤            ├──────────────────────┤        │
│   │ rural24-backend      │            │ rural24-backend-prod │        │
│   │ (Node/Next.js)       │            │ (Node/Next.js)       │        │
│   │ ← branch: staging    │            │ ← branch: main       │        │
│   └──────────────────────┘            └──────────────────────┘        │
│                                                                        │
│   Env vars → Supabase DEV             Env vars → Supabase PROD       │
└────────────────────────────────────────────────────────────────────────┘
```

### Mapeo de Entornos

| Concepto | DEV / Testing | PROD |
|----------|--------------|------|
| **Supabase Project** | `lmkuecdvxtenrikjomol` (rural24-dev) | `ufrzkjuylhvdkrvbjdyh` (rural24-prod) |
| **Render Environment** | En-Testing-R24 | En-Produccion-R24 |
| **Git Branch** | `staging` | `main` |
| **Frontend URL** | `rural24-frontend.onrender.com` | `rural24-frontend-prod.onrender.com` |
| **Backend URL** | `rural24-backend.onrender.com` | `rural24-backend-prod.onrender.com` |
| **Datos** | Prueba + snapshots sanitizados | Reales (usuarios, avisos, créditos) |
| **Auth users** | Test accounts | Usuarios reales |
| **Deploy trigger** | Push a `staging` | Push a `main` (merge de staging) |

### Principio Fundamental: Separación Total de Datos

> **ANTES:** Una sola instancia Supabase compartida DEV/PROD.  
> **AHORA:** Dos proyectos Supabase completamente aislados.  
> **Beneficio:** Imposible corromper datos de producción desde desarrollo.

---

## 2. FLUJO INICIAL DEV → PROD

### Fase A: Preparar Supabase PROD

#### A1. Exportar Schema de DEV (estructura sin datos)

```bash
# Desde máquina local con acceso a Supabase DEV
# Usar pg_dump con la connection string de DEV

pg_dump \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  --no-comments \
  -f database/EXPORT_DEV_SCHEMA.sql \
  "postgresql://postgres:P8hsD38KGrMBKxoF@db.lmkuecdvxtenrikjomol.supabase.co:5432/postgres"
```


#### A2. Limpiar el Schema exportado

Antes de importar en PROD, revisar y limpiar:

```
INCLUIR (siempre):
✅ CREATE TABLE (todas las tablas de negocio)
✅ CREATE TYPE (enums: banner_placement, etc.)
✅ CREATE FUNCTION / CREATE OR REPLACE FUNCTION (todas las RPCs)
✅ CREATE TRIGGER
✅ CREATE INDEX
✅ ALTER TABLE ... ADD CONSTRAINT (CHECK, UNIQUE, FK)
✅ ALTER TABLE ... ENABLE ROW LEVEL SECURITY
✅ CREATE POLICY (todas las RLS policies)
✅ GRANT (permisos a anon, authenticated, service_role)

EXCLUIR:
❌ Tablas de Supabase internos (auth.*, storage.*, realms.*)
❌ Extensions que Supabase ya provee (uuid-ossp, pgcrypto)
❌ SET statements del header de pg_dump
❌ Comentarios de pg_dump
❌ Datos de auth.users (se crean fresh en PROD)
```

#### A3. Script de limpieza automática

```sql
-- database/scripts/clean_schema_for_prod.sql
-- Ejecutar como pre-procesamiento del dump

-- Eliminar referencias a roles específicos de DEV
-- Eliminar GRANTs a roles que no existen en PROD
-- Asegurar que search_path = public en todas las funciones
```

#### A4. Importar Schema en PROD

```bash
# Conectar a Supabase PROD
psql "postgresql://postgres.[PROJECT_REF_PROD]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres" \
  -f database/EXPORT_DEV_SCHEMA_CLEAN.sql
```



#### A5. Verificar integridad post-import

```sql
-- Ejecutar en PROD después de importar

-- 1. Contar tablas
SELECT count(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Contar funciones
SELECT count(*) as total_functions 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- 3. Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 4. Contar policies
SELECT count(*) as total_policies 
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. Verificar CHECK constraints
SELECT conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace AND contype = 'c';

-- 6. Verificar índices
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 7. Comparar conteos DEV vs PROD
-- Guardar los resultados de DEV antes y comparar
```

### Fase B: Migrar Datos Iniciales (Selectivos)

#### B1. Datos que SÍ migrar (datos de catálogo/sistema)

```sql
-- Exportar datos de catálogo de DEV
-- Estos son datos de sistema, no de usuario

-- Categorías y subcategorías
COPY (SELECT * FROM categories ORDER BY id) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM subcategories ORDER BY id) TO STDOUT WITH CSV HEADER;

-- Atributos dinámicos
COPY (SELECT * FROM attributes ORDER BY id) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM attribute_options ORDER BY id) TO STDOUT WITH CSV HEADER;

-- Marcas
COPY (SELECT * FROM brands ORDER BY id) TO STDOUT WITH CSV HEADER;

-- Configuración global
COPY (SELECT * FROM global_config ORDER BY key) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM global_settings ORDER BY key) TO STDOUT WITH CSV HEADER;

-- Provincias/Localidades (si existen)
COPY (SELECT * FROM provinces ORDER BY id) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM localities ORDER BY id) TO STDOUT WITH CSV HEADER;
```

#### B2. Datos que NO migrar

```
❌ users (se crearán fresh via Supabase Auth)
❌ auth.users (gestionado por Supabase Auth)
❌ ads (datos de prueba)
❌ featured_ads (datos de prueba)
❌ featured_ads_queue (LEGACY, no migrar)
❌ featured_ads_audit (logs de prueba)
❌ user_credits (se inicializan por usuario real)
❌ user_featured_credits (se inicializan por usuario real)
❌ credit_transactions (historial de prueba)
❌ coupons (crear nuevos para PROD)
❌ coupon_redemptions (historial de prueba)
❌ search_analytics (datos de prueba)
❌ contact_logs (datos de prueba)
```

#### B3. Script de importación de datos iniciales

```bash
# Importar datos de catálogo en PROD
psql "postgresql://postgres.[PROJECT_REF_PROD]:[PASSWORD]@..." \
  -f database/scripts/prod_initial_data.sql
```

### Fase C: Configurar Supabase PROD

#### C1. Auth Configuration

En el Dashboard de Supabase PROD:

1. **Site URL:** `https://rural24-frontend-prod.onrender.com`
2. **Redirect URLs:**
   - `https://rural24-frontend-prod.onrender.com`
   - `https://rural24-frontend-prod.onrender.com/**`
3. **Email templates:** Copiar de DEV, cambiar URLs
4. **Rate limits:** Configurar según plan (free: 4 emails/hora)
5. **JWT expiry:** 3600 (1 hora) + auto-refresh
6. **Disable email confirmations:** OFF en PROD (ON en DEV para testing)

#### C2. API Keys

Obtener de Supabase PROD Dashboard → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` → URL del proyecto PROD
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon key de PROD
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key de PROD

**NUNCA mezclar keys entre DEV y PROD.**

#### C3. Crear SuperAdmin en PROD

```sql
-- Después de que el SuperAdmin se registre via Auth en PROD:
UPDATE public.users 
SET role = 'superadmin' 
WHERE email = 'admin@rural24.com.ar';  -- email real del admin
```

### Fase D: Configurar Render PROD

#### D1. Environment Groups en Render

```
En-Produccion-R24:
  NEXT_PUBLIC_SUPABASE_URL     = https://ufrzkjuylhvdkrvbjdyh.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY = [anon key de PROD]
  SUPABASE_SERVICE_ROLE_KEY     = [service_role key de PROD]
  FRONTEND_URL                  = https://rural24-frontend-prod.onrender.com
  NODE_ENV                      = production
  CLOUDINARY_CLOUD_NAME         = [mismo si se comparte, o separado]
  CLOUDINARY_API_KEY            = [key]
  CLOUDINARY_API_SECRET         = [secret]
  CRON_SECRET                   = [auto-generated]

En-Testing-R24:
  NEXT_PUBLIC_SUPABASE_URL     = https://lmkuecdvxtenrikjomol.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY = [anon key de DEV]
  SUPABASE_SERVICE_ROLE_KEY     = [service_role key de DEV]
  FRONTEND_URL                  = https://rural24-frontend.onrender.com
  NODE_ENV                      = production  (same runtime, different data)
  CLOUDINARY_CLOUD_NAME         = [mismo o dev-specific]
  CLOUDINARY_API_KEY            = [key]
  CLOUDINARY_API_SECRET         = [secret]
  CRON_SECRET                   = [auto-generated]
```

#### D2. Servicios en Render

| Servicio | Branch | Env Group | Auto-Deploy |
|----------|--------|-----------|-------------|
| rural24-frontend-prod | main | En-Produccion-R24 | ✅ On push to main |
| rural24-backend-prod | main | En-Produccion-R24 | ✅ On push to main |
| rural24-frontend | staging | En-Testing-R24 | ✅ On push to staging |
| rural24-backend | staging | En-Testing-R24 | ✅ On push to staging |

#### D3. render.yaml actualizado

El `render.yaml` debe reflejar ambos entornos. Sin embargo, Render no soporta multi-environment nativamente en YAML — se gestiona desde el Dashboard:

- Los servicios de PROD se crean manualmente en Render Dashboard apuntando a branch `main`
- Los servicios de Testing siguen usando el `render.yaml` existente apuntando a branch `staging`
- Alternativa: usar **Render Blueprints** separados por entorno

### Fase E: Validación Final

```
CHECKLIST DE VALIDACIÓN PROD:
□ Schema importado correctamente (comparar conteos tablas/funciones/policies)
□ RLS habilitado en todas las tablas con datos de usuario
□ Datos de catálogo importados (categorías, subcategorías, atributos, marcas)
□ global_config y global_settings presentes
□ SuperAdmin creado y con rol correcto
□ Auth configurado (Site URL, redirects)
□ Backend PROD responde en /api/health
□ Frontend PROD carga correctamente
□ Login funciona
□ Crear aviso funciona
□ Sistema de créditos funciona
□ No hay referencias a URLs de DEV en PROD
□ No hay keys de DEV en env vars de PROD
```

---

## 3. FLUJO DIARIO POST-LANZAMIENTO

### Escenario: Día Normal de Operación

```
09:00 — Verificar health de PROD
        curl https://rural24-backend-prod.onrender.com/api/health

09:30 — Usuarios publican avisos, buscan, contactan en PROD
        (ninguna intervención necesaria)

10:00 — Developer trabaja en feature nueva en branch feature/nueva-funcionalidad
        → Código apunta a Supabase DEV via env vars locales
        → Testing local con datos de prueba

14:00 — Feature lista. PR a staging
        → git push origin feature/nueva-funcionalidad
        → Crear PR: feature/nueva-funcionalidad → staging

14:30 — PR merged a staging
        → Auto-deploy en Render Testing
        → Testing con Supabase DEV

15:00 — QA en Testing: verificar que funciona con datos de prueba
        → Si requiere cambio de schema → aplicar migración SQL en DEV primero
        → Si pasa QA → PR staging → main

16:00 — PR merged a main
        → Auto-deploy en Render PROD
        → Si hay migración SQL → aplicar en PROD ANTES del merge (ver sección 4)

16:15 — Verificar PROD post-deploy
        → Health check
        → Smoke test manual (login, navegar, buscar)
        → Verificar logs de Render por errores
```

### Regla de Oro del Flujo Diario

```
NUNCA:
  merge a main → deploy PROD → luego aplicar migración SQL

SIEMPRE:
  aplicar migración SQL en PROD → merge a main → deploy PROD
```

**¿Por qué?** Si el código desplegado espera columnas/funciones que no existen, habrá errores en producción hasta que se aplique la migración. El schema debe estar listo ANTES de que el código que lo usa llegue a PROD.

### Excepciones: Hotfix

```
BUG CRÍTICO en PROD:
  1. Crear branch hotfix/descripcion desde main
  2. Fix rápido
  3. PR hotfix/descripcion → main (bypass staging)
  4. Deploy inmediato
  5. Después: merge main → staging (para sincronizar)
```

---

## 4. ESTRATEGIA DE MIGRACIONES

### 4.1 Versionado de Schema

Cada cambio de schema se versiona como un archivo SQL en `database/`:

```
database/
├── RURAL24_COMPLETE_SCHEMA_2026-02-16.sql    ← Snapshot completo (regenerar periódicamente)
├── migrations/
│   ├── V001_20260224_initial_prod_setup.sql
│   ├── V002_20260225_add_notification_preferences.sql
│   ├── V003_20260301_update_search_function.sql
│   └── ...
├── scripts/
│   ├── export_dev_schema.sh
│   ├── clean_schema_for_prod.sql
│   ├── prod_initial_data.sql
│   ├── snapshot_prod_to_dev.sh
│   └── verify_integrity.sql
└── README.md                ← Instrucciones de migración
```

### 4.2 Formato de Migración

```sql
-- ============================================================================
-- Migración: V003 — Agregar preferencias de notificación
-- Fecha: 2026-03-01
-- Autor: German
-- Entorno destino: DEV primero, luego PROD
-- Impacto: Agrega columna a users, no-destructiva
-- Backward compatible: SÍ (columna nullable con default)
-- ============================================================================

-- ===== PRE-CHECK (ejecutar primero, solo lectura) =====
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'notification_preferences';
-- Esperado: 0 filas (columna no existe aún)

-- ===== MIGRACIÓN =====
BEGIN;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb;

COMMENT ON COLUMN public.users.notification_preferences IS 'Preferencias de notificación del usuario';

COMMIT;

-- ===== POST-CHECK =====
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'notification_preferences';
-- Esperado: 1 fila con tipo jsonb

-- ===== ROLLBACK (en caso de problemas) =====
-- BEGIN;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS notification_preferences;
-- COMMIT;
```

### 4.3 Tipos de Migración

| Tipo | Riesgo | Downtime | Ejemplo |
|------|--------|----------|---------|
| **Aditiva** | Bajo | NO | ADD COLUMN, CREATE INDEX CONCURRENTLY, CREATE FUNCTION |
| **Modificativa** | Medio | NO* | ALTER COLUMN type (si compatible), UPDATE default |
| **Destructiva** | Alto | Posible | DROP COLUMN, DROP TABLE, ALTER COLUMN type (incompatible) |
| **Datos** | Variable | NO | UPDATE/INSERT masivo, data backfill |

### 4.4 Flujo de Migración (paso a paso)

```
1. ESCRIBIR migración SQL
   → database/migrations/V00X_YYYYMMDD_descripcion.sql

2. APLICAR en DEV (Supabase DEV)
   → psql [DEV_CONNECTION] -f database/migrations/V00X_....sql
   → Ejecutar pre-checks y post-checks

3. PROBAR en Testing (staging branch + Supabase DEV)
   → Verificar que la app funciona con el cambio
   → Test con datos de prueba

4. APLICAR en PROD (Supabase PROD)
   → psql [PROD_CONNECTION] -f database/migrations/V00X_....sql
   → Ejecutar pre-checks y post-checks
   → SOLO después de que pase QA en Testing

5. DEPLOY código (merge staging → main)
   → El código que usa la nueva estructura se despliega
   → El schema YA existe cuando el código llega

6. ACTUALIZAR schema snapshot
   → Regenerar RURAL24_COMPLETE_SCHEMA con pg_dump
   → Commit con el nuevo snapshot
```

### 4.5 Cambios Sin Downtime

#### Agregar columna

```sql
-- ✅ SEGURO: columna nullable con default
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- ❌ PELIGROSO: columna NOT NULL sin default en tabla con datos
ALTER TABLE users ADD COLUMN bio TEXT NOT NULL;  -- FALLA si hay filas
```

#### Cambiar tipo de columna

```sql
-- ✅ SEGURO: Patrón expand-migrate-contract
-- Paso 1: Agregar nueva columna
ALTER TABLE ads ADD COLUMN price_cents BIGINT;

-- Paso 2: Migrar datos (puede ser gradual)
UPDATE ads SET price_cents = (price * 100)::BIGINT WHERE price_cents IS NULL;

-- Paso 3: (Futuro) Cambiar código para usar price_cents
-- Paso 4: (Futuro) DROP columna vieja cuando ya no se usa
```

#### Agregar índice

```sql
-- ✅ SEGURO: CONCURRENTLY no bloquea escrituras
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_created 
ON ads (created_at DESC);
```

#### Modificar RPC

```sql
-- ✅ SEGURO: CREATE OR REPLACE es atómico
CREATE OR REPLACE FUNCTION public.get_featured_for_homepage()
RETURNS SETOF public.featured_ads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- nueva lógica
END;
$$;
```

#### Modificar RLS Policy

```sql
-- ✅ SEGURO: Drop + recreate en transacción
BEGIN;
DROP POLICY IF EXISTS "Users can view own ads" ON ads;
CREATE POLICY "Users can view own ads" ON ads
  FOR SELECT USING (auth.uid() = user_id OR status = 'active');
COMMIT;
```

### 4.6 Registro de Migraciones Aplicadas

Crear tabla de control en ambos entornos:

```sql
-- Ejecutar una vez en DEV y PROD
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY,           -- "V001", "V002"
  filename TEXT NOT NULL,              -- "V001_20260224_initial.sql"
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT DEFAULT current_user,
  checksum TEXT,                       -- MD5 del archivo SQL
  description TEXT
);

-- RLS: solo service_role puede leer/escribir
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.schema_migrations
  FOR ALL USING (auth.role() = 'service_role');
```

Después de cada migración exitosa:

```sql
INSERT INTO schema_migrations (version, filename, description)
VALUES ('V003', 'V003_20260301_notification_preferences.sql', 'Agregar preferencias de notificación');
```

### 4.7 Script de Verificación de Paridad

```sql
-- database/scripts/verify_schema_parity.sql
-- Ejecutar en AMBOS entornos y comparar resultados

-- Tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
ORDER BY table_name;

-- Columnas por tabla
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- Funciones
SELECT routine_name, data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Migraciones aplicadas
SELECT version, filename, applied_at 
FROM schema_migrations 
ORDER BY version;
```

---

## 5. SNAPSHOT PROD → DEV

### 5.1 Cuándo hacer snapshot

- Cuando DEV necesita datos realistas para testing
- Después de que PROD acumule suficiente contenido real
- Antes de desarrollar features que dependen de volumen de datos
- Periódicamente (sugerido: mensual)

### 5.2 Qué incluir y excluir

```
INCLUIR (datos de negocio anonimizados):
✅ ads (avisos — son públicos)
✅ categories, subcategories, attributes, attribute_options
✅ brands
✅ global_config, global_settings
✅ provinces, localities
✅ featured_ads (para testing de destacados)
✅ search_analytics (para testing de búsqueda, anonimizar IPs)

EXCLUIR SIEMPRE:
❌ auth.users (datos de autenticación)
❌ users (datos personales — o anonimizar)
❌ user_credits, user_featured_credits (balance financiero)
❌ credit_transactions (historial financiero)
❌ coupons (códigos reales de producción)
❌ coupon_redemptions
❌ contact_logs (datos de contacto privados)
❌ schema_migrations (cada entorno tiene su propio registro)

ANONIMIZAR SI SE INCLUYE:
🔶 users → reemplazar email, nombre, teléfono con datos fake
🔶 search_analytics → limpiar IPs
```

### 5.3 Script de Snapshot

```bash
#!/bin/bash
# database/scripts/snapshot_prod_to_dev.sh

set -euo pipefail

PROD_CONN="postgresql://postgres.[PROD_REF]:[PASS]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
DEV_CONN="postgresql://postgres.[DEV_REF]:[PASS]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_DIR="database/snapshots/${TIMESTAMP}"

mkdir -p "$SNAPSHOT_DIR"

echo "=== Exportando datos de PROD ==="

# 1. Exportar datos de catálogo (tal cual)
pg_dump "$PROD_CONN" \
  --data-only \
  --schema=public \
  --table=categories \
  --table=subcategories \
  --table=attributes \
  --table=attribute_options \
  --table=brands \
  --table=global_config \
  --table=global_settings \
  --table=provinces \
  --table=localities \
  -f "$SNAPSHOT_DIR/catalog_data.sql"

# 2. Exportar avisos (públicos)
pg_dump "$PROD_CONN" \
  --data-only \
  --schema=public \
  --table=ads \
  --table=ad_images \
  --table=featured_ads \
  -f "$SNAPSHOT_DIR/ads_data.sql"

# 3. Exportar usuarios anonimizados
psql "$PROD_CONN" -c "
COPY (
  SELECT 
    id,
    'user_' || ROW_NUMBER() OVER () || '@test.rural24.com' as email,
    'Test User ' || ROW_NUMBER() OVER () as full_name,
    role,
    user_type,
    province,
    locality,
    'ANONIMIZADO' as mobile,
    FALSE as mobile_verified,
    NULL as mobile_verification_code,
    NULL as mobile_verification_sent_at,
    0 as mobile_verification_attempts,
    created_at,
    updated_at,
    activity
  FROM public.users
) TO STDOUT WITH CSV HEADER;
" > "$SNAPSHOT_DIR/users_anonymized.csv"

echo "=== Snapshot guardado en $SNAPSHOT_DIR ==="
echo "=== SIGUIENTE PASO: Importar en DEV ==="
echo "=== ADVERTENCIA: Esto BORRARÁ datos actuales de DEV ==="
```

### 5.4 Script de Importación en DEV

```bash
#!/bin/bash
# database/scripts/import_snapshot_to_dev.sh

set -euo pipefail

DEV_CONN="postgresql://postgres.[DEV_REF]:[PASS]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
SNAPSHOT_DIR=$1  # Recibe path del snapshot como argumento

if [ -z "$SNAPSHOT_DIR" ]; then
  echo "Uso: ./import_snapshot_to_dev.sh database/snapshots/20260301_120000"
  exit 1
fi

echo "=== IMPORTANDO SNAPSHOT A DEV ==="
echo "=== Directorio: $SNAPSHOT_DIR ==="
read -p "¿Confirmar? Esto borrará datos actuales de DEV (y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "Cancelado"
  exit 0
fi

# 1. Limpiar tablas de datos (mantener schema)
psql "$DEV_CONN" <<EOF
BEGIN;
TRUNCATE TABLE 
  featured_ads,
  ad_images,
  ads,
  credit_transactions,
  coupon_redemptions,
  coupons,
  user_featured_credits,
  user_credits,
  contact_logs,
  search_analytics
CASCADE;
COMMIT;
EOF

# 2. Importar catálogo
psql "$DEV_CONN" -f "$SNAPSHOT_DIR/catalog_data.sql"

# 3. Importar avisos
psql "$DEV_CONN" -f "$SNAPSHOT_DIR/ads_data.sql"

# 4. Importar usuarios anonimizados (requiere script SQL especial)
# Los usuarios de auth.users NO se importan — se crean fresh en DEV

echo "=== Snapshot importado en DEV ==="
echo "=== Crear usuarios de test via Supabase Auth Dashboard ==="
```

### 5.5 Reglas del Snapshot

1. **NUNCA** importar `auth.users` de PROD a DEV — los tokens/hashes no son portables entre proyectos Supabase
2. **NUNCA** importar datos financieros sin anonimizar
3. **SIEMPRE** verificar que el schema de DEV es compatible antes de importar datos
4. **SIEMPRE** hacer backup de DEV antes de importar snapshot
5. Los `user_id` (UUID) de PROD no coincidirán con `auth.users` de DEV — los avisos importados quedarán "huérfanos" en cuanto a auth, lo cual es aceptable para testing

---

## 6. SISTEMA DE VERSIONADO

### 6.1 Estrategia de Branches

```
main          ← Producción. Solo merges de staging (o hotfix directo)
  │
  └── staging ← Pre-producción. Acumula features testeadas
        │
        ├── feature/nueva-busqueda     ← Feature branches
        ├── feature/notificaciones
        ├── fix/precio-destacados
        └── hotfix/auth-crash          ← Solo para emergencias (va directo a main)
```

### 6.2 Git Tags y Releases

```bash
# Formato de versión: vMAJOR.MINOR.PATCH
# MAJOR: Cambio breaking (nueva versión de API, reestructuración grande)
# MINOR: Feature nueva (nueva página, nuevo endpoint)
# PATCH: Bug fix, mejora menor

# Crear tag cuando se mergea a main
git tag -a v2.1.0 -m "Release 2.1.0 - Sistema de notificaciones"
git push origin v2.1.0

# El tag queda asociado al commit exacto que está en PROD
```

### 6.3 Relación Commit ↔ Deploy ↔ Versión

```
Tag v2.1.0  ─── Commit abc123 ─── Deploy PROD (auto via Render)
                     │
                     └── Schema: hasta V015 (verificar en schema_migrations)
```

### 6.4 Saber Qué Versión Está en Producción

#### Método 1: Endpoint de versión

```typescript
// backend/app/api/version/route.ts
import { NextResponse } from 'next/server';
import pkg from '../../../package.json';

export async function GET() {
  return NextResponse.json({
    version: pkg.version,
    environment: process.env.NODE_ENV,
    buildTime: process.env.BUILD_TIMESTAMP || 'unknown',
    commit: process.env.RENDER_GIT_COMMIT || 'unknown',  // Render provee esto
    branch: process.env.RENDER_GIT_BRANCH || 'unknown',
  });
}
```

#### Método 2: Header de versión en respuestas

```typescript
// backend/middleware.ts — agregar header
response.headers.set('X-App-Version', process.env.npm_package_version || '0.0.0');
response.headers.set('X-Git-Commit', process.env.RENDER_GIT_COMMIT?.substring(0, 7) || 'unknown');
```

#### Método 3: Frontend build-time

```typescript
// frontend/vite.config.ts — inyectar en build
define: {
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
}
```

### 6.5 Convención de Commits

```
feat: nueva funcionalidad (→ bump MINOR)
fix: corrección de bug (→ bump PATCH)
perf: mejora de performance
refactor: reestructuración sin cambio funcional
docs: documentación
chore: mantenimiento (deps, configs)
db: cambio de schema/migración
hotfix: fix urgente para PROD

Ejemplos:
feat: agregar sistema de notificaciones por email
fix: corregir cálculo de créditos en cupón multiuso
db: V015 agregar columna notification_preferences a users
hotfix: corregir crash en auth cuando token expirado
```

### 6.6 Release Checklist

```
□ Todas las features del sprint merged en staging
□ QA completo en Testing (staging + Supabase DEV)
□ Migraciones SQL probadas en DEV
□ Migraciones SQL aplicadas en PROD
□ Post-checks de migración pasaron
□ Merge staging → main
□ Render deploy exitoso (verificar build logs)
□ Health check PROD ✅
□ Smoke test manual (login, crear aviso, buscar)
□ Crear git tag vX.Y.Z
□ Actualizar package.json version
□ Actualizar schema snapshot si hubo cambios DB
□ Registrar en schema_migrations
```

---

## 7. CHECKLIST OPERATIVO (tipo CTO)

### 7.1 Checklist Diario

```
□ Health check PROD: GET /api/health → 200
□ Revisar logs de Render por errores 5xx
□ Verificar que cron de featured ads ejecutó (si aplica)
□ Revisar métricas de Supabase (conexiones, storage)
```

### 7.2 Checklist Semanal

```
□ Revisar branches activas (limpiar merged)
□ Verificar paridad de schema DEV/PROD (script verify_schema_parity.sql)
□ Revisar issues abiertos / PRs pendientes
□ Verificar uso de free tier (Render: horas, Supabase: storage/auth)
□ Backup manual de PROD si hubo cambios significativos
```

### 7.3 Checklist Pre-Release

```
□ Code freeze en staging (no más merges de features)
□ QA completo en Testing
□ Migraciones SQL probadas en DEV
□ APLICAR migración en PROD (antes del merge)
□ Verificar pre-checks y post-checks de migración
□ Merge staging → main
□ Monitorear deploy en Render
□ Health check PROD
□ Smoke test (5 min máximo)
□ Tag release
□ Comunicar al equipo / stakeholders
```

### 7.4 Checklist de Emergencia (PROD caído)

```
1. ¿Es cold start? → Esperar 30-50s y reintentar
2. ¿Header x-render-routing: no-server? → Servicio dormido, hacer request para despertar
3. ¿Deploy falló? → Render Dashboard → ver build logs → rollback
4. ¿Error de DB? → Supabase Dashboard → SQL Editor → verificar estado
5. ¿Error de Auth? → Supabase Dashboard → Auth → verificar configuración
6. ¿Rollback necesario? → git revert + push a main → auto-deploy
7. ¿Rollback de DB? → Ejecutar script de rollback de la última migración
8. ¿Todo falló? → Render suspend service → investigar → Manual Deploy
```

### 7.5 Checklist de Migración SQL

```
□ Archivo creado en database/migrations/ con formato correcto
□ Pre-checks incluidos (SELECT para verificar estado previo)
□ Migración es backward-compatible (código actual funciona con y sin el cambio)
□ Rollback script incluido (comentado)
□ Probada en DEV
□ Probada en Testing (staging)
□ Post-checks incluidos
□ APLICADA en PROD
□ Post-checks ejecutados en PROD
□ Registrada en schema_migrations
□ Schema snapshot actualizado (si cambio significativo)
```

---

## 8. REGLAS DE ORO

### 🥇 Las 10 Reglas Inquebrantables

1. **Schema antes que código.**  
   La migración SQL se aplica en PROD **antes** de desplegar el código que la usa. Nunca al revés.

2. **Nunca compartir keys entre entornos.**  
   DEV y PROD tienen sus propias claves de Supabase, Cloudinary, y CRON_SECRET. Mezclarlas = desastre.

3. **Migración = archivo versionado.**  
   Todo cambio de DB es un archivo SQL en `database/migrations/` con pre-checks, post-checks, y rollback. Nunca SQL ad-hoc en producción.

4. **Backward compatibility primero.**  
   Cada migración debe ser compatible con el código que está actualmente en producción. Patrón expand-migrate-contract para cambios destructivos.

5. **Datos reales son sagrados.**  
   Nunca truncate/delete en PROD sin backup previo. Nunca `DROP TABLE` sin migración de datos. Los datos de usuarios son irrecuperables.

6. **Un solo camino a producción.**  
   `feature/* → staging → main → PROD`. Sin excepciones excepto hotfixes documentados.

7. **Verificar antes de asumir.**  
   Antes de cualquier DDL: `information_schema.columns`, `pg_constraint`, `information_schema.routines`. La DB real puede diferir de lo que creés.

8. **Auth es por entorno.**  
   Los usuarios de DEV no existen en PROD y viceversa. `auth.users` nunca se migra entre entornos. Cada entorno tiene su propio universo de auth.

9. **Rollback siempre disponible.**  
   Cada migración tiene su rollback. Cada deploy puede revertirse con `git revert`. Cada release tiene un tag para volver.

10. **Monitorear después de cada cambio.**  
    Post-deploy: health check + smoke test + revisar logs. No asumir que "si compiló, funciona". 5 minutos de verificación ahorran horas de debugging.

### 🛡️ Anti-Patrones a Evitar

| Anti-Patrón | Consecuencia | Alternativa |
|-------------|-------------|-------------|
| SQL directo en PROD sin archivo | Cambio no versionado, no reproducible | Siempre archivo en `database/migrations/` |
| Deploy viernes a las 18:00 | Sin soporte si falla | Deploy lunes a jueves, antes de las 15:00 |
| Migrar schema y código juntos | Si un falla, el otro queda inconsistente | Schema primero, código después |
| Copiar env vars a mano | Error humano, keys mezcladas | Env Groups en Render, verificar siempre |
| Testing solo en local | "En mi máquina funciona" | Testing obligatorio en staging + Supabase DEV |
| Ignorar cold starts | "El backend no funciona" | Documentar, retry logic, health check pre-cron |
| DROP antes de CREATE | Downtime | CREATE OR REPLACE, o expand-contract |
| Confiar en RLS sin testear | Leak de datos | Test explícito con anon/authenticated/service_role |
| No taguear releases | "¿Qué versión está en PROD?" | Tag cada merge a main |
| Hotfix sin merge a staging | staging diverge de main | Siempre sincronizar main → staging post-hotfix |

### 🏗️ Buenas Prácticas SaaS

1. **Feature flags para funcionalidad nueva.** Si algo puede fallar, que se pueda desactivar sin re-deploy. Usar `config/features.ts` existente.

2. **Logs estructurados.** Usar el `logger.ts` existente. En PROD, loggear nivel `warn` y `error`. Nunca datos sensibles.

3. **Graceful degradation.** Si Supabase está lento, mostrar datos cacheados. Si Cloudinary falla, mostrar placeholder. El usuario nunca debería ver un error técnico.

4. **Immutable deploys.** Cada deploy es un snapshot del código en ese momento. Si algo falla, rollback al deploy anterior (Render lo soporta).

5. **Documentar decisiones.** Cada decisión arquitectónica va en `ai/ARCHITECTURE.md`. Cada error histórico va en `.github/copilot-instructions.md`. El conocimiento no se pierde.

---

## APÉNDICE A: Variables de Entorno por Servicio

### Producción (rural24-backend-prod)

| Variable | Fuente | Notas |
|----------|--------|-------|
| `NODE_ENV` | `production` | — |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase PROD dashboard | `https://ufrzkjuylhvdkrvbjdyh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase PROD dashboard | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase PROD dashboard | ⚠️ NUNCA exponer |
| `FRONTEND_URL` | URL del frontend PROD | CORS |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard | — |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard | — |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard | — |
| `CRON_SECRET` | Auto-generated en Render | — |
| `RENDER_GIT_COMMIT` | Auto (Render) | Para versión |
| `RENDER_GIT_BRANCH` | Auto (Render) | Para versión |

### Producción (rural24-frontend-prod)

| Variable | Fuente | Notas |
|----------|--------|-------|
| `VITE_SUPABASE_URL` | Supabase PROD | Build-time |
| `VITE_SUPABASE_KEY` | Supabase PROD anon key | Build-time |
| `VITE_BACKEND_URL` | URL backend PROD | Build-time |

### Testing (rural24-backend)

| Variable | Fuente | Notas |
|----------|--------|-------|
| Mismas variables | Supabase **DEV** keys | Apunta a DEV |
| `FRONTEND_URL` | URL frontend Testing | — |

---

## APÉNDICE B: Comandos de Referencia Rápida

```bash
# === SCHEMA ===

# Exportar schema completo (solo estructura) de un proyecto Supabase
pg_dump --schema-only --schema=public --no-owner --no-privileges \
  -f output.sql "$CONNECTION_STRING"

# Exportar datos de tablas específicas
pg_dump --data-only --schema=public --table=categories --table=brands \
  -f data.sql "$CONNECTION_STRING"

# Importar SQL
psql "$CONNECTION_STRING" -f input.sql

# === VERIFICACIÓN ===

# Contar tablas
psql "$CONN" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"

# Contar funciones
psql "$CONN" -c "SELECT count(*) FROM information_schema.routines WHERE routine_schema='public';"

# Ver CHECK constraints
psql "$CONN" -c "SELECT conrelid::regclass, conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE connamespace='public'::regnamespace AND contype='c';"

# Ver migraciones aplicadas
psql "$CONN" -c "SELECT version, filename, applied_at FROM schema_migrations ORDER BY version;"

# === GIT ===

# Crear branch de feature
git checkout staging && git pull && git checkout -b feature/nombre

# Merge a staging
git checkout staging && git merge feature/nombre && git push

# Release: merge a main + tag
git checkout main && git merge staging && git push
git tag -a v2.1.0 -m "Release 2.1.0" && git push origin v2.1.0

# Hotfix
git checkout main && git checkout -b hotfix/descripcion
# ... fix ...
git checkout main && git merge hotfix/descripcion && git push
git checkout staging && git merge main && git push  # sincronizar

# Ver qué tag está en PROD
git describe --tags --abbrev=0

# === RENDER ===

# Ver estado de servicios
# → https://dashboard.render.com

# Rollback: redesplegar commit anterior
# → Render Dashboard → Service → Manual Deploy → seleccionar commit
```

---

## APÉNDICE C: Diagrama de Flujo Completo

```
                    ┌──────────────────┐
                    │   DESARROLLO     │
                    │   LOCAL          │
                    │                  │
                    │  .env.local →    │
                    │  Supabase DEV    │
                    └────────┬─────────┘
                             │
                     git push feature/*
                             │
                             ▼
                    ┌──────────────────┐
                    │   STAGING        │
                    │   (branch)       │
                    │                  │
                    │  PR review       │
                    │  merge feature   │
                    └────────┬─────────┘
                             │
                    auto-deploy Render
                             │
                             ▼
                    ┌──────────────────┐
                    │   TESTING        │         ┌──────────────────┐
                    │   (Render)       │────────►│   Supabase       │
                    │                  │         │   DEV            │
                    │  QA + smoke test │         │                  │
                    │  datos de prueba │         │  Datos de prueba │
                    └────────┬─────────┘         │  + snapshots     │
                             │                   └──────────────────┘
                   ¿QA pasó?│
                     Sí     │
                             │
              ┌──────────────┴───────────────┐
              │                              │
              ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │   MIGRACIÓN SQL  │          │   MERGE → MAIN   │
    │   en PROD        │          │   (después de     │
    │                  │          │    migración SQL)  │
    │ 1. Pre-check     │          │                   │
    │ 2. Ejecutar SQL  │────►     │ auto-deploy Render│
    │ 3. Post-check    │          │ → PROD            │
    │ 4. Registrar     │          └────────┬──────────┘
    └──────────────────┘                   │
                                           ▼
                                 ┌──────────────────┐
                                 │   PRODUCCIÓN     │         ┌──────────────────┐
                                 │   (Render)       │────────►│   Supabase       │
                                 │                  │         │   PROD           │
                                 │  Health check    │         │                  │
                                 │  Smoke test      │         │  Datos REALES    │
                                 │  Tag release     │         │  Usuarios reales │
                                 └──────────────────┘         └──────────────────┘
```

---

## APÉNDICE D: Configuración Inicial de Branch Staging

```bash
# Crear branch staging desde main actual
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging

# Configurar protecciones en GitHub (Settings → Branches):
# main:
#   - Require pull request before merging
#   - Require status checks (build)
#   - No force pushes
#   - No deletions
#
# staging:
#   - Require pull request before merging (opcional para equipo unipersonal)
#   - No force pushes
```

---

## APÉNDICE E: Migrar la Situación Actual

### Estado actual vs Estado objetivo

| Aspecto | Actual | Objetivo |
|---------|--------|----------|
| Supabase | 1 proyecto compartido DEV/PROD | 2 proyectos separados |
| Git branches | Solo `main` | `main` + `staging` + `feature/*` |
| Render | 2 servicios (Testing) | 4 servicios (2 Testing + 2 PROD) |
| Versionado | Sin tags | Tags semánticos por release |
| Migraciones | Archivos SQL sueltos | Numerados + tabla de control |
| Schema actual | `RURAL24_COMPLETE_SCHEMA_2026-02-16.sql` | Mismo + versionado incremental |

### Pasos para migrar (orden estricto)

```
FASE 1 — Git (1 hora)
  1. Crear branch staging desde main
  2. Configurar protecciones de branch en GitHub
  3. Probar: crear feature branch → PR → merge a staging

FASE 2 — Supabase PROD (2-3 horas)
  4. Exportar schema de DEV con pg_dump
  5. Limpiar schema exportado
  6. Importar en Supabase PROD
  7. Importar datos de catálogo
  8. Verificar integridad (script)
  9. Configurar Auth en PROD
  10. Crear SuperAdmin en PROD
  11. Crear tabla schema_migrations en ambos entornos

FASE 3 — Render PROD (1 hora)
  12. Crear Environment Group En-Produccion-R24
  13. Crear servicio rural24-frontend-prod (branch: main)
  14. Crear servicio rural24-backend-prod (branch: main)
  15. Configurar env vars con keys de Supabase PROD
  16. Deploy manual y verificar

FASE 4 — Render Testing (30 min)
  17. Reconfigurar servicios existentes para branch staging
  18. Verificar que env vars apuntan a Supabase DEV
  19. Deploy y verificar

FASE 5 — Validación (1 hora)
  20. Health check PROD
  21. Registro de usuario en PROD
  22. Crear aviso de prueba en PROD
  23. Verificar RLS (intentar acceder a datos ajenos)
  24. Verificar sistema de créditos
  25. Primer tag: v2.0.0 (o la versión actual de package.json)

FASE 6 — Endpoint de versión (30 min)
  26. Crear /api/version endpoint
  27. Agregar header X-App-Version en middleware
  28. Deploy a ambos entornos
  29. Verificar que se puede consultar la versión en PROD

TIEMPO TOTAL ESTIMADO: 6-7 horas
```

---

> **Este documento es parte de la fuente de verdad del proyecto.**  
> Actualizar cuando cambie la infraestructura, los entornos, o los procesos.  
> Última actualización: 2026-02-24
