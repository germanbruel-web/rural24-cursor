# Featured + Checkout Playbook

## Meta de producto
Unificar operacion de destacados en `Mis Avisos`, con:
- Flujo usuario (single)
- Flujo superadmin (bulk)
- Checkout MercadoPago gobernado por toggles

## Reglas de negocio base
- Usuario comun: puede iniciar destacar, no cancela/publicitario
- Superadmin: puede activar/cancelar/editar destacados
- Cancelacion con o sin reembolso: configurable por negocio

## Mapa funcional
1. Boton `DESTACAR` en card
2. Modal 3 zonas (aviso, ubicaciones, resumen/precio)
3. Fecha + disponibilidad
4. Pago (si toggles activos)
5. Activacion post-confirmacion

## Contractos recomendados
- `global_settings`:
  - `featured_payments_enabled:boolean`
  - `mercadopago_enabled:boolean`
  - `mercadopago_sandbox_mode:boolean`
- Tabla pagos sugerida: `featured_payments`
  - `id`, `user_id`, `ad_id`, `status`, `provider`, `external_reference`, `payment_id`, `amount`, `currency`, `created_at`

## Estados UI de checkout
- `desactivado`: metodo apagado por settings
- `habilitado`: CTA pagar visible
- `pending`: pago iniciado, esperando confirmacion
- `approved`: activar destacado
- `rejected`: mostrar causa + retry

## Criterios de calidad
- No activar destacado desde frontend por retorno de URL
- Activar solo con confirmacion backend/webhook
- Idempotencia en webhook
- Auditoria de cambios administrables
