/**
 * CheckoutPage.tsx
 * Página de checkout unificada para planes + publicidad
 * 
 * Permite:
 * - Seleccionar plan de suscripción
 * - Agregar créditos para destacar avisos
 * - Contratar programa de banners
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Star, 
  Zap, 
  Image as ImageIcon,
  ShoppingCart,
  CreditCard,
  Gift,
  Package,
  Sparkles,
  Home,
  Search,
  Trash2,
  Plus,
  Minus,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllPlans, formatPrice, type SubscriptionPlan } from '../../services/subscriptionService';
import { navigateTo } from '../../hooks/useNavigate';

// ============================================================================
// TIPOS
// ============================================================================

interface CartItem {
  id: string;
  type: 'plan' | 'credits' | 'banner';
  name: string;
  description: string;
  price: number;
  quantity: number;
  details?: Record<string, any>;
}

interface CreditPack {
  id: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  discount?: number;
  popular?: boolean;
}

interface BannerPackage {
  id: string;
  name: string;
  placement: 'hero' | 'carousel' | 'results';
  description: string;
  price: number;
  duration: string;
  features: string[];
}

// ============================================================================
// DATOS DE PRODUCTOS
// ============================================================================

const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'credit-1',
    credits: 1,
    price: 2500,
    pricePerCredit: 2500,
  },
  {
    id: 'credit-5',
    credits: 5,
    price: 10000,
    pricePerCredit: 2000,
    discount: 20,
    popular: true,
  },
  {
    id: 'credit-10',
    credits: 10,
    price: 18000,
    pricePerCredit: 1800,
    discount: 28,
  },
];

const BANNER_PACKAGES: BannerPackage[] = [
  {
    id: 'banner-hero',
    name: 'Banner Hero',
    placement: 'hero',
    description: 'Máxima visibilidad en la página principal',
    price: 25000,
    duration: '30 días',
    features: [
      'Posición principal en homepage',
      'Tamaño grande (1200x400px)',
      'Máximo impacto visual',
      'Estadísticas de clicks',
    ],
  },
  {
    id: 'banner-carousel',
    name: 'Banner Carrusel',
    placement: 'carousel',
    description: 'Rotación en carrusel de homepage',
    price: 15000,
    duration: '30 días',
    features: [
      'Rotación con otros banners',
      'Tamaño estándar (800x300px)',
      'Buena visibilidad',
      'Estadísticas de clicks',
    ],
  },
  {
    id: 'banner-results',
    name: 'Banner Resultados',
    placement: 'results',
    description: 'Aparece en página de búsqueda y filtros',
    price: 12000,
    duration: '30 días',
    features: [
      'Visible en búsquedas',
      'Tamaño lateral (300x250px)',
      'Segmentado por categoría',
      'Estadísticas de clicks',
    ],
  },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showAdsOptions, setShowAdsOptions] = useState(true);

  // Cargar planes
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await getAllPlans();
        setPlans(data.filter(p => p.name !== 'free'));
      } catch (err) {
        console.error('Error loading plans:', err);
      }
      setLoading(false);
    };
    loadPlans();
  }, []);

  // Agregar plan al carrito
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    // Remover plan anterior si existe
    setCart(prev => prev.filter(item => item.type !== 'plan'));
    // Agregar nuevo plan
    if (plan.price_monthly > 0) {
      setCart(prev => [...prev, {
        id: `plan-${plan.id}`,
        type: 'plan',
        name: plan.display_name,
        description: 'Suscripción mensual',
        price: plan.price_monthly,
        quantity: 1,
      }]);
    }
  };

  // Agregar créditos al carrito
  const handleAddCredits = (pack: CreditPack) => {
    const existingIndex = cart.findIndex(item => item.id === pack.id);
    if (existingIndex >= 0) {
      // Incrementar cantidad
      setCart(prev => prev.map((item, i) => 
        i === existingIndex 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart(prev => [...prev, {
        id: pack.id,
        type: 'credits',
        name: `${pack.credits} Crédito${pack.credits > 1 ? 's' : ''} para Destacar`,
        description: `Destacá ${pack.credits} aviso${pack.credits > 1 ? 's' : ''} por 15 días`,
        price: pack.price,
        quantity: 1,
        details: { credits: pack.credits },
      }]);
    }
  };

  // Agregar banner al carrito
  const handleAddBanner = (banner: BannerPackage) => {
    if (cart.find(item => item.id === banner.id)) {
      return; // Ya está en el carrito
    }
    setCart(prev => [...prev, {
      id: banner.id,
      type: 'banner',
      name: banner.name,
      description: `${banner.placement === 'hero' ? 'Homepage Hero' : banner.placement === 'carousel' ? 'Homepage Carrusel' : 'Resultados'} - ${banner.duration}`,
      price: banner.price,
      quantity: 1,
      details: { placement: banner.placement, duration: banner.duration },
    }]);
  };

  // Remover item del carrito
  const handleRemoveItem = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    if (itemId.startsWith('plan-')) {
      setSelectedPlan(null);
    }
  };

  // Actualizar cantidad
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Calcular total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const hasItems = cart.length > 0;

  // Proceder al pago
  const handleCheckout = () => {
    navigateTo('/checkout/payment');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <div className="w-24" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna Principal - Productos */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Sección: Planes */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" />
                Elegí tu Plan
              </h2>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando planes...</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
                        selectedPlan?.id === plan.id
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900">{plan.display_name}</h3>
                        {selectedPlan?.id === plan.id && (
                          <Check className="w-5 h-5 text-brand-500" />
                        )}
                      </div>
                      <p className="text-2xl font-black text-gray-900">
                        {plan.price_monthly === 0 ? 'Gratis' : formatPrice(plan.price_monthly)}
                        <span className="text-sm font-normal text-gray-500">/mes</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sección: Publicidad (expandible) */}
            <section className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowAdsOptions(!showAdsOptions)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">¿Querés más visibilidad?</h2>
                    <p className="text-sm text-gray-600">Agregá créditos para destacar o contratá banners</p>
                  </div>
                </div>
                <Plus className={`w-5 h-5 text-gray-400 transition-transform ${showAdsOptions ? 'rotate-45' : ''}`} />
              </button>

              {showAdsOptions && (
                <div className="px-6 pb-6 space-y-6">
                  {/* Créditos para Destacar */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      Créditos para Destacar Avisos
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Cada crédito destaca 1 aviso por 15 días en Homepage o Resultados
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-3">
                      {CREDIT_PACKS.map((pack) => (
                        <div
                          key={pack.id}
                          className={`relative border-2 rounded-xl p-4 ${
                            pack.popular ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                          }`}
                        >
                          {pack.popular && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                              Popular
                            </span>
                          )}
                          
                          <div className="text-center mb-3">
                            <div className="text-3xl font-black text-gray-900">{pack.credits}</div>
                            <div className="text-sm text-gray-600">crédito{pack.credits > 1 ? 's' : ''}</div>
                          </div>
                          
                          <div className="text-center mb-3">
                            <div className="text-xl font-bold text-gray-900">
                              {formatPrice(pack.price)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatPrice(pack.pricePerCredit)} c/u
                            </div>
                            {pack.discount && (
                              <div className="text-xs text-brand-500 font-semibold">
                                Ahorrás {pack.discount}%
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleAddCredits(pack)}
                            className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                              pack.popular
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            }`}
                          >
                            Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200" />

                  {/* Programa de Banners */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      Programa de Banners Publicitarios
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Mostrá tu marca con banners en ubicaciones premium
                    </p>
                    
                    <div className="space-y-3">
                      {BANNER_PACKAGES.map((banner) => (
                        <div
                          key={banner.id}
                          className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              banner.placement === 'hero' ? 'bg-purple-100 text-purple-600' :
                              banner.placement === 'carousel' ? 'bg-blue-100 text-blue-600' :
                              'bg-brand-100 text-brand-500'
                            }`}>
                              {banner.placement === 'hero' ? <Home className="w-6 h-6" /> :
                               banner.placement === 'carousel' ? <ImageIcon className="w-6 h-6" /> :
                               <Search className="w-6 h-6" />}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{banner.name}</h4>
                              <p className="text-sm text-gray-600">{banner.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {banner.duration}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {formatPrice(banner.price)}
                            </div>
                            <button
                              onClick={() => handleAddBanner(banner)}
                              disabled={cart.some(item => item.id === banner.id)}
                              className={`mt-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                cart.some(item => item.id === banner.id)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                            >
                              {cart.some(item => item.id === banner.id) ? 'Agregado' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      Los banners requieren aprobación. Te contactaremos para coordinar el diseño.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Columna Lateral - Carrito */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Tu Carrito
              </h2>

              {!hasItems ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Tu carrito está vacío</p>
                  <p className="text-sm text-gray-400 mt-1">Seleccioná un plan o agregá publicidad</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.type === 'plan' ? 'bg-brand-100 text-brand-500' :
                          item.type === 'credits' ? 'bg-amber-100 text-amber-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {item.type === 'plan' ? <Sparkles className="w-5 h-5" /> :
                           item.type === 'credits' ? <Star className="w-5 h-5" /> :
                           <ImageIcon className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500">{item.description}</p>
                          
                          {/* Controles de cantidad (solo para créditos) */}
                          {item.type === 'credits' && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-600 mt-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-bold text-gray-900">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Botón de Pago */}
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Continuar al Pago
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-3">
                    Serás redirigido a la pasarela de pago segura
                  </p>
                </>
              )}

              {/* Promo si no tiene items */}
              {!hasItems && (
                <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded-lg">
                  <div className="flex items-center gap-2 text-brand-700">
                    <Gift className="w-4 h-4" />
                    <span className="text-sm font-semibold">🎉 Promoción Activa</span>
                  </div>
                  <p className="text-xs text-brand-600 mt-1">
                    Reclamá 3 créditos GRATIS desde "Mis Avisos"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
