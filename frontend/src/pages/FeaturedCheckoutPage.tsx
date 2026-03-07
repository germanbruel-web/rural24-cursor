import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Tag,
  X,
} from 'lucide-react';
import {
  getTierConfig,
  getFeaturedSlotAvailability,
  createMPPreference,
  validateCouponForCheckout,
  activateFeaturedWithCoupon,
  formatARS,
  type TierOption,
  type SlotAvailability,
  type CouponCheckoutValidation,
} from '../services/walletService';

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
  badge?: string;
  placements: string;
}> = {
  baja:  { gradient: 'from-brand-400 to-brand-500', placements: 'Detalle de aviso' },
  media: { gradient: 'from-brand-500 to-brand-600', placements: 'Resultados · Detalle' },
  alta:  { gradient: 'from-brand-600 to-brand-700', badge: 'Más visible', placements: 'Homepage · Resultados · Detalle' },
};

// Cada página es una card clickeable que activa el tier correspondiente
const PAGES = [
  { key: 'detalle',    label: 'Detalle',    image: '/images/DDetalle.svg',    tier: 'baja'  as const },
  { key: 'resultados', label: 'Resultados', image: '/images/DResultados.svg', tier: 'media' as const },
  { key: 'home',       label: 'Homepage',   image: '/images/Dhome.svg',       tier: 'alta'  as const },
] as const;

// Cascading: al seleccionar un tier, estas páginas quedan "activas"
const TIER_PAGES: Record<string, readonly string[]> = {
  baja:  ['detalle'],
  media: ['resultados', 'detalle'],
  alta:  ['home', 'resultados', 'detalle'],
};

// ============================================================
// COMPONENT
// ============================================================

export default function FeaturedCheckoutPage() {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [tiers, setTiers]               = useState<TierOption[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedTier, setSelectedTier] = useState<TierOption | null>(null);
  const [periods, setPeriods]           = useState<1 | 2>(1);
  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [mpLoading, setMpLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  // Coupon state
  const [couponInput, setCouponInput]         = useState('');
  const [couponLoading, setCouponLoading]     = useState(false);
  const [couponResult, setCouponResult]       = useState<CouponCheckoutValidation | null>(null);
  const couponDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const tiersData = await getTierConfig();
      setTiers(tiersData);

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
    // Re-validate coupon for new tier if one is already entered
    if (couponInput.trim().length >= 2 && tier) {
      void validateCoupon(couponInput, tier.tier, tier.price_ars * periods);
    } else {
      setCouponResult(null);
    }
    if (checkoutData) void loadAvailability(checkoutData, tier);
  };

  // ──────────────────────────────────────────────
  // Coupon handlers
  // ──────────────────────────────────────────────
  const validateCoupon = async (code: string, tier: string, basePrice: number) => {
    if (!code.trim() || code.trim().length < 2) {
      setCouponResult(null);
      return;
    }
    setCouponLoading(true);
    setCouponResult(null);
    try {
      const result = await validateCouponForCheckout(code.trim(), tier, basePrice);
      setCouponResult(result);
    } catch {
      setCouponResult({ valid: false, error: 'Error al validar el cupón' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCouponChange = (value: string) => {
    setCouponInput(value);
    setCouponResult(null);
    if (couponDebounceRef.current) clearTimeout(couponDebounceRef.current);
    if (!value.trim() || !selectedTier) return;
    couponDebounceRef.current = setTimeout(() => {
      void validateCoupon(value, selectedTier.tier, selectedTier.price_ars * periods);
    }, 600);
  };

  const clearCoupon = () => {
    setCouponInput('');
    setCouponResult(null);
    if (couponDebounceRef.current) clearTimeout(couponDebounceRef.current);
  };

  // ──────────────────────────────────────────────
  // Derived state
  // ──────────────────────────────────────────────
  const hasCategoryData = Boolean(checkoutData?.category_id && checkoutData?.subcategory_id);
  const basePrice       = selectedTier ? selectedTier.price_ars * periods : 0;
  const effectivePrice  = couponResult?.valid && couponResult.effective_price !== undefined
    ? couponResult.effective_price * periods  // effective_price is per period from RPC
    : basePrice;
  const durationDays    = periods * 15;
  const canPurchase     = availability?.can_purchase !== false;
  const isFreeActivation = couponResult?.valid && couponResult.discount_type === 'full';
  const hasPartialDiscount = couponResult?.valid && couponResult.discount_type === 'percentage';

  // ──────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────

  // Free coupon activation (discount_type='full') — no MP
  const handleFreeActivation = async () => {
    if (!selectedTier || !checkoutData || !couponResult?.valid) return;
    if (!hasCategoryData) { setError('El aviso necesita categoría y subcategoría'); return; }

    setSubmitting(true);
    setError(null);
    const result = await activateFeaturedWithCoupon(
      checkoutData.ad_id,
      selectedTier.tier,
      couponInput.trim(),
    );
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

  // MP payment (with or without partial coupon)
  const handleMercadoPago = async () => {
    if (!selectedTier || !checkoutData) return;
    setMpLoading(true);
    setError(null);

    const couponCode = couponResult?.valid ? couponInput.trim() : undefined;
    const result = await createMPPreference(checkoutData.ad_id, selectedTier.tier, periods, couponCode);
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

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Alerta sin categoría */}
        {!hasCategoryData && (
          <div className="flex items-start gap-2 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Este aviso no tiene categoría y subcategoría asignadas. Editá el aviso antes de destacarlo.
          </div>
        )}

        {/* Page image selector */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Elegí tu nivel de visibilidad</p>
          <div className="grid grid-cols-3 gap-3 md:gap-5">
            {PAGES.map(({ key, label, image, tier: pageTier }) => {
              const tier = tiers.find(t => t.tier === pageTier);
              if (!tier) return null;
              const isIncluded = selectedTier ? (TIER_PAGES[selectedTier.tier]?.includes(key) ?? false) : false;
              const isPrimary  = selectedTier?.tier === pageTier;

              return (
                <button
                  key={key}
                  onClick={() => handleTierSelect(tier)}
                  disabled={!hasCategoryData}
                  className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-all bg-white ${
                    isPrimary
                      ? 'border-brand-600 shadow-lg'
                      : isIncluded
                        ? 'border-brand-300 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${!hasCategoryData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Header — radio indicator + estado */}
                  <div className={`px-3 py-2 flex items-center gap-2 ${
                    isPrimary  ? 'bg-brand-600' :
                    isIncluded ? 'bg-brand-50'  :
                                 'bg-gray-50'
                  }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      isPrimary  ? 'border-white'     :
                      isIncluded ? 'border-brand-400' :
                                   'border-gray-300'
                    }`}>
                      {isPrimary && <div className="w-2 h-2 rounded-full bg-white" />}
                      {isIncluded && !isPrimary && <div className="w-2 h-2 rounded-full bg-brand-400" />}
                    </div>
                    <span className={`text-xs font-medium truncate ${
                      isPrimary  ? 'text-white'     :
                      isIncluded ? 'text-brand-600' :
                                   'text-gray-400'
                    }`}>
                      {isPrimary ? 'Seleccionado' : isIncluded ? 'Incluido' : label}
                    </span>
                  </div>

                  {/* Content — SVG mockup full-bleed, altura fija */}
                  <div className={`transition-all duration-200 ${isIncluded ? '' : 'opacity-40 grayscale'}`}>
                    <img
                      src={image}
                      alt={label}
                      className="w-full h-[250px] md:h-[400px] object-cover object-top block"
                      draggable={false}
                    />
                  </div>

                  {/* Footer — nombre de página + checkmark */}
                  <div className={`px-3 py-2.5 flex items-center justify-between border-t ${
                    isPrimary  ? 'border-brand-200 bg-brand-50'    :
                    isIncluded ? 'border-brand-100 bg-brand-50/30' :
                                 'border-gray-100 bg-white'
                  }`}>
                    <span className={`text-sm font-semibold ${
                      isPrimary  ? 'text-brand-700' :
                      isIncluded ? 'text-brand-500' :
                                   'text-gray-400'
                    }`}>{label}</span>
                    {isIncluded && (
                      <CheckCircle2
                        className={`w-5 h-5 flex-shrink-0 ${isPrimary ? 'text-brand-600' : 'text-brand-400'}`}
                        strokeWidth={2}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic tier summary banner */}
          {selectedTier && (() => {
            const design = TIER_DESIGN[selectedTier.tier];
            return (
              <div className={`mt-3 flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r ${design.gradient}`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/70 text-[10px] font-semibold uppercase tracking-widest">Visibilidad</span>
                  <span className="text-white font-bold text-base leading-tight">{selectedTier.label}</span>
                  <span className="text-white/80 text-xs">{design.placements}</span>
                </div>
                <div className="text-right flex flex-col items-end gap-0.5">
                  {design.badge && (
                    <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">
                      {design.badge}
                    </span>
                  )}
                  <span className="text-white font-black text-xl tabular-nums">{formatARS(selectedTier.price_ars)}</span>
                  <span className="text-white/70 text-xs">ARS · 15 días</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Period selector + coupon + checkout */}
        {selectedTier && (
          <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm space-y-4">

            {/* Duration toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Duración:</span>
              <div className="flex gap-2">
                {([1, 2] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriods(p);
                      // Re-validate coupon with new periods
                      if (couponInput.trim() && selectedTier) {
                        void validateCoupon(couponInput, selectedTier.tier, selectedTier.price_ars * p);
                      }
                    }}
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

            {/* Slot availability */}
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

            {/* Coupon input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Cupón de descuento (opcional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => handleCouponChange(e.target.value.toUpperCase())}
                  placeholder="Ej: RURAL50"
                  maxLength={50}
                  className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 transition-colors ${
                    couponResult?.valid
                      ? 'border-green-400 bg-green-50 focus:ring-green-300'
                      : couponResult && !couponResult.valid
                        ? 'border-red-300 bg-red-50 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-brand-200'
                  }`}
                />
                {couponLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
                {!couponLoading && couponInput && (
                  <button
                    onClick={clearCoupon}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Coupon feedback */}
              {couponResult?.valid && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {couponResult.coupon_name ?? couponInput.toUpperCase()}
                    {couponResult.discount_type === 'full'
                      ? ' — ¡Gratis!'
                      : ` — ${couponResult.discount_percent}% OFF → ${formatARS(couponResult.effective_price ?? 0)} ARS/período`}
                  </span>
                </div>
              )}
              {couponResult && !couponResult.valid && couponResult.error && (
                <p className="text-xs text-red-600 pl-1">{couponResult.error}</p>
              )}
            </div>

            {/* Price summary */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              {hasPartialDiscount && couponResult && (
                <div className="flex items-center justify-between text-gray-400">
                  <span>Precio base ({durationDays} días)</span>
                  <span className="line-through">{formatARS(basePrice)} ARS</span>
                </div>
              )}
              <div className="flex items-center justify-between font-semibold text-gray-800">
                <span>
                  {isFreeActivation
                    ? 'Total con cupón'
                    : hasPartialDiscount
                      ? `Total con ${couponResult?.discount_percent}% OFF`
                      : `${selectedTier.label} × ${periods} período${periods > 1 ? 's' : ''} (${durationDays} días)`}
                </span>
                <span className={isFreeActivation ? 'text-green-600 font-black' : 'text-gray-900'}>
                  {isFreeActivation ? 'GRATIS' : `${formatARS(effectivePrice)} ARS`}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            {/* CTA */}
            {isFreeActivation ? (
              /* Free activation via coupon */
              <button
                onClick={handleFreeActivation}
                disabled={submitting || !hasCategoryData || !canPurchase}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 py-3.5 rounded-xl font-semibold transition-colors"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Activando...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" />
                  Activar gratis {durationDays} días con cupón</>
                )}
              </button>
            ) : (
              /* MP payment (with or without partial coupon) */
              <button
                onClick={handleMercadoPago}
                disabled={mpLoading || !hasCategoryData || !canPurchase}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#009EE3] hover:bg-[#007EB8] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 rounded-xl font-semibold transition-colors"
              >
                {mpLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a MercadoPago...</>
                ) : (
                  <><CreditCard className="w-4 h-4" />
                  Pagar {formatARS(effectivePrice)} ARS con MercadoPago</>
                )}
              </button>
            )}

            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              {durationDays} días de visibilidad destacada
            </p>
          </div>
          </div>
        )}

      </div>
    </div>
  );
}
