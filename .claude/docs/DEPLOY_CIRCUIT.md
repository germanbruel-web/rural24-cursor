# Deploy Circuit — Rural24

> Última actualización: 2026-02-27

## Ramas

| Rama | Propósito | Deploy |
|------|-----------|--------|
| `main` | Trabajo diario / staging | Render Staging (auto) |
| `prod` | Producción estable | Render Prod (manual) |
| `staging` | Legacy — no usar | — |

## Flujo de trabajo

```
Desarrollo + migraciones SQL nuevas
    ↓
git push origin main  +  npm run db:push:dev
    ↓
Render Staging auto-deploya  ← "Publicar Staging"
    ↓ (cuando estás listo)
PR: main → prod en GitHub
    ↓
Revisás diff (Files changed)
    ↓
Mergeas el PR
    ↓
npm run db:push:prod          ← sincroniza Supabase PROD
    ↓
Render → trigger manual deploy Prod  ← "Publicar Producción"
```

## Publicar Staging

```bash
git push origin main
npm run db:push:dev   # solo si hay nuevas migraciones SQL
```

Render detecta el push y deploya automáticamente. Las migraciones se aplican manualmente desde VSCode.


# Hacer un único commit ppara guardarse la descripción del cambio en el mensaje de commit, por ejemplo:
git commit -m "mensajel"

# Subir a main guarda mensaje y archivos a github, y activa deploy automático a staging:
git push origin main

## Publicar Producción

```bash
# 1. Revisás el diff (antes de correr el comando)
#    https://github.com/germanbruel-web/rural24-cursor/compare/prod...main

# 2. Un solo comando hace todo lo demás:
npm run publish:prod
#    → git push origin main:prod  (actualiza rama prod en GitHub)
#    → db:push:prod               (sincroniza Supabase PROD)
#    → te pide confirmación antes de ejecutar

# 3. Trigger manual en Render Prod (siempre vos)
```

## Gestión de Base de Datos (Supabase)

### Setup inicial (una sola vez)

```bash
# 1. Copiá el template de credenciales
cp .env.db.example .env.db.local

# 2. Editá .env.db.local con las URLs reales de cada proyecto Supabase
#    Supabase Dashboard → Settings → Database → Connection string → URI
```

### Scripts disponibles

```bash
npm run db:push:dev    # Aplica supabase/migrations/ → Supabase DEV
npm run db:push:prod   # Aplica supabase/migrations/ → Supabase PROD
```

### Dónde van las nuevas migraciones

**Siempre en** `supabase/migrations/` con formato `YYYYMMDDHHMMSS_nombre.sql`

```
supabase/
└── migrations/
    ├── 20260223135857_remote_schema.sql   ← baseline completo
    └── 20260227000000_fix_featured_ad.sql ← ejemplo de nueva migration
```

> Los archivos en `database/*.sql` son referencia histórica. Las migraciones activas van en `supabase/migrations/`.

### Render env groups

| Env Group | SUPABASE_URL | SERVICE_ROLE_KEY |
|-----------|--------------|-----------------|
| Staging   | DEV project  | DEV key         |
| Production| PROD project | PROD key        |

## Git tracking configurado

```
main    → origin/main
prod    → origin/prod
staging → origin/staging
```

## Reglas

- **Nunca** pushear directo a `prod` — siempre via PR desde `main`
- **No** se usan GitHub Actions — Render y GitHub nativo manejan todo
- El PR `main → prod` se puede crear solo cuando hay commits nuevos en `main` que no están en `prod`
- Después de cada merge a `prod`, el trigger en Render es **siempre manual** (decisión intencional)
