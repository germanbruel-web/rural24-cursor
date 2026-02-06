/**
 * INTEGRATION_GUIDE.md
 * Guía de integración del sistema de créditos y anuncios destacados
 * Mobile First - Design System RURAL24
 */

# Sistema de Créditos y Anuncios Destacados - Guía de Integración

## 📋 Resumen

Este documento describe cómo integrar el sistema de créditos y anuncios destacados en tu aplicación Rural24.

---

## 🎯 Componentes Creados

### Backend (TypeScript Service Layer)
- **`creditsService.ts`** - Todas las operaciones CRUD para créditos y anuncios destacados

### Base de Datos
- **`044_credits_system.sql`** - Migración completa con 10 funciones RPC y 6 tablas

### Frontend (React Components)

1. **`UserCreditsPanel.tsx`** 
   - Dashboard del usuario mostrando balance, transacciones, opción de comprar
   - Ubicación: `frontend/src/components/dashboard/`

2. **`FeaturedAdModalWithCredits.tsx`**
   - Modal para destacar un anuncio seleccionando duración
   - Ubicación: `frontend/src/components/modals/`

3. **`BuyCreditsModal.tsx`**
   - Modal para comprar créditos (integración con Mercado Pago)
   - Ubicación: `frontend/src/components/modals/`

4. **`SuperAdminCreditsConfig.tsx`**
   - Panel de administración para editar configuración global
   - Ubicación: `frontend/src/components/admin/`

5. **`SearchResultsWithFeatured.tsx`**
   - Componente para mostrar anuncios destacados en búsqueda
   - Ubicación: `frontend/src/components/search/`

---

## 🔌 Integración en tu App

### 1. Dashboard de Usuario

**Archivo:** `frontend/src/pages/dashboard.tsx` (o donde tengas el dashboard)

```tsx
import { useState } from 'react';
import { UserCreditsPanel } from '../components/dashboard/UserCreditsPanel';
import { BuyCreditsModal } from '../components/modals/BuyCreditsModal';

export default function Dashboard() {
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);

  return (
    <div>
      <UserCreditsPanel onOpenBuyCredits={() => setShowBuyCreditsModal(true)} />
      
      <BuyCreditsModal
        isOpen={showBuyCreditsModal}
        onClose={() => setShowBuyCreditsModal(false)}
        onSuccess={() => {
          // Recargar datos del usuario si es necesario
        }}
      />
    </div>
  );
}
```

---

### 2. Página de Anuncio del Usuario

**Archivo:** `frontend/src/pages/my-ads.tsx` (o donde muestres los anuncios del usuario)

```tsx
import { useState } from 'react';
import { FeaturedAdModalWithCredits } from '../components/modals/FeaturedAdModalWithCredits';

export default function MyAds() {
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);

  return (
    <div>
      {/* Lista de tus anuncios */}
      {userAds.map(ad => (
        <div key={ad.id}>
          <h3>{ad.title}</h3>
          <button onClick={() => setSelectedAdId(ad.id)}>
            ⭐ Destacar
          </button>
        </div>
      ))}

      {/* Modal para destacar */}
      {selectedAdId && (
        <FeaturedAdModalWithCredits
          isOpen={!!selectedAdId}
          adId={selectedAdId}
          adTitle={userAds.find(a => a.id === selectedAdId)?.title}
          onClose={() => setSelectedAdId(null)}
          onSuccess={() => {
            // Recargar anuncios si es necesario
          }}
        />
      )}
    </div>
  );
}
```

---

### 3. Página de Búsqueda de Anuncios

**Archivo:** `frontend/src/pages/search.tsx` (o donde hagas búsqueda)

```tsx
import { SearchResultsWithFeatured } from '../components/search/SearchResultsWithFeatured';

export default function SearchPage() {
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');

  return (
    <div>
      {/* Filtros */}
      {/* ... */}

      {/* Resultados con anuncios destacados */}
      <SearchResultsWithFeatured
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        onAdClick={(adId) => {
          // Navegar a detalle del anuncio
        }}
      />
    </div>
  );
}
```

---

### 4. Panel de Administración

**Archivo:** `frontend/src/pages/admin/credits-config.tsx`

```tsx
import { SuperAdminCreditsConfig } from '../../components/admin/SuperAdminCreditsConfig';

export default function CreditsConfigPage() {
  return (
    <div>
      <SuperAdminCreditsConfig />
    </div>
  );
}
```

---

## 🔐 Autenticación y Autorización

### Proteger el Panel de Admin

```tsx
// pages/admin/credits-config.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../services/supabaseClient';

export default function CreditsConfigPage() {
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Verificar si es superadmin
      const { data } = await supabase
        .from('users')
        .select('is_superadmin')
        .eq('id', user.id)
        .single();

      if (!data?.is_superadmin) {
        router.push('/');
        return;
      }

      setIsSuperAdmin(true);
    };

    checkAuth();
  }, []);

  if (!isSuperAdmin) return null;

  return <SuperAdminCreditsConfig />;
}
```

---

## 🎁 Otorgar Créditos Bonus al Registrarse

**Archivo:** `frontend/src/services/authService.ts` (o donde manejes el signup)

```tsx
import { grantSignupPromo } from './creditsService';

export async function handleUserSignup(email: string, password: string) {
  // Crear usuario...
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data?.user) throw error;

  // Otorgar créditos de promoción
  try {
    await grantSignupPromo(data.user.id);
  } catch (err) {
    console.error('Error granting signup promo:', err);
  }

  return data;
}
```

---

## 💰 Integración con Mercado Pago

**Archivo:** `frontend/src/components/modals/BuyCreditsModal.tsx` (actualizar)

En el método `handlePurchase()`, debes reemplazar el mock con une llamada real a Mercado Pago:

```tsx
const handlePurchase = async () => {
  if (!user) return;

  // 1. Crear preferencia de pago en Mercado Pago
  const response = await fetch('/api/mercado-pago/create-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      credits: selectedQuantity,
      totalPrice: totalPrice,
    }),
  });

  const preference = await response.json();

  // 2. Redirigir a Mercado Pago
  window.location.href = preference.init_point;
};
```

Necesitarás crear una API route en `pages/api/mercado-pago/create-preference.ts`:

```tsx
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, credits, totalPrice } = req.body;

  try {
    // Crear preferencia con SDK de Mercado Pago
    const mercadoPago = require('mercadopago');
    mercadoPago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    });

    const preference = await mercadoPago.preferences.create({
      items: [
        {
          title: `${credits} Crédito(s) - Rural24`,
          quantity: 1,
          unit_price: totalPrice,
        },
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL}/credits/success`,
        failure: `${process.env.NEXT_PUBLIC_URL}/credits/failure`,
        pending: `${process.env.NEXT_PUBLIC_URL}/credits/pending`,
      },
      notification_url: `${process.env.NEXT_PUBLIC_URL}/api/mercado-pago/webhook`,
      external_reference: `USER_${userId}_CREDITS_${credits}`,
    });

    res.status(200).json(preference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 📱 Estilos y Tailwind CSS

Todos los componentes usan **Tailwind CSS** con clases mobile-first:

- Grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Padding adaptativo: `p-4 sm:p-6 md:p-8`
- Texto responsivo: `text-sm sm:text-base md:text-lg`

No necesitas configuración adicional de Tailwind.

---

## 🗄️ Variables de Entorno Necesarias

Agrega a tu `.env.local`:

```bash
# Mercado Pago
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=your_public_key
MERCADO_PAGO_ACCESS_TOKEN=your_access_token

# Supabase (probablemente ya tienes)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## 🧪 Testing

### Probar getFeaturedAdsForResults()

```tsx
import { getFeaturedAdsForResults } from '@/services/creditsService';

async function testFeatured() {
  const ads = await getFeaturedAdsForResults('cat-123', 'subcat-456');
  console.log('Featured ads:', ads);
}
```

### Probar activateFeaturedWithCredits()

```tsx
import { activateFeaturedWithCredits } from '@/services/creditsService';

async function testActivate() {
  await activateFeaturedWithCredits('user-123', 'ad-456', 7);
  console.log('Ad highlighted for 7 days');
}
```

---

## 🔄 Cron Jobs (Tareas Programadas)

Para que las funciones de vencimiento y créditos mensuales se ejecuten automáticamente:

### Opción 1: Supabase Cron (Recomendado)

Usa Supabase Edge Functions para ejecutar funciones RPC periódicamente:

```bash
# Crear Job con pg_cron (en SQL)
SELECT cron.schedule('grant-monthly-credits', '0 0 1 * *', 'SELECT grant_monthly_credits()');
SELECT cron.schedule('expire-featured-ads', '0 0 * * *', 'SELECT expire_featured_ads()');
```

### Opción 2: Node.js + node-cron (Alternativa)

```tsx
// pages/api/cron/grant-monthly-credits.ts
import cron from 'node-cron';
import { supabase } from '@/services/supabaseClient';

cron.schedule('0 0 1 * *', async () => {
  const { error } = await supabase.rpc('grant_monthly_credits');
  if (error) console.error('Cron error:', error);
});
```

---

## 📊 Monitoreo y Analítica

Puedes ver todas las transacciones en la tabla `credit_transactions`:

```tsx
// Ver todas las compras de créditos
const { data } = await supabase
  .from('credit_transactions')
  .select('*')
  .eq('type', 'purchase')
  .order('created_at', { ascending: false });
```

---

## 🚀 Checklist de Implementación

- [ ] Migración SQL ejecutada (`044_credits_system.sql`)
- [ ] Servicio TypeScript creado (`creditsService.ts`)
- [ ] Componentes React creados (5 componentes)
- [ ] Dashboard de usuario integrado
- [ ] Modal de destacado integrado
- [ ] Modal de compra integrado
- [ ] Resultados de búsqueda integrados
- [ ] Panel de admin integrado
- [ ] Autenticación de superadmin configurada
- [ ] Signup promo créditos implementado
- [ ] Mercado Pago webhook configurado
- [ ] Cron jobs para expiración configurados
- [ ] Testing en ambiente de desarrollo
- [ ] Deploy a producción

---

## 💡 Tips y Mejores Prácticas

1. **Caché de Configuración**: Cacheá `getCreditsConfig()` por 5 minutos para evitar queries innecesarias
2. **Transacciones**: El RPC `activateFeaturedWithCredits()` usa transacciones SQL para atomicidad
3. **Error Handling**: Todos los componentes tienen try-catch y muestran errores al usuario
4. **Mobile First**: Todos los componentes son fully responsive
5. **Real-time**: Usa Supabase subscriptions para actualizar balance en tiempo real

---

## 🆘 Troubleshooting

### "Error: credit_base_price not found"
- Verifica que la migración 044 se ejecutó correctamente
- Corre: `SELECT * FROM global_config;`

### "Modal no se abre"
- Verifica que estés usando `isOpen` y `onClose` correctamente
- Revisa que el estado `showModal` esté actualizado

### "Créditos no se deducen"
- Verifica el balance en `user_credits`
- Revisa logs de error en la función RPC

---

## 📞 Soporte

Si tienes problemas con la integración:
1. Revisa la sección de Troubleshooting
2. Verifica los logs de Supabase
3. Prueba localmente primero antes de deployar

¡Éxito con tu implementación! 🚀
