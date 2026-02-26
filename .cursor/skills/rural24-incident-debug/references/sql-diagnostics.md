# SQL Diagnostics (Rural24)

## Featured
```sql
select placement, status, count(*)
from public.featured_ads
group by placement, status
order by placement, status;
```

## Global Settings críticos
```sql
select key, value, value_type, category
from public.global_settings
where key in (
  'featured_payments_enabled',
  'mercadopago_enabled',
  'mercadopago_sandbox_mode'
)
order by key;
```

## Integridad mínima
```sql
select count(*) from public.ads;
select count(*) from public.users;
```

## Policies
```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname='public'
order by tablename, policyname;
```
