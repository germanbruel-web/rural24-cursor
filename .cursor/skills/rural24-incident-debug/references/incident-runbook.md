# Incident Runbook (Rural24)

## 1) Señal inicial
- Qué falla
- Desde cuándo
- A quién impacta

## 2) Salud mínima
- Frontend responde HTTP
- Backend `/api/health`
- Supabase reachable

## 3) Ramas comunes de fallo
- Deploy con env incompletas
- Cambio de schema no acompañado en backend/frontend
- Ruta protegida sin perfil cargado
- RPC/constraint no compatible con payload

## 4) Mitigación inmediata
- Apagar feature por `global_settings`
- Redirigir a flujo estable
- Desactivar checkout si pagos fallan

## 5) Postmortem corto
- Trigger
- Root cause
- Blast radius
- Acción correctiva
- Acción preventiva
