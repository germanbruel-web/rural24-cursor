import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Star,
  Zap,
} from 'lucide-react';
import {
  getWalletBalance,
  getTierConfig,
  getFeaturedSlotAvailability,
  activateFeaturedByTier,
  createMPPreference,
  formatARS,
  type TierOption,
  type SlotAvailability,
} from '../services/walletService';
import { supabase } from '../services/supabaseClient';

// ============================================================
// TYPES
// ============================================================

interface CheckoutData {
  ad_id: string;
  title: string;
  category_id: string;
  subcategory_id: string;
  images?: string[];
  preselected_tier?: 'alta' | 'media' | 'baja';
}

// ============================================================
// TIER CARD DESIGN CONFIG
// ============================================================

const TIER_DESIGN: Record<string, {
  gradient: string;
  headerText: string;
  icon: React.ReactNode;
  badge?: string;
  description: string;
  placements: string;
}> = {
  baja: {
    gradient: 'from-slate-500 to-slate-600',
    headerText: 'text-white',
    icon: <div className="w-8 h-8 rounded-full border-2 border-white/80" />,
    description: 'Tu aviso aparece destacado en la página de detalle de aviso.',
    placements: 'Detalle de aviso',
  },
  media: {
    gradient: 'from-blue-500 to-blue-600',
    headerText: 'text-white',
    icon: <Star className="w-8 h-8" />,
    description: 'Tu aviso aparece en la homepage y en los resultados de búsqueda.',
    placements: 'Homepage · Resultados',
  },
  alta: {
    gradient: 'from-brand-600 to-brand-700',
    headerText: 'text-white',
    icon: <Zap className="w-8 h-8" />,
    badge: 'Más visible',
    description: 'Máxima exposición: homepage, resultados de búsqueda y detalle de aviso.',
    placements: 'Homepage · Resultados · Detalle',
  },
};

const TIER_ORDER: Array<'baja' | 'media' | 'alta'> = ['baja', 'media', 'alta'];

// ============================================================
// COMPONENT
// ============================================================

export default function FeaturedCheckoutPage() {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [tiers, setTiers]           = useState<TierOption[]>([]);
  const [balance, setBalance]       = useState<number>(0);
  const [loading, setLoading]       = useState(true);
  const [selectedTier, setSelectedTier]   = useState<TierOption | null>(null);
  const [periods, setPeriods]             = useState<1 | 2>(1);
  const [availability, setAvailability]   = useState<SlotAvailability | null>(null);
  const [availLoading, setAvailLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mpLoading, setMpLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  // ──────────────────────────────────────────────
  // Init: parse sessionStorage
  // ──────────────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('featured_checkout_data');
    if (!raw) { goBack(); return; }
    try {
      const data: CheckoutData = JSON.parse(raw);
      if (!data.ad_id || !data.title) { goBack(); return; }
      setCheckoutData(data);
      void boot(data);
    } catch {
      goBack();
    }
  }, []);

  const goBack = () => { window.location.hash = '#/my-ads'; };

  const boot = async (data: CheckoutData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const [tiersData, walletData] = await Promise.all([
        getTierConfig(),
        user ? getWalletBalance(user.id) : Promise.resolve(null),
      ]);
      setTiers(tiersData);
      setBalance(walletData?.virtual_balance ?? 0);

      // Pre-select tier if provided
      if (data.preselected_tier) {
        const preselected = tiersData.find(t => t.tier === data.preselected_tier);
        if (preselected) {
          setSelectedTier(preselected);
          void loadAvailability(data, preselected);
        }
      }
    } catch {
      setError('No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (data: CheckoutData, tier: TierOption) => {
    if (!data.category_id || !data.subcategory_id) return;
    setAvailLoading(true);
    try {
      const avail = await getFeaturedSlotAvailability(data.ad_id, tier.tier);
      setAvailability(avail);
    } finally {
      setAvailLoading(false);
    }
  };

  const handleTierSelect = (tier: TierOption) => {
    setSelectedTier(tier);
    setAvailability(null);
    setError(null);
    if (checkoutData) void loadAvailability(checkoutData, tier);
  };

  // ──────────────────────────────────────────────
  // Derived state
  // ──────────────────────────────────────────────
  const hasCategoryData = Boolean(checkoutData?.category_id && checkoutData?.subcategory_id);
  const totalCost       = selectedTier ? selectedTier.price_ars * periods : 0;
  const balanceAfter    = balance - totalCost;
  const hasEnoughBalance = balance >= totalCost;
  const canPurchase     = availability?.can_purchase !== false;
  const durationDays    = periods * 15;

  // ──────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedTier || !checkoutData) return;
    if (!hasCategoryData) { setError('El aviso necesita categoría y subcategoría'); return; }
    if (!hasEnoughBalance) { setError('Saldo insuficiente'); return; }

    setSubmitting(true);
    setError(null);
    const result = await activateFeaturedByTier(checkoutData.ad_id, selectedTier.tier, periods);
    if (!result.success) {
      setError(result.error ?? 'No se pudo activar el destacado');
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    setSubmitting(false);
    sessionStorage.removeItem('featured_checkout_data');
    setTimeout(() => { window.location.hash = '#/my-ads'; }, 2000);
  };

  const handleMercadoPago = async () => {
    if (!selectedTier || !checkoutData) return;
    setMpLoading(true);
    setError(null);

    const result = await createMPPreference(checkoutData.ad_id, selectedTier.tier, periods);
    if ('error' in result) {
      setError(result.error);
      setMpLoading(false);
      return;
    }

    sessionStorage.setItem('mp_payment_id', result.payment_id);

    const isMobileDevice = window.innerWidth < 768;
    if (isMobileDevice) {
      window.location.href = result.init_point;
    } else {
      const W = 800, H = 650;
      const left = Math.round((window.screen.width  - W) / 2);
      const top  = Math.round((window.screen.height - H) / 2);
      window.open(
        result.init_point,
        'mp_checkout',
        `width=${W},height=${H},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    }
  };

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-10 max-w-sm w-full text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">¡Aviso destacado!</h2>
          <p className="text-sm text-gray-600">
            Tu aviso será visible como destacado en los próximos minutos.
          </p>
          <p className="text-xs text-gray-400">Redirigiendo a Mis Avisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Destacar aviso</h1>
            {checkoutData && (
              <p className="text-sm text-gray-500 truncate max-w-xs">{checkoutData.title}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Saldo */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
          <span className="text-sm font-medium text-gray-700">Saldo disponible</span>
          <span className={`text-lg font-bold ${balance > 0 ? 'text-brand-700' : 'text-red-600'}`}>
            {formatARS(balance)} ARS
          </span>
        </div>

        {/* Alerta sin categoría */}
        {!hasCategoryData && (
          <div className="flex items-start gap-2 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Este aviso no tiene categoría y subcategoría asignadas. Editá el aviso antes de destacarlo.
          </div>
        )}

        {/* Tier cards — 3 columns */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Elegí tu nivel de visibilidad</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TIER_ORDER.map((tierKey) => {
              const tier = tiers.find(t => t.tier === tierKey);
              if (!tier) return null;
              const design = TIER_DESIGN[tierKey];
              const isSelected = selectedTier?.tier === tierKey;
              const affordable = balance >= tier.price_ars;

              return (
                <button
                  key={tierKey}
                  onClick={() => handleTierSelect(tier)}
                  disabled={!hasCategoryData}
                  className={`relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all text-left ${
                    isSelected
                      ? 'border-brand-600 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-brand-300 hover:shadow-md'
                  } ${!hasCategoryData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${design.gradient} px-4 py-5 flex flex-col items-center text-center gap-2`}>
                    {design.badge && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">
                        {design.badge}
                      </span>
                    )}
                    <span className="text-white">{design.icon}</span>
                    <span className="text-white font-bold text-base">{tier.label}</span>
                    <span className="text-white/80 text-xs">{design.placements}</span>
                  </div>

                  {/* Body */}
                  <div className="bg-white px-4 py-4 flex flex-col gap-3 flex-1">
                    <p className="text-xs text-gray-600 leading-relaxed">{design.description}</p>

                    <div className="mt-auto pt-2 border-t border-gray-100">
                      <p className={`text-lg font-black tabular-nums ${affordable ? 'text-gray-900' : 'text-gray-400'}`}>
                        {formatARS(tier.price_ars)}
                      </p>
                      <p className="text-xs text-gray-400">ARS · 15 días</p>
                      {!affordable && (
                        <p className="text-[11px] text-amber-600 mt-1 font-medium">Saldo insuficiente</p>
                      )}
                    </div>
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                      <div className="w-3 h-3 bg-brand-600 rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Period selector */}
        {selectedTier && (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Duración:</span>
              <div className="flex gap-2">
                {([1, 2] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriods(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      periods === p
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-brand-300'
                    }`}
                  >
                    {p === 1 ? '15 días' : '30 días'}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            {availLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Verificando disponibilidad...
              </div>
            )}
            {!availLoading && availability && (
              <div className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${
                availability.available_now
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {availability.available_now ? (
                  <><CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Slot disponible — se activa en los próximos minutos.</span></>
                ) : (
                  <><Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Sin slot libre ahora. Tu aviso entra en cola y se activa en ~{availability.next_available_days ?? 1} día(s).</span></>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>{selectedTier.label} × {periods} período{periods > 1 ? 's' : ''} ({durationDays} días)</span>
                <span className="font-semibold">{formatARS(totalCost)} ARS</span>
              </div>
              {hasEnoughBalance && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>Saldo después</span>
                  <span className="font-semibold text-brand-700">{formatARS(balanceAfter)} ARS</span>
                </div>
              )}
            </div>

            {/* Insufficient balance warning + MP */}
            {!hasEnoughBalance && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-200">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Saldo insuficiente. Podés pagar con MercadoPago o canjear un cupón desde Mi Cuenta.
                  </span>
                </div>
                <button
                  onClick={handleMercadoPago}
                  disabled={mpLoading || !hasCategoryData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#009EE3] hover:bg-[#007EB8] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 rounded-xl font-semibold text-sm transition-colors"
                >
                  {mpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {mpLoading ? 'Redirigiendo a MercadoPago...' : `Pagar ${formatARS(totalCost)} con MercadoPago`}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Primary CTA */}
            <button
              onClick={handleConfirm}
              disabled={submitting || !hasEnoughBalance || !hasCategoryData || !canPurchase}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 py-3.5 rounded-xl font-semibold transition-colors"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Activando...</>
              ) : (
                <><Calendar className="w-4 h-4" />
                Destacar {durationDays} días por {formatARS(totalCost)} ARS</>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
