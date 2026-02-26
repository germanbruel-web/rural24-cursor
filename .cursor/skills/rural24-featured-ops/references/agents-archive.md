# Agents Archive (Rural24)

Fuente: `.cursor/rules/*`

## SUPERAGENT
- Orquesta por dominio (`frontend`, `backend`, `database`, `uxui`, `devops`, `performance`)
- Flujo recomendado: plan -> DB -> backend -> frontend -> validacion

## Frontend Agent
- React+Vite, hash routing, servicios como capa de datos
- Design System obligatorio con tokens `brand-*`
- Evitar hardcode visual y rutas desincronizadas

## Backend Agent
- API routes con guard de auth y validacion
- Sin lógicas sensibles en frontend
- Service role solo backend

## Database Agent
- RLS + constraints + RPC para operaciones atomicas
- Verificar schema real antes de SQL
- Evitar cambios destructivos sin backup

## UX/UI Agent
- Mobile-first
- Estados obligatorios: loading/error/empty/data
- Feedback inmediato y copy claro en español

## DEVPROD Architecture
- Branch `staging` para pruebas, `main` para producción
- Separación de entorno y variables
- Validar en staging antes de promocionar
