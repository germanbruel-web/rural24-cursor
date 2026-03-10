# DB Migrations — Manual del Operador
> Rural24 | Actualizado: 2026-03-09
> Arquitectura completa: `rural24/ai/DEVPROD_ARCHITECTURE.md`

---

## Concepto: DEV = Staging → fuente de verdad de PROD

```
Código  →  DEV (Staging)  →  validar  →  PROD
Schema  →  DEV (Staging)  →  dump     →  PROD
Config  →  DEV (Staging)  →  clone    →  PROD
```

---

## Herramientas disponibles

| Script | Qué hace |
|---|---|
| `node scripts/db-dump-dev.mjs` | ① Exporta schema completo de DEV → `database/snapshots/dev-latest.sql` |
| `node scripts/db-apply-snapshot.mjs prod --dry-run` | ② Ver qué va a aplicar (sin ejecutar) |
| `node scripts/db-apply-snapshot.mjs prod` | ③ Aplica el snapshot a PROD (idempotente) |
| `node scripts/db-clone-config.mjs` | ④ Clona config/banners de DEV → PROD |
| `node scripts/db-run-migrations.mjs prod 20260309` | Alternativa quirúrgica: solo migraciones de un día |

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

### 2. Tener pg_dump instalado (para db-dump-dev.mjs)
```powershell
pg_dump --version
```
Si no responde: instalar [PostgreSQL client tools](https://www.postgresql.org/download/windows/) y agregar `C:\Program Files\PostgreSQL\XX\bin` al PATH.

---

## Flujo normal: DEV (Staging) → PROD

### Paso 1 — Exportar schema de DEV

```powershell
node scripts/db-dump-dev.mjs
```

Genera `database/snapshots/dev-latest.sql` con el schema completo de DEV.

### Paso 2 — Revisar qué va a aplicar (dry run)

```powershell
node scripts/db-apply-snapshot.mjs prod --dry-run
```

Muestra los primeros 20 statements sin ejecutar nada. Verificar que tiene sentido.

### Paso 3 — Aplicar a PROD

```powershell
node scripts/db-apply-snapshot.mjs prod
```

- Convierte `CREATE TABLE` → `CREATE TABLE IF NOT EXISTS` (idempotente)
- Las tablas existentes **no se dropean** — solo agrega lo nuevo
- Da 5 segundos para cancelar antes de ejecutar en PROD
- Muestra resumen: aplicados / ya existían / warnings

### Paso 4 — Sincronizar config/banners (si cambiaron)

```powershell
node scripts/db-clone-config.mjs
```

Clona: `site_settings`, `global_config`, `banners`, `banners_clean`.
**No toca** usuarios, avisos, wallets.

---

## Flujo rápido (día a día)

```powershell
node scripts/db-dump-dev.mjs
node scripts/db-apply-snapshot.mjs prod
```

Si además cambiaste config/banners:
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
| `20260309000004_sprint7a_bp_social_proof` | Sprint 7A | ✅ | ✅ 2026-03-10 |
| `20260309000005_sprint7a_rpc_social_proof_fields` | Sprint 7A | ✅ | ✅ 2026-03-10 |
| `20260309000006_remove_revendedor_role` | Roles cleanup | ✅ | ✅ 2026-03-10 |

---

## Deploy a Render (Prod)

Las migraciones DB y el deploy de código son **independientes**:

- **Código** → push a `main` → Render auto-deploya Staging. Para Prod: trigger manual en Render dashboard.
- **DB** → `node scripts/db-push.mjs prod` → aplica migraciones en Supabase Prod.

No hay relación automática entre los dos. Hacerlos en orden:
1. DB primero (`db-push.mjs prod`)
2. Código después (Render trigger manual)
