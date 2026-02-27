# Rural24 — Cheatsheet de Trabajo Diario

## Desarrollar (todos los días)

```bash
git push origin main
```
→ Render Staging se actualiza solo.

---

## Publicar a Producción (cuando estés listo)

**1. Revisá qué vas a publicar:**
https://github.com/germanbruel-web/rural24-cursor/compare/prod...main

**2. Ejecutá:**
```bash
npm run publish:prod
```
→ Pide confirmación → pushea `main → prod` → sincroniza Supabase PROD.

**3. Triggerá Render Prod manualmente:**
https://dashboard.render.com

---

## Base de Datos (solo si hay migrations nuevas)

| Cuándo | Comando |
|--------|---------|
| Al pushear a Staging | `npm run db:push:dev` |
| Al publicar a Prod | ya incluido en `publish:prod` ✅ |

Las migrations van en: `supabase/migrations/YYYYMMDDHHMMSS_nombre.sql`

---

## Ramas

| Rama | Para qué | Deploy |
|------|----------|--------|
| `main` | desarrollo diario | Render Staging (auto) |
| `prod` | producción | Render Prod (manual) |
