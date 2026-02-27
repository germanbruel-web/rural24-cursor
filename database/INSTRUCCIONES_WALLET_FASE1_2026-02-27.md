# Wallet Fase 1 (ARS virtual vs ARS real)

Fecha: 2026-02-27  
SQL: `database/20260227_wallet_virtual_real_phase1.sql`

## 1. Pre-checks

```sql
SELECT to_regclass('public.user_credits') AS user_credits,
       to_regclass('public.users') AS users_table,
       to_regclass('public.payments') AS payments,
       to_regclass('public.featured_ads') AS featured_ads;

SELECT COUNT(*) AS users_with_credits, COALESCE(SUM(balance),0) AS total_credits
FROM public.user_credits
WHERE COALESCE(balance,0) > 0;
```

## 2. Ejecutar migracion

Ejecutar el archivo:

`database/20260227_wallet_virtual_real_phase1.sql`

## 3. Post-checks

```sql
SELECT to_regclass('public.user_wallets') AS user_wallets,
       to_regclass('public.wallet_transactions') AS wallet_transactions;

SELECT COUNT(*) AS wallets_count,
       COALESCE(SUM(virtual_balance),0) AS total_virtual
FROM public.user_wallets;

SELECT COUNT(*) AS migration_rows,
       COALESCE(SUM(amount),0) AS migration_amount
FROM public.wallet_transactions
WHERE source = 'migration';

SELECT key, value
FROM public.global_settings
WHERE key IN (
  'wallet_virtual_enabled',
  'wallet_real_enabled',
  'featured_checkout_mode',
  'featured_payments_enabled',
  'mercadopago_enabled'
)
ORDER BY key;
```

## 4. Resultado esperado

- `user_wallets` y `wallet_transactions` existen.
- `wallets_count` coincide con usuarios que tenian saldo legacy.
- `total_virtual` coincide con suma de `user_credits.balance`.
- `migration_rows` y `migration_amount` consistentes con el backfill.
- Settings:
  - `wallet_virtual_enabled = true`
  - `wallet_real_enabled = false`
  - `featured_checkout_mode = "virtual_only"`
  - `featured_payments_enabled = false`
  - `mercadopago_enabled = false`

## 5. Orden recomendado de despliegue

1. DEV  
2. STAGING  
3. PROD

## 6. Nota

Esta fase no elimina `user_credits`.  
Fase 2: migrar RPC/servicios de featured y cupones a `user_wallets` + `wallet_transactions`.

