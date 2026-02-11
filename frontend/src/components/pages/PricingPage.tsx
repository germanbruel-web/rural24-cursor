import React, { useState, useEffect } from 'react';
import { Check, X, Sparkles, Zap, Building2, Gift, Megaphone, Send, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';
import { getAllPlans, formatPrice, type SubscriptionPlan } from '../../services/subscriptionService';
import { navigateTo } from '../../hooks/useNavigate';

// Iconos por nombre
const PLAN_ICONS: Record<string, React.ReactNode> = {
  gift: <Gift className="w-8 h-8" />,
  zap: <Zap className="w-8 h-8" />,
  sparkles: <Sparkles className="w-8 h-8" />,
  building2: <Building2 className="w-8 h-8" />,
};

// Colores por badge_color
const COLOR_CLASSES: Record<string, { bg: string; text: string; ring: string }> = {
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', ring: '' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', ring: '' },
  green: { bg: 'bg-green-100', text: 'text-green-600', ring: 'ring-4 ring-green-500 ring-opacity-50' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', ring: '' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-600', ring: '' },
  red: { bg: 'bg-red-100', text: 'text-red-600', ring: '' },
};

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar planes de la base de datos
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await getAllPlans();
        setPlans(data);
      } catch (err) {
        console.error('Error loading plans:', err);
      }
      setLoading(false);
    };
    loadPlans();
  }, []);

  const handleSelectPlan = (planName: string) => {
    if (planName === 'free' && !user) {
      setShowAuthModal(true);
      return;
    }

    if (planName === 'empresa') {
      window.location.href = '#contact';
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    navigateTo('/subscription');
  };

  // Formatear límite
  const formatLimit = (value: number | null, suffix: string = ''): string => {
    if (value === null) return 'Ilimitados';
    return `${value}${suffix}`;
  };

  // Obtener icono del plan
  const getPlanIcon = (plan: SubscriptionPlan) => {
    const iconName = (plan as any).icon_name || 
      (plan.name === 'free' ? 'gift' : 
       plan.name === 'starter' ? 'zap' : 
       plan.name === 'pro' ? 'sparkles' : 'building2');
    return PLAN_ICONS[iconName] || PLAN_ICONS.gift;
  };

  // Obtener colores del plan
  const getPlanColors = (plan: SubscriptionPlan) => {
    const color = plan.badge_color || 'gray';
    return COLOR_CLASSES[color] || COLOR_CLASSES.gray;
  };

  // Obtener CTA text
  const getCtaText = (plan: SubscriptionPlan) => {
    if (plan.name === 'free') return 'Comenzar Gratis';
    if (plan.name === 'empresa') return 'Contactar Ventas';
    return `Elegir ${plan.display_name}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
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
      <div className="max-w-[1400px] mx-auto px-4 py-12">
        {/* Aviso de Lanzamiento */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">🚀 Etapa de Lanzamiento</h3>
          <p className="text-gray-700 text-lg">
            Durante esta etapa, <strong>todos los usuarios tienen acceso gratuito al plan Starter</strong>.
          </p>
          <p className="text-gray-600 mt-2">
            Los planes Premium estarán disponibles próximamente con funcionalidades exclusivas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const colors = getPlanColors(plan);
            const isFeatured = (plan as any).is_featured || plan.name === 'pro';
            const badgeText = (plan as any).badge_text || (plan.name === 'pro' ? 'Más Popular' : plan.name === 'empresa' ? 'Premium' : '');
            const features = Array.isArray(plan.features) ? plan.features : [];
            const isStarter = plan.name === 'free' || plan.name === 'starter';
            const isComingSoon = !isStarter;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
                  isComingSoon ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl hover:scale-105'
                } ${
                  isFeatured && !isComingSoon ? 'ring-4 ring-green-500 ring-opacity-50' : ''
                }`}
              >
                {/* Badge */}
                {badgeText && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {badgeText}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${colors.bg} ${colors.text}`}>
                    {getPlanIcon(plan)}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.display_name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description || ''}</p>

                  {/* Price */}
                  {isStarter ? (
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-green-600">
                          Gratis
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Durante el lanzamiento
                      </p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-400">
                          Próximamente
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Precio por confirmar
                      </p>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Megaphone className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-700">Avisos:</span>
                      <span className="text-gray-900">{formatLimit(plan.max_ads)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Send className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-700">Contactos/mes:</span>
                      <span className="text-gray-900">{formatLimit(plan.max_contacts_per_month)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-700">Destacados:</span>
                      <span className="text-gray-900">{plan.max_featured_ads || 0}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-6">
                    {features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => !isComingSoon && handleSelectPlan(plan.name)}
                    disabled={isComingSoon}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      isComingSoon
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : isFeatured
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {isComingSoon ? '🔒 Próximamente' : getCtaText(plan)}
                  </button>
                </div>
              </div>
            );
          })}
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
