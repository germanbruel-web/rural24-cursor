# Sprint — Sync Panel Robustez
> Fecha: 2026-03-25 | Estado: ✅ Completo

## Objetivo
Hacer el Sync Panel robusto: gate de PROD, backups SQL, y regla LOCAL=DEV como ley.

---

## Regla de Oro #0 — LOCAL = DEV (nueva, absoluta)

Agregada en primera fila de `CLAUDE.md`:
- Cero archivos sin commitear antes de operar PROD
- Cero commits sin pushear a `origin/main`
- LOCAL y DEV usan la misma Supabase DEV DB (no hay divergencia de DB)
- SIEMPRE descargar backup SQL antes de aplicar migraciones

---

## Flujo de sincronización correcto

```
LOCAL (código commitado + pusheado a main)
  ↓ verificación automática en Sync Panel
DEV OK (migraciones aplicadas, config igual)
  ↓ solo si Etapa 1 verde
Comparar main vs prod en GitHub (git log prod..main)
  ↓
Crear PR main→prod + mergear
  ↓
Deploy en Render PROD
  ↓
Aplicar migraciones PROD (con backup previo descargado)
```

---

## Cambios implementados

### `CLAUDE.md`
- Regla de Oro #0 en **primera fila** del archivo
- Detalla el flujo LOCAL → DEV → PROD
- Referencia al Sync Panel como herramienta canónica

### `backend/app/api/admin/sync/backup/route.ts` (NUEVO)
- `GET /api/admin/sync/backup?target=dev|prod`
- Exporta como SQL INSERT: `_rural24_migrations` + `categories` + `global_settings` + `global_config` + `home_sections` + `cms_hero_images` + `hero_images` + `banners_clean` + `form_templates_v2` + `form_fields_v2` + `wizard_configs` + `option_lists` + `option_list_items` + `subscription_plans` + `featured_durations`
- Devuelve `Content-Disposition: attachment` — descarga directa al browser
- Incluye `BEGIN/COMMIT` transaction, DELETE antes de INSERT (idempotente)
- Solo superadmin

### `frontend/src/components/admin/SyncPanel.tsx`
- **Gate PROD**: si `status.local.hasPending` → banner rojo de bloqueo + `pointer-events-none opacity-60` en toda la Etapa 2
- Todos los botones PROD reciben `disabled={!localOk}`
- **BackupButton** component: botón "Descargar Backup DEV/PROD" en migraciones DEV, migraciones PROD, y sección Snapshots
- Sección **Snapshots** al final con explicación de qué incluye y qué no
- Confirmación de migraciones ahora menciona "descargá el backup antes"
- Regla de oro visible como banner informativo en la UI

---

## Sistema de Snapshots

### Qué cubre el backup del Sync Panel
- Tablas de configuración (14 tablas)
- Historial de migraciones aplicadas
- Formato SQL INSERT idempotente (DELETE + INSERT)

### Qué NO cubre (responsabilidad de Supabase)
- Datos de usuarios (`users`, `ads`, `ad_images`, `wallets`)
- Chat, notificaciones, favoritos
- Logs de pagos

### Para backup completo
- Supabase Dashboard → Settings → Backups (plan Pro = PITR)
- Plan Free = backup manual vía `pg_dump` desde Supabase Dashboard

---

## Respuesta sobre snapshots completos

Actualmente NO hay sistema automatizado de snapshots de la app completa.
Para restaurar a fecha X:
1. **Código**: `git checkout <commit-hash>` — cada commit es un restore point
2. **Config DB**: usar los archivos `.sql` descargados del Sync Panel
3. **Datos de usuarios**: requiere Pro plan de Supabase (PITR) o backup manual
4. **Imágenes**: Cloudinary conserva histórico (no se borran automáticamente salvo limpieza manual)

Recomendación futura: script `backup-snapshot.sh` que ejecuta pg_dump completo y guarda en Drive/S3.
