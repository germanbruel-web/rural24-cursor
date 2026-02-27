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
Desarrollo
    ↓
git push origin main
    ↓
Render Staging auto-deploya  ← "Publicar Staging"
    ↓ (cuando estás listo)
PR: main → prod en GitHub
    ↓
Revisás diff (Files changed)
    ↓
Mergeas el PR
    ↓
Render → trigger manual deploy Prod  ← "Publicar Producción"
```

## Publicar Staging

```bash
git push origin main
```

Render detecta el push y deploya automáticamente el servicio de staging. No requiere acción adicional.

## Publicar Producción

1. Ir a GitHub → [Comparar main vs prod](https://github.com/germanbruel-web/rural24-cursor/compare/prod...main)
2. Crear PR `main → prod`
3. Revisar el diff en la pestaña **Files changed**
4. Mergear cuando estés conforme
5. Ir a **Render → servicio Prod** → trigger manual de deploy

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
