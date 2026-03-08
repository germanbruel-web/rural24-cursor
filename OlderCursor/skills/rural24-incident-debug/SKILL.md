---
name: rural24-incident-debug
description: Usa esta skill cuando haya incidentes en staging/prod (servicios caidos, health fail, auth roto, featured o pagos fallando). Entrega triage rapido, diagnostico por capa y plan de mitigacion sin acciones destructivas.
---

# Rural24 Incident Debug

## Objetivo
Resolver incidentes operativos en Rural24 con un protocolo corto, repetible y seguro.

## Activacion
Usar cuando el usuario reporte:
- "no funciona", "se cayo", "500", "no deploya", "health down"
- errores de auth, featured, checkout/pagos, cron o DB
- diferencias entre local/staging/prod

## Protocolo de triage (orden fijo)
1. Confirmar alcance
- entorno afectado (`local`, `staging`, `prod`)
- servicio afectado (`frontend`, `backend`, `supabase`, `render`)
- hora aproximada del incidente

2. Verificaciones base
- backend health: `/api/health`
- frontend status HTTP
- variables de entorno criticas (sin exponer secretos)
- branch desplegado (`staging` vs `main`)

3. Diagnostico por capa
- Frontend: consola, routing hash, feature flags
- Backend: endpoint puntual, guard auth, logs, timeouts
- Database: existencia de columnas/constraints/RPC, RLS
- Integraciones: Cloudinary/MercadoPago webhook

4. Mitigacion segura
- preferir rollback logico (toggle off, feature flag)
- evitar SQL destructivo
- mantener evidencia: comandos, outputs y timestamp

5. Cierre
- causa raiz probable
- fix aplicado o workaround
- acciones preventivas (checklist)

## Guardrails
- No ejecutar `DROP`/`TRUNCATE` sin backup y aprobacion
- No exponer `service_role` ni secretos en logs
- No asumir schema: verificar con consultas

## Checklist rapido
- [ ] `npm run build` pasa
- [ ] `api/health` OK
- [ ] env keys minimas presentes
- [ ] flujo principal validado (home, my-ads, destacar)
- [ ] si pagos activos: webhook idempotente validado

## Referencias
- `references/incident-runbook.md`
- `references/sql-diagnostics.md`
