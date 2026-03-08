# Rural24 — Scripts de Base de Datos

Scripts Node.js para gestionar Supabase DEV y PROD directamente desde la terminal.
Todos leen las credenciales de `.env.db.local` (nunca commiteado).

---

## Requisitos

```
.env.db.local
├── DEV_DB_URL=postgresql://postgres:PASSWORD@db.REF-DEV.supabase.co:5432/postgres
└── PROD_DB_URL=postgresql://postgres:PASSWORD@db.REF-PROD.supabase.co:5432/postgres
```

Copiá `.env.db.example` → `.env.db.local` y completá las URLs desde:
**Supabase Dashboard → Settings → Database → Connection string → URI**

---

## Scripts disponibles

| Comando | Descripción corta |
|---|---|
| `npm run db:push:dev` | Aplica migrations a Supabase DEV |
| `npm run db:push:prod` | Aplica migrations a Supabase PROD |
| `npm run db:clone-config` | Copia configuración CMS de DEV → PROD |
| `npm run db:seed-demo` | Inserta 101 avisos de demo |
| `npm run db:purge-demo` | Elimina avisos y datos de demo |
| `npm run db:set-superadmin` | Asigna rol superadmin a un usuario |

---

## `db:push:dev` / `db:push:prod`

Aplica las migrations pendientes de `supabase/migrations/` al ambiente indicado.

```bash
npm run db:push:dev     # → Supabase DEV
npm run db:push:prod    # → Supabase PROD (también incluido en publish:prod)
```

**Cuándo usarlo:** cada vez que agregás un archivo nuevo en `supabase/migrations/`.
Ya está integrado en `npm run publish:prod`, así que para PROD no hace falta correrlo a mano.

---

## `db:clone-config`

Copia las tablas de configuración del CMS de DEV a PROD.

```bash
npm run db:clone-config
```

**Tablas que copia:**
- `site_settings` — logo, hero, footer, imágenes del sitio
- `global_settings` — feature toggles, textos promocionales, configuración general

**Lo que hace automáticamente:**
- Reemplaza todas las URLs de Supabase Storage DEV → PROD (para que las imágenes funcionen)
- Nullea columnas de auditoría (`updated_by`, `created_by`) que referencian usuarios DEV
- Usa transacción: si algo falla, no queda nada a medias

**Lo que NO toca:** avisos, usuarios, créditos, catálogo, categorías.

**Cuándo usarlo:**
- Cambiaste el logo, banner o textos del sitio desde el panel admin en DEV
- Activaste/desactivaste un feature toggle (ej: `wallet_virtual_enabled`)
- Cambiaste el mensaje promocional de destacados
- Cualquier configuración editada en DEV que querés replicar en PROD

---

## `db:seed-demo`

Inserta 101 avisos agropecuarios realistas en la base de datos indicada.

```bash
npm run db:seed-demo -- dev     # solo DEV
npm run db:seed-demo -- prod    # solo PROD
npm run db:seed-demo -- all     # DEV + PROD
```

**Contenido:**

| Categoría | Avisos | Ejemplos |
|---|---|---|
| Ganadería | 20 | Novillos Hereford, Vacas Angus preñadas, Toros PO, Caballos... |
| Inmuebles Rurales | 20 | Campos, Estancias, Chacras, Quintas, Lotes... |
| Insumos Agropecuarios | 20 | Herbicidas, Semillas, Fertilizantes, Alambrado... |
| Maquinarias Agrícolas | 20 | Tractores JD, Sembradoras, Cosechadoras, Pulverizadoras... |
| Servicios Rurales | 21 | Veterinaria, Siembra, Cosecha, Agrónomo, Consignataria... |

**Características de cada aviso:**
- Estado: `active` + `approval_status: approved` (visible de inmediato)
- 2 imágenes placeholder por aviso (picsum.photos)
- Provincia/ciudad reales de Argentina
- Precio en ARS (null para servicios sin precio fijo)
- Expira 6 meses desde la inserción
- Asignado al primer usuario `superadmin` del ambiente

**Comportamiento inteligente:**
- Verifica qué subcategorías existen en el ambiente antes de insertar (FK safe)
- Si una subcategoría no existe en PROD, inserta el aviso con `subcategory_id = null`

**Flujo típico:**
```bash
# 1. Limpiar avisos anteriores (si los hay)
npm run db:purge-demo -- all

# 2. Insertar demo data fresca
npm run db:seed-demo -- all
```

---

## `db:purge-demo`

Elimina datos de demo de DEV, PROD o ambas. Preserva catálogo y configuración.

```bash
# Preview sin borrar nada (siempre empezá acá)
npm run db:purge-demo -- all --dry-run

# Purgar solo avisos (default)
npm run db:purge-demo -- dev
npm run db:purge-demo -- prod
npm run db:purge-demo -- all

# Purgar también usuarios, créditos y billeteras
npm run db:purge-demo -- all --users
```

**Tablas que purga (scope default — avisos):**

| Tabla | Descripción |
|---|---|
| `ads` | Avisos principales |
| `ad_images` | Imágenes de avisos |
| `featured_ads` | Avisos destacados |
| `featured_ads_queue` | Cola legacy de destacados |
| `featured_ads_audit` | Auditoría de destacados |
| `ads_moderation_log` | Log de moderación |
| `payments` | Pagos relacionados |
| `contact_messages` / `contact_notifications` | Mensajes entre usuarios |
| `search_analytics` | Analytics de búsqueda |
| `jobs_log` | Log de tareas programadas |
| `images` | Imágenes generales |
| `backup_*` | Tablas de backup de migraciones |

**Tablas adicionales con `--users`:**
`users`, `user_credits`, `user_featured_credits`, `user_wallets`, `wallet_transactions`,
`coupon_redemptions`, `coupon_invitations`, `user_promo_claims`, `profile_contacts`,
`company_profiles`, `reseller_points_of_sale`

**Siempre preserva:**
categorías, subcategorías, catálogo, marcas, atributos, banners, CMS, site_settings,
global_settings, membership_plans, coupons (definiciones).

---

## `db:set-superadmin`

Asigna rol `superadmin` a un usuario por email.

```bash
npm run db:set-superadmin -- dev   super@clasify.com
npm run db:set-superadmin -- prod  super@clasify.com
npm run db:set-superadmin -- all   super@clasify.com
```

**Lo que hace:**
1. Verifica que la cuenta exista en `auth.users`
2. Confirma el email si no estaba confirmado (`email_confirmed_at`)
3. Hace UPSERT en `public.users` con `role = 'superadmin'`

**Si la cuenta no existe aún:**
```
❌ email no existe en auth.users — creá la cuenta primero
```
→ Creá la cuenta desde el frontend (`/register`) o desde
**Supabase Dashboard → Authentication → Users → Invite user**,
luego ejecutá el comando nuevamente.

**Roles disponibles en el sistema:** `superadmin` | `revendedor` | `premium` | `free`

---

## Ambientes y separación

```
DEV  (Supabase proyecto: lmkuecdvxtenrikjomol)
├── Avisos de demo / pruebas
├── Usuarios de desarrollo
└── Configuración CMS (fuente de verdad → clonar a PROD)

PROD (Supabase proyecto: ufrzkjuylhvdkrvbjdyh)
├── Avisos reales (cuando salgas al mercado)
├── Usuarios reales
└── Configuración CMS (sincronizar desde DEV con db:clone-config)
```

**Regla de oro:**
- El **catálogo** (categorías, marcas, atributos) se sincroniza via migrations (`db:push`)
- La **configuración CMS** se sincroniza via `db:clone-config`
- Los **avisos** y **usuarios** son independientes en cada ambiente
- `auth.users` es completamente separado — no se puede clonar entre proyectos Supabase

---

## Flujo de trabajo típico

### Día a día
```bash
git push origin main          # auto-deploy a Staging
```

### Publicar a Producción
```bash
npm run publish:prod          # main → prod + migrations
# → Ir a Render dashboard y triggerear deploy manual
```

### Actualizar configuración CMS en PROD
```bash
# Editar config en DEV desde el panel admin
npm run db:clone-config       # copiar a PROD
```

### Resetear demo data
```bash
npm run db:purge-demo -- all --dry-run   # ver qué borra
npm run db:purge-demo -- all             # borrar
npm run db:seed-demo -- all              # insertar demo fresca
```

### Restaurar acceso admin
```bash
npm run db:set-superadmin -- prod super@clasify.com
```
