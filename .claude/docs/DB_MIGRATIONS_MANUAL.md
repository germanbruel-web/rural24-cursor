# DB Migrations — Manual del Operador
> Rural24 | Actualizado: 2026-03-09

---

## Herramientas disponibles

| Script | Qué hace |
|---|---|
| `node scripts/db-run-migrations.mjs prod 20260309` | ✅ **Recomendado** — aplica solo las migraciones del día indicado |
| `node scripts/db-run-migrations.mjs dev 20260309` | Ídem contra DEV |
| `node scripts/db-push.mjs prod` | Via Supabase CLI (solo si el tracking está en orden) |
| `node scripts/db-clone-config.mjs` | Clona tablas de config (banners, global_config) de DEV → PROD |

> ⚠️ **Usar siempre `db-run-migrations.mjs`** — las migraciones viejas se aplicaron
> manualmente (SQL Editor) y el CLI de Supabase no tiene registro de ellas.
> `db-push.mjs` puede intentar re-aplicarlas y romper cosas.

---

## Prerequisitos

### 1. Tener `.env.db.local` en la raíz del proyecto

Si no existe, crearlo copiando el ejemplo:
```
.env.db.example → .env.db.local
```

Contenido requerido:
```
DEV_DB_URL=postgresql://postgres.[ref-dev]:[password]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
PROD_DB_URL=postgresql://postgres.[ref-prod]:[password]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

> ⚠️ Puerto **5432** (direct connection). NO usar 6543 (transaction pooler) — el script lo corrige automáticamente pero es mejor poner el correcto.

### 2. Tener Supabase CLI instalado
```powershell
npx supabase --version
```
Si no responde: `npm install -g supabase`

---

## Flujo normal: DEV → PROD

### Paso 1 — Verificar qué migraciones están pendientes

```powershell
# Ver migraciones en la carpeta
ls supabase/migrations/

# Ver cuáles ya están aplicadas en PROD (requiere supabase CLI)
npx supabase migration list --db-url "TU_PROD_DB_URL"
```

### Paso 2 — Aplicar migraciones en DEV primero (si no lo hiciste)

```powershell
node scripts/db-push.mjs dev
```

Verificar que no hay errores antes de ir a PROD.

### Paso 3 — Aplicar migraciones en PROD

```powershell
node scripts/db-push.mjs prod
```

El script aplica **solo las migraciones pendientes** (las que PROD no tiene). No repite las ya aplicadas.

### Paso 4 — Sincronizar configuración (si cambiaste banners/global_config)

```powershell
node scripts/db-clone-config.mjs
```

Esto clona: `site_settings`, `global_config`, `banners`, `banners_clean`.
**No toca** usuarios, avisos, wallets, ni datos de negocio.

---

## Flujo rápido (día a día)

```powershell
# En la raíz del proyecto:
node scripts/db-push.mjs prod
```

Listo. Si además cambiaste config/banners:
```powershell
node scripts/db-clone-config.mjs
```

---

## Errores comunes

### ❌ "Falta PROD_DB_URL en .env.db.local"
→ El archivo `.env.db.local` no existe o le falta la variable. Crearlo con las URLs de Supabase.

### ❌ "ECONNREFUSED" o timeout
→ La URL tiene puerto 6543 en lugar de 5432. Cambiar al direct connection port.

### ❌ "already exists" en una migración
→ La migración ya fue aplicada manualmente antes. Usar:
```powershell
npx supabase migration repair --db-url "TU_PROD_DB_URL" --status applied 20260309000004
```
Reemplazar el número por el de la migración en cuestión.

### ❌ "permission denied" en una función
→ El script olvidó el GRANT después de DROP+CREATE. Pegar el GRANT manualmente en el SQL Editor de Supabase.

---

## Migraciones aplicadas por sprint (historial)

| Migración | Sprint | Estado DEV | Estado PROD |
|---|---|---|---|
| `20260309000001_sprint6a_empresas_db` | Sprint 6A | ✅ | ✅ |
| `20260309000002_sprint6a_rpc_fix` | Sprint 6A | ✅ | ✅ |
| `20260309000003_fix_get_company_public_page` | Sprint 7A fix | ✅ | ✅ |
| `20260309000004_sprint7a_bp_social_proof` | Sprint 7A | ✅ | ⏳ pendiente |
| `20260309000005_sprint7a_rpc_social_proof_fields` | Sprint 7A | ✅ | ⏳ pendiente |
| `20260309000006_remove_revendedor_role` | Roles cleanup | ✅ | ⏳ pendiente |

---

## Deploy a Render (Prod)

Las migraciones DB y el deploy de código son **independientes**:

- **Código** → push a `main` → Render auto-deploya Staging. Para Prod: trigger manual en Render dashboard.
- **DB** → `node scripts/db-push.mjs prod` → aplica migraciones en Supabase Prod.

No hay relación automática entre los dos. Hacerlos en orden:
1. DB primero (`db-push.mjs prod`)
2. Código después (Render trigger manual)
