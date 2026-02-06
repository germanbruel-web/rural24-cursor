/**
 * CREDITS_SYSTEM_README.md
 * Documentación completa del sistema de créditos y anuncios destacados
 */

# Sistema de Créditos y Anuncios Destacados - Rural24

## 🎯 Visión General

Sistema de monetización simplificado basado en créditos que permite a los usuarios destacar sus anuncios en resultados de búsqueda. Completamente configurable por superadmins a través de panel web.

### Características Clave

- ✅ **Simple**: Sin rotaciones complejas, anuncios destacados permanentes
- ✅ **Flexible**: Duraciones de 7, 14, 21, 28 días
- ✅ **Configurable**: Toda la configuración en base de datos (editable por superadmin)
- ✅ **Promo**: Créditos gratis para nuevos usuarios (configurable)
- ✅ **Mobile First**: 100% responsive con Design System Rural24
- ✅ **Seguro**: Transacciones atómicas, auditables

---

## 💰 Modelo de Negocio

### Estructura de Créditos

```
1 Crédito = $2.500 ARS (configurable)

Duraciones y costos:
- 7 días  = 1 crédito  = $2.500
- 14 días = 2 créditos = $5.000
- 21 días = 3 créditos = $7.500
- 28 días = 4 créditos = $10.000
```

### Flujo de Compra

```
Usuario sin créditos
    ↓
Ve anuncio y quiere destacarlo
    ↓
Abre modal de destacado
    ↓
Selecciona duración (7/14/21/28 días)
    ↓
Si no tiene créditos suficientes → Mostrar "Comprar créditos"
    ↓
Modal de compra (Mercado Pago)
    ↓
Créditos → Balance
    ↓
Destacar anuncio
    ↓
Badge "Destacado" en búsqueda por X días
```

### Promoción a Nuevos Usuarios

```
Usuario se registra
    ↓
Automáticamente recibe N créditos gratis (configurable, ej: 3)
    ↓
Créditos expiran en X días (configurable, ej: 30 días)
    ↓
Usuario puede usar para destacar o esperar a comprar más
```

---

## 🏗️ Arquitectura Técnica

### Stack Utilizado

```
Frontend:  React 18 + TypeScript + Tailwind CSS
Backend:   Supabase (PostgreSQL) + RPC Functions
API:       RESTful con Supabase
Payment:   Mercado Pago (webhook integration)
State:     React Hooks + Supabase subscriptions
```

### Estructura de Carpetas

```
frontend/src/
├── components/
│   ├── dashboard/
│   │   └── UserCreditsPanel.tsx          # Panel principal de créditos
│   ├── modals/
│   │   ├── FeaturedAdModalWithCredits.tsx # Modal de destacado
│   │   └── BuyCreditsModal.tsx            # Modal de compra
│   ├── admin/
│   │   └── SuperAdminCreditsConfig.tsx    # Panel de config
│   └── search/
│       └── SearchResultsWithFeatured.tsx  # Resultados con destacados
├── hooks/
│   └── useCredits.ts                      # Hooks personalizados
├── services/
│   └── creditsService.ts                  # Lógica de negocio (CRUD)
└── types/
    └── credits.ts                         # TypeScript interfaces

database/
└── migrations/
    └── 044_credits_system.sql             # Esquema BD completo

docs/
└── INTEGRATION_GUIDE.md                   # Guía de integración
```

---

## 🗄️ Base de Datos

### Tablas Creadas

#### 1. `global_config` - Configuración global
```sql
config_key              TEXT PRIMARY KEY
config_value            TEXT
last_modified           TIMESTAMP
created_at              TIMESTAMP

Valores iniciales:
- credit_base_price: 2500 (ARS)
- featured_durations: JSON array con duraciones
- promo_credits_for_new_users: 3
- promo_credits_expire_days: 30
```

#### 2. `user_credits` - Balance por usuario
```sql
id                      UUID PRIMARY KEY
user_id                 FK → users
balance                 INT (saldo actual)
monthly_allowance       INT (créditos plan membresía)
updated_at              TIMESTAMP
```

#### 3. `credit_transactions` - Historial auditado
```sql
id                      UUID PRIMARY KEY
user_id                 FK → users
type                    ENUM (purchase, spend, promo_grant, monthly_grant)
amount                  INT (+ o -)
description             TEXT
balance_after           INT
payment_id              TEXT NULLABLE (FK Mercado Pago)
created_at              TIMESTAMP
```

#### 4. `featured_ads` - Anuncios destacados
```sql
id                      UUID PRIMARY KEY
ad_id                   FK → ads
duration_days           INT IN (7, 14, 21, 28)
credits_spent           INT IN (1, 2, 3, 4)
activated_at            TIMESTAMP
expires_at              TIMESTAMP
transaction_id          FK → credit_transactions
status                  ENUM (active, expired, cancelled)
```

#### 5. `membership_plans` - Planes con créditos mensuales
```sql
[Actualizado con]
monthly_free_credits    INT
monthly_credits_expire_days INT
```

### Funciones RPC (10 Total)

| Función | Parámetros | Descripción |
|---------|-----------|-------------|
| `activate_featured_with_credits()` | user_id, ad_id, duration_days | Destaca anuncio deduciendo créditos |
| `purchase_credits()` | user_id, quantity, payment_id | Compra créditos (Mercado Pago) |
| `grant_signup_promo()` | user_id | Regala créditos a nuevo usuario |
| `grant_monthly_credits()` | - | Otorga créditos mensuales a planes |
| `expire_featured_ads()` | - | Expira anuncios y actualiza status |
| `get_user_featured_ads()` | user_id | Obtiene anuncios destacados del usuario |
| `get_featured_by_category()` | category_id, subcat_id | Anuncios destacados por categoría |
| `get_credit_transactions()` | user_id, limit | Historial de transacciones |
| `calculate_credit_price()` | quantity | Precio dinámico por cantidad |
| `get_available_durations()` | - | Obtiene duraciones disponibles |

---

## 🎨 Componentes React

### 1. `UserCreditsPanel`
**Ubicación:** `frontend/src/components/dashboard/UserCreditsPanel.tsx`

**Responsabilidades:**
- Mostrar balance actual
- Listar 4 opciones de compra (1, 2, 3, 4 créditos)
- Historial últimas 20 transacciones
- Botón para abrir modal de compra

**Props:**
```tsx
interface Props {
  onOpenBuyCredits?: () => void;
}
```

**Ejemplo de uso:**
```tsx
const [showBuyModal, setShowBuyModal] = useState(false);

<UserCreditsPanel onOpenBuyCredits={() => setShowBuyModal(true)} />
<BuyCreditsModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />
```

---

### 2. `FeaturedAdModalWithCredits`
**Ubicación:** `frontend/src/components/modals/FeaturedAdModalWithCredits.tsx`

**Responsabilidades:**
- Selector de duración (7/14/21/28 días)
- Mostrar créditos requeridos y precio
- Validar si usuario tiene suficientes créditos
- Ejecutar destacado y mostrar success/error

**Props:**
```tsx
interface Props {
  isOpen: boolean;
  adId: string;
  adTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}
```

**Ejemplo de uso:**
```tsx
const [selectedAd, setSelectedAd] = useState<string | null>(null);

<FeaturedAdModalWithCredits
  isOpen={!!selectedAd}
  adId={selectedAd!}
  adTitle="Mi anuncio"
  onClose={() => setSelectedAd(null)}
/>
```

---

### 3. `BuyCreditsModal`
**Ubicación:** `frontend/src/components/modals/BuyCreditsModal.tsx`

**Responsabilidades:**
- Grid de opciones (1, 2, 3, 4 créditos)
- Mostrar precio total
- Documentación sobre funcionamiento
- Procesar pago (Mercado Pago - mock actualmente)

**Props:**
```tsx
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

**Flujo de pago:**
```
1. Usuario selecciona cantidad
2. Se muestra precio total
3. Click en "Pagar"
4. Redirige a Mercado Pago (o mock en desarrollo)
5. Después de pagar, vuelve a app
6. Créditos se agregan al balance
```

---

### 4. `SuperAdminCreditsConfig`
**Ubicación:** `frontend/src/components/admin/SuperAdminCreditsConfig.tsx`

**Responsabilidades:**
- Editar precio base por crédito
- Editar créditos requeridos por duración
- Editar créditos promo para nuevos usuarios
- Editar días de expiración de promo

**Props:**
```tsx
// Sin props, obtiene auth del usuario
```

**Ejemplo de uso:**
```tsx
{isSuperAdmin && <SuperAdminCreditsConfig />}
```

---

### 5. `SearchResultsWithFeatured`
**Ubicación:** `frontend/src/components/search/SearchResultsWithFeatured.tsx`

**Responsabilidades:**
- Obtener anuncios destacados para categoría
- Mostrar con border verde y badge "Destacado"
- Separación visual de anuncios regulares
- Cards responsive con imagen, precio, ubicación

**Props:**
```tsx
interface Props {
  categoryId: string;
  subcategoryId?: string;
  searchQuery?: string;
  onAdClick?: (adId: string) => void;
}
```

**Ejemplo de uso:**
```tsx
<SearchResultsWithFeatured
  categoryId="cat-123"
  subcategoryId="subcat-456"
  onAdClick={(adId) => router.push(`/ads/${adId}`)}
/>
```

---

## 🪝 Hooks Personalizados

**Ubicación:** `frontend/src/hooks/useCredits.ts`

### Hooks Disponibles

```typescript
// 1. Obtener balance del usuario
const { credits, loading, error, refetch } = useUserCredits();

// 2. Obtener configuración global
const { config, loading, error } = useCreditsConfig();

// 3. Obtener anuncios destacados
const { ads, loading, error, refetch } = useFeaturedAds(categoryId, subcategoryId);

// 4. Activar destacado
const { activate, loading, error, success } = useActivateFeatured();
await activate(adId, 7); // 7 días

// 5. Comprar créditos
const { purchase, loading, error, success } = usePurchaseCredits();
await purchase(3, 'payment_id'); // Comprar 3 créditos

// 6. Historial de transacciones
const { transactions, loading, error, refetch } = useCreditTransactions(20);

// 7. Verificar si puede comprar destacado
const { canAfford, creditsNeeded, totalPrice, currentBalance } = useCanAffordFeatured(7);

// 8. Flujo completo de destacado
const { highlightAd, loading, error, success } = useFeaturedAdFlow();
await highlightAd(adId, 7);
```

---

## 🔄 Flujos de Uso

### Flujo A: Usuario Destaca Anuncio

```
1. Usuario abre página de "Mis Anuncios"
2. Click en botón "Destacar" de un anuncio
3. Se abre FeaturedAdModalWithCredits
4. Selecciona duración (7/14/21/28 días)
5. Verifica si tiene créditos suficientes
6. Si SÍ → Click en "Destacar" → RPC activate_featured_with_credits
   - Verifica balance
   - Deduce créditos
   - Crea registro en featured_ads
   - Crea transacción en credit_transactions
   ✓ Anuncio ahora aparece en búsqueda con badge
7. Si NO → Click en "Comprar créditos" → BuyCreditsModal
   - Selecciona cantidad (1/2/3/4)
   - Ve precio total
   - Click en "Pagar"
   - Mercado Pago (webhook después)
   - Vuelve con créditos en balance
   - Repite desde paso 4
```

### Flujo B: Usuario Compra Créditos

```
1. Usuario abre Dashboard o intenta destacar sin créditos
2. Click en "Comprar Créditos"
3. Se abre BuyCreditsModal
4. Selecciona cantidad (1, 2, 3, 4)
5. Ve precio: $2.500, $5.000, $7.500, $10.000
6. Click en "Pagar $X.XXX"
7. Se crea preferencia de pago en Mercado Pago
8. Usuario completa pago
9. El webhook de Mercado Pago confirma
10. RPC purchase_credits() agrega créditos al balance
11. Usuario ve balance actualizado
✓ Ahora puede destacar anuncios
```

### Flujo C: Nuevo Usuario se Registra

```
1. Usuario completa signup
2. Se crea registro en users
3. AuthService llama a grantSignupPromo(userId)
4. RPC grant_signup_promo ejecuta:
   - Crea registro en user_credits con balance = 3 (configurable)
   - Crea transacción de tipo "promo_grant"
   - Calcula fecha de expiración (30 días, configurable)
5. Usuario ve dashboard con 3 créditos
6. Puede usarlos para destacar dentro de 30 días
7. Después de 30 días, se expiran automáticamente (cron job)
```

### Flujo D: Superadmin Edita Configuración

```
1. Superadmin accede a /admin/credits-config
2. VerificaAutenticación (is_superadmin = true)
3. Se carga SuperAdminCreditsConfig
4. Edita opciones:
   - Precio base: $2.500 → $3.000
   - Créditos duración: 7d = 1 → 2 créditos
   - Promo nuevos: 3 → 5 créditos
   - Días promo: 30 → 60 días
5. Click en "Guardar Cambios"
6. Actualiza global_config via supabase.from().upsert()
7. Cambios se aplican inmediatamente
8. Los precios para nuevas compras reflejan cambios
```

---

## 🔐 Seguridad

### Row-Level Security (RLS)

Políticas configuradas en Supabase:

```sql
-- credit_transactions: Solo usuarios ven sus propias transacciones
SELECT: (user_id = auth.uid())

-- featured_ads: Todos pueden ver (para búsqueda), 
--               pero solo propietario puede crear/editar
SELECT: true
INSERT: (ad_id.user_id = auth.uid())
UPDATE: (ad_id.user_id = auth.uid())

-- global_config: Solo superadmins pueden actuali
SELECT: true
UPDATE: (auth.jwt() ->> 'is_superadmin' = 'true')
```

### Transacciones Atómicas

El RPC `activate_featured_with_credits()` es atómico:

```sql
BEGIN;
  -- 1. Validar balance
  -- 2. Deducir créditos
  -- 3. Crear featured_ad
  -- 4. Crear transacción
COMMIT;
-- Si alguno falla, TODO se revierte
```

---

## 📊 Monitoreo y Análisis

### Queries Útiles

```sql
-- Ver todas las compras de créditos
SELECT * FROM credit_transactions
WHERE type = 'purchase'
ORDER BY created_at DESC;

-- Ver anuncios actualmente destacados
SELECT fa.*, a.title, u.name
FROM featured_ads fa
JOIN ads a ON fa.ad_id = a.id
JOIN users u ON a.user_id = u.id
WHERE fa.status = 'active'
ORDER BY fa.activated_at DESC;

-- Ver balance por usuario
SELECT u.name, uc.balance, uc.monthly_allowance
FROM user_credits uc
JOIN users u ON uc.user_id = u.id
ORDER BY uc.balance DESC;

-- Ver créditos gastados (destacados)
SELECT * FROM credit_transactions
WHERE type = 'spend'
ORDER BY created_at DESC;

-- Ingresos por venta de créditos
SELECT SUM(amount * credit_base_price) as total_revenue
FROM credit_transactions ct
JOIN global_config gc ON gc.config_key = 'credit_base_price'
WHERE ct.type = 'purchase';
```

---

## 🚀 Deployment Checklist

- [ ] SQL migration 044_credits_system.sql ejecutada
- [ ] creditsService.ts en frontend/src/services/
- [ ] 5 componentes React creados
- [ ] Hooks en frontend/src/hooks/useCredits.ts
- [ ] Dashboard integrado
- [ ] Búsqueda con destacados integrada
- [ ] Panel admin protegido con is_superadmin
- [ ] Signup promo configurado
- [ ] Mercado Pago API key en .env
- [ ] Webhook de Mercado Pago configurado
- [ ] Cron jobs para expiration y monthly grants
- [ ] Testing completo en staging
- [ ] Documentación enviada al equipo

---

## 📱 Responsive Design

Todos los componentes son mobile-first:

```
Mobile (320px)   → Optimizado
Tablet (768px)   → Optimizado
Desktop (1024px) → Optimizado
XL (1280px)      → Optimizado
```

Clases Tailwind usadas:
- `p-4 sm:p-6 md:p-8` (padding responsive)
- `text-sm sm:text-base md:text-lg` (tamaño texto)
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (grid responsive)
- `w-full md:w-1/2` (ancho condicional)

---

## 🌳 Design System Rural24

### Colores Utilizados

```
Verde Principal:    #16a135 (bg-green-600)
Verde Oscuro:       #128a2e (bg-green-700)
Verde Claro:        #dcf5e3 (bg-green-50)
Blanco:             #ffffff
Gris Oscuro:        #1f2937 (text-gray-800)
Gris Medio:         #6b7280 (text-gray-600)
Gris Claro:         #f3f4f6 (bg-gray-50)
```

### Componentes Base

- Botones: Rounded-lg to rounded-xl
- Cards: Rounded-2xl con shadow-md/lg
- Inputs: Border-gray-300 con focus:ring-green-600
- Badges: Inline-flex con gap-1 a gap-3

---

## 🧪 Testing

### Test Manual (Recomendado)

```bash
# 1. Usuario registra y recibe 3 créditos gratis
# Verify: user_credits.balance = 3

# 2. Usuario intenta destacar (7 días = 1 crédito)
# Verify: featured_ads created, user_credits.balance = 2

# 3. Usuario compra 4 créditos (mock)
# Verify: user_credits.balance = 6, credit_transactions.type = 'purchase'

# 4. Anuncio aparece en búsqueda con badge
# Verify: SearchResultsWithFeatured muestra anuncio con border verde

# 5. Superadmin cambia precio base de 2500 a 3000
# Verify: global_config.credit_base_price = 3000
```

### Test Automatizado (Opcional)

```typescript
// __tests__/creditsService.test.ts
test('activate_featured_with_credits deduces credits', async () => {
  // Setup
  const userId = 'test-user';
  const adId = 'test-ad';
  
  // Act
  await activateFeaturedWithCredits(userId, adId, 7);
  
  // Assert
  const { data } = await supabase
    .from('featured_ads')
    .select('*')
    .eq('ad_id', adId)
    .single();
  
  expect(data.status).toBe('active');
});
```

---

## 📚 Referencias Útiles

- [Supabase RPC Documentation](https://supabase.com/docs/guides/database/tables#calling-functions)
- [Tailwind CSS Mobile-First](https://tailwindcss.com/docs/responsive-design)
- [Mercado Pago API](https://www.mercadopago.com.ar/developers/es)
- [React Hooks Best Practices](https://react.dev/reference/react/hooks)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🆘 FAQ

**P: ¿Qué pasa si la transacción falla a mitad de camino?**
R: Las funciones RPC usan transacciones SQL. Si algo falla, TODO se revierte.

**P: ¿Los créditos expiran?**
R: Solo los créditos de promoción para nuevos usuarios expiran. Los comprados no.

**P: ¿Cómo se procesan los pagos de Mercado Pago?**
R: Un webhook recibe confirmación y ejecuta la función RPC `purchase_credits()`.

**P: ¿Puedo cambiar el precio después de que usuarios compren?**
R: Sí, es configurable en global_config. Cada nueva compra usa el precio actual.

**P: ¿Qué pasa con los anuncios cuando expira el destacado?**
R: Se usan RPC `expire_featured_ads()` (cron cada noche). Después solo aparecen anuncios regulares.

**P: ¿Cómo agrego más duraciones (ej: 35 días)?**
R: Actualiza `featured_durations` JSON en global_config. Requiere actualizar migration.

---

## ✅ Estado Actual

✅ **Completado:**
- Arquitectura diseñada y validada
- DB schema (10 funciones RPC, 6 tablas)
- Backend TypeScript service layer (8 funciones)
- 5 componentes React (Mobile-first, responsive)
- 8 hooks personalizados
- Guía de integración completa
- Documentación exhaustiva

⏳ **Pendiente:**
- Ejecución de migración SQL en BD real
- Integración en aplicación frontend (imports + routing)
- Webhook de Mercado Pago (si usas real)
- Testing en staging/producción
- Cron jobs para expiración

---

**Creado con ❤️ para RURAL24**

Última actualización: Feb 2026
Versión: 1.0.0
