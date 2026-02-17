import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  Award,
  TrendingUp,
  RefreshCw,
  Download,
  AlertCircle,
  Zap,
  Crown,
  Building
} from 'lucide-react';
import { notify } from '../../utils/notifications';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  userType: 'particular' | 'empresa';
  features: PlanFeature[];
  popular?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'premium-particular-monthly',
    name: 'Premium Particular',
    price: 4999,
    period: 'monthly',
    userType: 'particular',
    features: [
      { name: 'Avisos ilimitados', included: true },
      { name: 'Destacados en homepage', included: true },
      { name: 'Badge Premium visible', included: true },
      { name: 'Inbox de mensajes ilimitado', included: true },
      { name: 'Estadísticas avanzadas', included: true },
      { name: 'Soporte prioritario', included: false },
      { name: 'Logo de empresa', included: false },
    ],
  },
  {
    id: 'premium-particular-yearly',
    name: 'Premium Particular Anual',
    price: 49990,
    period: 'yearly',
    userType: 'particular',
    features: [
      { name: 'Avisos ilimitados', included: true },
      { name: 'Destacados en homepage', included: true },
      { name: 'Badge Premium visible', included: true },
      { name: 'Inbox de mensajes ilimitado', included: true },
      { name: 'Estadísticas avanzadas', included: true },
      { name: '2 meses gratis', included: true },
      { name: 'Soporte prioritario', included: false },
    ],
    popular: true,
  },
  {
    id: 'premium-empresa-monthly',
    name: 'Premium Empresa',
    price: 9999,
    period: 'monthly',
    userType: 'empresa',
    features: [
      { name: 'Avisos ilimitados', included: true },
      { name: 'Destacados en homepage', included: true },
      { name: 'Badge Premium + Logo empresa', included: true },
      { name: 'Inbox de mensajes ilimitado', included: true },
      { name: 'Estadísticas avanzadas', included: true },
      { name: 'Soporte prioritario 24/7', included: true },
      { name: 'Múltiples usuarios', included: true },
    ],
  },
  {
    id: 'premium-empresa-yearly',
    name: 'Premium Empresa Anual',
    price: 99990,
    period: 'yearly',
    userType: 'empresa',
    features: [
      { name: 'Avisos ilimitados', included: true },
      { name: 'Destacados en homepage', included: true },
      { name: 'Badge Premium + Logo empresa', included: true },
      { name: 'Inbox de mensajes ilimitado', included: true },
      { name: 'Estadísticas avanzadas', included: true },
      { name: 'Soporte prioritario 24/7', included: true },
      { name: 'Múltiples usuarios', included: true },
      { name: '2 meses gratis', included: true },
    ],
    popular: true,
  },
];

export const SubscriptionPanel: React.FC = () => {
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);

  const isPremium = profile?.role === 'premium';
  const isActive = profile?.subscription_status === 'active';
  const userType = profile?.user_type || 'particular';

  // Calcular fecha de renovación (ejemplo)
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  const currentPlan = isPremium 
    ? PRICING_PLANS.find(p => p.userType === userType && p.period === 'monthly')
    : null;

  const availablePlans = PRICING_PLANS.filter(p => p.period === selectedPeriod);

  const handleSubscribe = async (planId: string) => {
    setProcessing(true);
    try {
      // TODO: Integrar con Mercado Pago o payment provider
      await new Promise(resolve => setTimeout(resolve, 2000));
      notify.success('Redirigiendo a la pasarela de pago...');
      // Aquí iría la redirección a Mercado Pago
    } catch (error) {
      notify.error('Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de cancelar tu suscripción? Perderás todos los beneficios premium al finalizar el período actual.')) {
      return;
    }

    try {
      // TODO: Implementar cancelación
      notify.success('Suscripción cancelada. Seguirás teniendo acceso hasta el final del período.');
    } catch (error) {
      notify.error('Error al cancelar suscripción');
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // TODO: Implementar descarga de factura
    notify.info('Descargando factura...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Suscripción</h1>
        <p className="text-gray-600 mt-1">
          {isPremium ? 'Gestiona tu plan Premium' : 'Elige el plan perfecto para tu negocio'}
        </p>
      </div>

      {/* Current Subscription (si tiene) */}
      {isPremium && isActive && (
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center text-white">
                {userType === 'empresa' ? <Building className="w-6 h-6" /> : <Award className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Plan {userType === 'empresa' ? 'Empresa' : 'Particular'} Premium
                </h2>
                <p className="text-sm text-gray-700">Suscripción activa</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-brand-600 text-white rounded-full font-bold text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Activo
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/60 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Precio mensual</div>
              <div className="text-2xl font-bold text-gray-900">
                ${currentPlan?.price.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Próxima renovación</div>
              <div className="text-lg font-bold text-gray-900">
                {renewalDate.toLocaleDateString('es-AR')}
              </div>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Método de pago</div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-900">•••• 4242</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Cambiar plan
            </button>
            <button className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300">
              Actualizar método de pago
            </button>
            <button 
              onClick={handleCancelSubscription}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              Cancelar suscripción
            </button>
          </div>
        </div>
      )}

      {/* Aviso de Lanzamiento */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-brand-50 to-emerald-50 border-2 border-brand-200 rounded-xl p-6 mb-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">🚀 Etapa de Lanzamiento</h3>
            <p className="text-gray-700 text-lg mb-2">
              Durante esta etapa, <strong>todos los usuarios tienen acceso gratuito</strong>.
            </p>
            <p className="text-gray-600">
              Los planes Premium con funcionalidades exclusivas estarán disponibles próximamente.
            </p>
          </div>
        </div>
      )}

      {/* Pricing Cards - Temporalmente deshabilitados */}
      {!isPremium && (
        <div className="grid md:grid-cols-2 gap-6">
          {availablePlans.map((plan) => {
            const isComingSoon = true; // Todos los planes premium están deshabilitados
            return (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg border-2 overflow-hidden opacity-50 cursor-not-allowed ${
                plan.popular ? 'border-brand-600' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-center py-2 font-bold text-sm">
                  🔒 PRÓXIMAMENTE
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {plan.userType === 'empresa' ? (
                    <Building className="w-8 h-8 text-brand-600" />
                  ) : (
                    <Award className="w-8 h-8 text-brand-600" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">
                      {plan.userType === 'empresa' ? 'Para empresas' : 'Para particulares'}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-400">
                      Próximamente
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Precio por confirmar
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <CheckCircle className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-900' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={true}
                  className="w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  🔒 Próximamente
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">¿Por qué elegir Premium?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <TrendingUp className="w-10 h-10 mb-3" />
            <h3 className="font-bold text-lg mb-2">Mayor Visibilidad</h3>
            <p className="text-brand-100 text-sm">
              Tus avisos aparecen destacados en la homepage y en los primeros resultados de búsqueda
            </p>
          </div>
          <div>
            <Award className="w-10 h-10 mb-3" />
            <h3 className="font-bold text-lg mb-2">Badge Premium</h3>
            <p className="text-brand-100 text-sm">
              Destácate de la competencia con el badge dorado que genera confianza
            </p>
          </div>
          <div>
            <Zap className="w-10 h-10 mb-3" />
            <h3 className="font-bold text-lg mb-2">Sin Límites</h3>
            <p className="text-brand-100 text-sm">
              Publica avisos ilimitados y recibe todas las consultas sin restricciones
            </p>
          </div>
        </div>
      </div>

      {/* Billing History (si es premium) */}
      {isPremium && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Historial de Facturación</h3>
          <div className="space-y-3">
            {[
              { id: '1', date: '2024-11-01', amount: 4999, status: 'paid' },
              { id: '2', date: '2024-10-01', amount: 4999, status: 'paid' },
              { id: '3', date: '2024-09-01', amount: 4999, status: 'paid' },
            ].map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      ${invoice.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(invoice.date).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadInvoice(invoice.id)}
                  className="px-4 py-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">¿Puedo cancelar en cualquier momento?</h4>
            <p className="text-sm text-gray-600">
              Sí, puedes cancelar tu suscripción cuando quieras. Seguirás teniendo acceso a los beneficios hasta el final del período pagado.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">¿Qué métodos de pago aceptan?</h4>
            <p className="text-sm text-gray-600">
              Aceptamos tarjetas de crédito, débito y Mercado Pago.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">¿Puedo cambiar de plan?</h4>
            <p className="text-sm text-gray-600">
              Sí, puedes cambiar de plan en cualquier momento. El cambio se aplicará en el próximo ciclo de facturación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
