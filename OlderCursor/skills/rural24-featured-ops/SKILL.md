---
name: rural24-featured-ops
description: Usa esta skill cuando el trabajo involucre Avisos Destacados, Mis Avisos, checkout MercadoPago, roles (usuario vs superadmin), y toggles de Global Settings. Incluye diagnostico tecnico+UX, flujo dev/staging/prod y checklist de cambios frontend/backend/db.
---

# Rural24 Featured Ops

## Objetivo
Concentrar en un solo workflow la operacion de:
- Destacar aviso (single)
- Gestion masiva superadmin (bulk)
- Activacion/desactivacion de checkout por `global_settings`
- Preparacion de integracion MercadoPago sin romper reglas de negocio ni arquitectura.

## Cuándo usar esta skill
Usar cuando el usuario pida cualquiera de estos temas:
- "Destacar", "avisos destacados", "Mis Avisos", "bulk", "visibilidad"
- "MercadoPago", "checkout", "pago de destacados"
- "activar/desactivar metodo de pago"
- "deuda tecnica de destacados"

## Regla de orquestacion
1. Leer primero estos archivos de contexto:
- `.cursor/rules/SUPERAGENT.md`
- `.cursor/rules/DEVPROD_ARCHITECTURE.md`
- `.cursor/rules/frontend.agent.md`
- `.cursor/rules/backend.agent.md`
- `.cursor/rules/database.agent.md`
- `.cursor/rules/uxui.agent.md`

2. Aplicar jerarquia:
- Contrato y seguridad: backend/database
- UX y estados: uxui
- Implementacion UI: frontend

## Workflow recomendado (orden fijo)
1. Diagnostico rapido
- Confirmar fuente canonica de destacados (`featured_ads`)
- Detectar hardcode legacy (`ads.featured`, rutas viejas)
- Verificar roles: usuario comun vs superadmin

2. Contrato funcional
- Single: usuario autenticado puede iniciar flujo de destacar
- Cancelar/editar estado publicitario: solo superadmin
- No reembolso en cancelacion manual si negocio lo define asi

3. Configuracion global
- Verificar/crear keys:
  - `featured_payments_enabled`
  - `mercadopago_enabled`
  - `mercadopago_sandbox_mode`
- UI debe reaccionar a toggles sin deploy

4. UX states obligatorios
- `loading`, `error`, `empty`, `data`
- checkout: `disabled`, `pending`, `approved`, `rejected`

5. Integracion de pago (cuando se active)
- Backend: `POST /api/payments/mercadopago/preference`
- Webhook: `POST /api/payments/mercadopago/webhook`
- Idempotencia por `external_reference`/`payment_id`
- Activar destacado solo tras confirmacion server/webhook

6. Validacion y despliegue
- `npm run build` frontend y backend
- Probar en `staging` antes de `main`
- Confirmar toggles en Global Settings

## Checklist tecnico minimo
- [ ] No hay dependencias nuevas innecesarias
- [ ] No se expone `service_role` al frontend
- [ ] No hay SQL destructivo sin backup
- [ ] No hay nuevas rutas sin guard/autorizacion
- [ ] Modal de destacar responde a toggles de pago
- [ ] Superadmin bulk separado del flujo usuario

## Consultas SQL de diagnostico (si el usuario ejecuta manual)
Pedir al usuario ejecutar y compartir salida:
```sql
select placement, count(*) total, sum(case when status='active' then 1 else 0 end) active
from public.featured_ads
group by placement
order by placement;

select key, value, value_type, category
from public.global_settings
where key in ('featured_payments_enabled','mercadopago_enabled','mercadopago_sandbox_mode');
```

## Referencias de esta skill
- `references/agents-archive.md`
- `references/featured-checkout-playbook.md`
