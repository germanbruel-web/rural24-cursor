import React, { useState } from 'react';
import { Check, X, Sparkles, Zap, Building2, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';

interface PlanFeature {
  name: string;
  included: boolean;
  tooltip?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: React.ReactNode;
  featured?: boolean;
  ads: string;
  catalog: boolean;
  banners: boolean;
  customBanners: boolean;
  contactsSent: string;
  contactsReceived: string;
  features: PlanFeature[];
  badge?: string;
  ctaText: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'Gratis para siempre',
    description: 'Perfecto para probar la plataforma',
    icon: <Gift className="w-8 h-8" />,
    ads: '1 aviso activo',
    catalog: false,
    banners: false,
    customBanners: false,
    contactsSent: '5 por día',
    contactsReceived: '5 por día',
    features: [
      { name: '1 aviso publicado', included: true },
      { name: '5 contactos enviados/día', included: true },
      { name: '5 contactos recibidos/día', included: true },
      { name: 'Búsqueda avanzada', included: true },
      { name: 'Catálogo de avisos', included: false },
      { name: 'Banners personalizados', included: false },
      { name: 'Soporte prioritario', included: false },
      { name: 'Estadísticas avanzadas', included: false },
    ],
    ctaText: 'Comenzar Gratis',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 5,
    period: 'por mes',
    description: 'Ideal para usuarios activos',
    icon: <Zap className="w-8 h-8" />,
    ads: '5 avisos activos',
    catalog: false,
    banners: false,
    customBanners: false,
    contactsSent: '20 por día',
    contactsReceived: '20 por día',
    features: [
      { name: '5 avisos publicados', included: true },
      { name: '20 contactos enviados/día', included: true },
      { name: '20 contactos recibidos/día', included: true },
      { name: 'Búsqueda avanzada', included: true },
      { name: 'Destacar 1 aviso', included: true },
      { name: 'Catálogo de avisos', included: false },
      { name: 'Banners personalizados', included: false },
      { name: 'Soporte por email', included: true },
    ],
    ctaText: 'Elegir Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10,
    period: 'por mes',
    description: 'El más elegido por profesionales',
    icon: <Sparkles className="w-8 h-8" />,
    featured: true,
    badge: 'Más Popular',
    ads: '10 avisos activos',
    catalog: false,
    banners: true,
    customBanners: false,
    contactsSent: '50 por día',
    contactsReceived: '50 por día',
    features: [
      { name: '10 avisos publicados', included: true },
      { name: '50 contactos enviados/día', included: true },
      { name: '50 contactos recibidos/día', included: true },
      { name: 'Búsqueda avanzada', included: true },
      { name: 'Destacar hasta 3 avisos', included: true },
      { name: 'Banners en búsquedas', included: true, tooltip: 'Aparece en resultados de búsqueda' },
      { name: 'Catálogo de avisos', included: false },
      { name: 'Estadísticas básicas', included: true },
      { name: 'Soporte prioritario', included: true },
    ],
    ctaText: 'Elegir Pro',
  },
  {
    id: 'empresa',
    name: 'Empresa',
    price: 50,
    period: 'por mes',
    description: 'Solución completa para empresas',
    icon: <Building2 className="w-8 h-8" />,
    ads: 'Ilimitados',
    catalog: true,
    banners: true,
    customBanners: true,
    contactsSent: 'Ilimitados',
    contactsReceived: 'Ilimitados',
    features: [
      { name: 'Avisos ilimitados', included: true },
      { name: 'Contactos ilimitados', included: true },
      { name: 'Catálogo completo', included: true, tooltip: 'Acceso a todos los avisos en formato catálogo' },
      { name: 'Banners premium', included: true },
      { name: 'Banners personalizados', included: true, tooltip: 'Diseño custom con tu marca' },
      { name: 'Destacar avisos ilimitados', included: true },
      { name: 'API de integración', included: true },
      { name: 'Estadísticas avanzadas', included: true },
      { name: 'Soporte 24/7', included: true },
      { name: 'Cuenta manager dedicado', included: true },
    ],
    badge: 'Premium',
    ctaText: 'Contactar Ventas',
  },
];

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free' && !user) {
      setShowAuthModal(true);
      return;
    }

    if (planId === 'empresa') {
      // Scroll al footer para contacto
      window.location.href = '#contact';
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Redirigir a suscripción/pago
    window.location.hash = '#/subscription';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Planes y Precios</h1>
          <p className="text-xl text-gray-600 mt-2">
            Elige el plan perfecto para tu negocio agropecuario
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Toggle Billing (futuro) */}
        {/* <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600'
              }`}
            >
              Anual <span className="text-green-600 text-sm ml-1">(Ahorra 20%)</span>
            </button>
          </div>
        </div> */}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-2xl hover:scale-105 ${
                plan.featured ? 'ring-4 ring-green-500 ring-opacity-50' : ''
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${
                  plan.featured ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {plan.icon}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">USD</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{plan.period}</p>
                </div>

                {/* Key Features */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700">📢 Avisos:</span>
                    <span className="text-gray-900">{plan.ads}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700">📤 Contactos enviados:</span>
                    <span className="text-gray-900">{plan.contactsSent}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700">📥 Contactos recibidos:</span>
                    <span className="text-gray-900">{plan.contactsReceived}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700">📚 Catálogo:</span>
                    <span className={plan.catalog ? 'text-green-600' : 'text-gray-400'}>
                      {plan.catalog ? '✓ Sí' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700">🎯 Banners:</span>
                    <span className={plan.banners ? 'text-green-600' : 'text-gray-400'}>
                      {plan.customBanners ? '✓ Custom' : plan.banners ? '✓ Estándar' : '✗ No'}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    plan.featured
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Preguntas Frecuentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h3>
              <p className="text-gray-600 text-sm">
                Sí, puedes actualizar o degradar tu plan cuando lo necesites. Los cambios se aplicarán en tu próximo ciclo de facturación.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-gray-600 text-sm">
                Aceptamos tarjetas de crédito, débito y transferencias bancarias. Para planes Empresa ofrecemos facturación personalizada.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Los contactos se renuevan cada día?
              </h3>
              <p className="text-gray-600 text-sm">
                Sí, los límites de contactos (enviados y recibidos) se reinician automáticamente cada 24 horas a las 00:00 hs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Qué incluye el plan Empresa?
              </h3>
              <p className="text-gray-600 text-sm">
                Contactos ilimitados, banners personalizados con tu marca, API, estadísticas avanzadas y soporte dedicado 24/7.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Necesitas un plan personalizado?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Contáctanos y armamos una solución a medida para tu empresa
          </p>
          <button
            onClick={() => window.location.href = '#contact'}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Contactar a Ventas
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialView="register"
      />
    </div>
  );
};
