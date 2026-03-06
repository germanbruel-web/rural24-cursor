/**
 * FeaturedAdModal — Sprint 3E
 * Flujo 2 pasos:
 *   Paso 1 → Selección de tier (BAJA / MEDIA / ALTA)
 *   Paso 2 → Checkout: cupón opcional + MercadoPago (o gratis si cupón full)
 */

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Tag,
  X,
  Zap,
  Star,
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
} from '../../services/walletService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FeaturedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: {
    id: string;
    title: string;
    category_id?: string;
    subcategory_id?: string;
    category_name?: string;
    images?: any[];
  };
  onSuccess?: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIER_ICONS: Record<string, React.ReactNode> = {
  alta:  <Zap  className="w-5 h-5 flex-shrink-0" />,
  media: <Star className="w-5 h-5 flex-shrink-0" />,
  baja:  <div className="w-5 h-5 rounded-full border-2 border-current flex-shrink-0" />,
};

const PLACEMENT_LABELS: Record<string, string> = {
  homepage: 'Homepage',
  results:  'Resultados',
  detail:   'Detalle',
};

const TIER_COLORS: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
  alta:  { border: 'border-amber-400',  bg: 'bg-amber-50',  icon: 'text-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  media: { border: 'border-brand-400',  bg: 'bg-brand-50',  icon: 'text-brand-500',  badge: '' },
  baja:  { border: 'border-gray-300',   bg: 'bg-gray-50',   icon: 'text-gray-400',   badge: '' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeaturedAdModal({ isOpen, onClose, ad, onSuccess }: FeaturedAdModalProps) {
  // ── Estado de navegación ──────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── Paso 1: tiers ─────────────────────────────────────────────────────────
  const [tiers,        setTiers]        = useState<TierOption[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierOption | null>(null);
  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const [availLoading, setAvailLoading] = useState(false);

  // ── Paso 2: checkout / cupón ──────────────────────────────────────────────
  const [couponCode,      setCouponCode]      = useState('');
  const [couponResult,    setCouponResult]    = useState<CouponCheckoutValidation | null>(null);
  const [couponLoading,   setCouponLoading]   = useState(false);
  const [activating,      setActivating]      = useState(false);
  const [mpLoading,       setMpLoading]       = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [success,         setSuccess]         = useState(false);

  const couponInputRef = useRef<HTMLInputElement>(null);

  const hasCategoryData = Boolean(ad.category_id && ad.subcategory_id);

  // ── Precio efectivo a mostrar ──────────────────────────────────────────────
  const basePrice      = selectedTier?.price_ars ?? 0;
  const effectivePrice = couponResult?.valid ? (couponResult.effective_price ?? basePrice) : basePrice;
  const isFree         = effectivePrice === 0;

  // ── Reset al abrir ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedTier(null);
    setAvailability(null);
    setCouponCode('');
    setCouponResult(null);
    setError(null);
    setSuccess(false);
    void loadTiers();
  }, [isOpen]);

  // ── Cargar tiers ──────────────────────────────────────────────────────────
  const loadTiers = async () => {
    setLoadingTiers(true);
    try {
      const data = await getTierConfig();
      // Orden: ALTA → MEDIA → BAJA
      const order = ['alta', 'media', 'baja'];
      setTiers(data.sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier)));
    } catch {
      setError('No se pudo cargar la configuración de tiers.');
    } finally {
      setLoadingTiers(false);
    }
  };

  // ── Seleccionar tier + verificar disponibilidad ───────────────────────────
  const handleSelectTier = async (tier: TierOption) => {
    setSelectedTier(tier);
    setAvailability(null);
    if (!hasCategoryData || !ad.id) return;
    setAvailLoading(true);
    try {
      const avail = await getFeaturedSlotAvailability(ad.id, tier.tier);
      setAvailability(avail);
    } finally {
      setAvailLoading(false);
    }
  };

  // ── Continuar al paso 2 ───────────────────────────────────────────────────
  const handleContinue = () => {
    setError(null);
    setCouponCode('');
    setCouponResult(null);
    setStep(2);
    setTimeout(() => couponInputRef.current?.focus(), 100);
  };

  // ── Validar cupón ─────────────────────────────────────────────────────────
  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !selectedTier) return;
    setCouponLoading(true);
    setCouponResult(null);
    setError(null);
    try {
      const result = await validateCouponForCheckout(couponCode, selectedTier.tier, basePrice);
      setCouponResult(result);
      if (!result.valid) setError(result.error ?? 'Cupón inválido');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCouponKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleValidateCoupon();
  };

  const handleClearCoupon = () => {
    setCouponCode('');
    setCouponResult(null);
    setError(null);
    couponInputRef.current?.focus();
  };

  // ── Activar gratis con cupón ──────────────────────────────────────────────
  const handleActivateWithCoupon = async () => {
    if (!selectedTier || !couponResult?.valid) return;
    setActivating(true);
    setError(null);
    try {
      const result = await activateFeaturedWithCoupon(ad.id, selectedTier.tier, couponCode);
      if (!result.success) {
        setError(result.error ?? 'Error al activar el destacado');
        return;
      }
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1800);
    } finally {
      setActivating(false);
    }
  };

  // ── Pagar con MercadoPago ────────────────────────────────────────────────
  const handleMercadoPago = async () => {
    if (!selectedTier || !hasCategoryData) return;
    setMpLoading(true);
    setError(null);

    const couponToSend = couponResult?.valid ? couponCode : undefined;
    const result = await createMPPreference(ad.id, selectedTier.tier, 1, couponToSend);

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
      window.open(result.init_point, 'mp_checkout',
        `width=${W},height=${H},left=${left},top=${top},resizable=yes,scrollbars=yes`);
      onClose();
    }
  };

  if (!isOpen) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between bg-brand-700">
          <div className="flex items-center gap-3 min-w-0">
            <Zap className="w-5 h-5 text-white flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white leading-tight">Destacar aviso</h3>
              <p className="text-sm text-white/80 truncate">{ad.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0 ml-3">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Breadcrumb de pasos */}
        <div className="flex border-b border-gray-100">
          <div className={`flex-1 py-2.5 text-center text-xs font-semibold ${step === 1 ? 'text-brand-700 border-b-2 border-brand-600' : 'text-gray-400'}`}>
            1 · Elegí el nivel
          </div>
          <div className={`flex-1 py-2.5 text-center text-xs font-semibold ${step === 2 ? 'text-brand-700 border-b-2 border-brand-600' : 'text-gray-400'}`}>
            2 · Checkout
          </div>
        </div>

        <div className="p-5">

          {/* ── PASO 1: Selección de tier ───────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">

              {/* Sin categoría */}
              {!hasCategoryData && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  El aviso necesita categoría y subcategoría para poder destacarse.
                </div>
              )}

              {/* Loading tiers */}
              {loadingTiers && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando niveles...
                </div>
              )}

              {/* Cards de tier */}
              {!loadingTiers && tiers.map((tier) => {
                const isSelected = selectedTier?.tier === tier.tier;
                const colors     = TIER_COLORS[tier.tier];
                return (
                  <button
                    key={tier.tier}
                    onClick={() => handleSelectTier(tier)}
                    disabled={!hasCategoryData}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                      isSelected ? `${colors.border} ${colors.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${!hasCategoryData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={isSelected ? colors.icon : 'text-gray-300'}>
                          {TIER_ICONS[tier.tier]}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                              {tier.label}
                            </span>
                            {tier.tier === 'alta' && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none ${colors.badge}`}>
                                Más visible
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {tier.placements.map(p => PLACEMENT_LABELS[p] ?? p).join(' · ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold tabular-nums ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                          {formatARS(tier.price_ars)}
                        </p>
                        <p className="text-xs text-gray-400">· 15 días</p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Disponibilidad */}
              {selectedTier && availLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Verificando disponibilidad...
                </div>
              )}
              {selectedTier && !availLoading && availability && (
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

              {/* CTA continuar */}
              <div className="pt-2">
                <button
                  onClick={handleContinue}
                  disabled={!selectedTier || !hasCategoryData}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors bg-brand-600 hover:bg-brand-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 2: Checkout ─────────────────────────────────────────────── */}
          {step === 2 && selectedTier && (
            <div className="space-y-4">

              {/* Volver */}
              <button
                onClick={() => { setStep(1); setError(null); setCouponResult(null); setCouponCode(''); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors -ml-1"
              >
                <ArrowLeft className="w-4 h-4" /> Cambiar nivel
              </button>

              {/* Resumen del tier elegido */}
              {(() => {
                const colors = TIER_COLORS[selectedTier.tier];
                return (
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 ${colors.border} ${colors.bg}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={colors.icon}>{TIER_ICONS[selectedTier.tier]}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{selectedTier.label} — 15 días</p>
                        <p className="text-xs text-gray-500">
                          {selectedTier.placements.map(p => PLACEMENT_LABELS[p] ?? p).join(' · ')}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-700 tabular-nums">{formatARS(basePrice)}</p>
                  </div>
                );
              })()}

              {/* Input de cupón */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
                  Cupón de descuento (opcional)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      ref={couponInputRef}
                      type="text"
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setError(null); }}
                      onKeyDown={handleCouponKeyDown}
                      placeholder="Ej: RURAL24"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      maxLength={30}
                    />
                  </div>
                  {couponResult?.valid ? (
                    <button
                      onClick={handleClearCoupon}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleValidateCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-brand-300 text-brand-700 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                    </button>
                  )}
                </div>

                {/* Resultado del cupón */}
                {couponResult?.valid && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {couponResult.discount_type === 'full'
                        ? `Cupón "${couponResult.coupon_name}" — ¡Destacado GRATIS!`
                        : `Cupón "${couponResult.coupon_name}" — ${couponResult.discount_percent}% de descuento`
                      }
                    </span>
                  </div>
                )}
                {error && !success && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                  </p>
                )}
              </div>

              {/* Resumen de precio */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Precio base</span>
                  <span className={couponResult?.valid ? 'line-through' : 'font-semibold text-gray-700'}>
                    {formatARS(basePrice)}
                  </span>
                </div>
                {couponResult?.valid && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">
                      {couponResult.discount_type === 'full' ? 'Descuento (cupón total)' : `Descuento (${couponResult.discount_percent}%)`}
                    </span>
                    <span className="text-green-600 font-semibold">-{formatARS(basePrice - effectivePrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>{isFree ? <span className="text-green-600">GRATIS</span> : formatARS(effectivePrice)}</span>
                </div>
              </div>

              {/* Éxito */}
              {success && (
                <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> ¡Aviso destacado correctamente! Cerrando...
                </div>
              )}

              {/* CTA */}
              {!success && (
                isFree ? (
                  // Cupón 100% → activar gratis
                  <button
                    onClick={handleActivateWithCoupon}
                    disabled={activating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:cursor-not-allowed text-white disabled:text-gray-400 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {activating
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Activando...</>
                      : <><CheckCircle2 className="w-4 h-4" /> Activar destacado GRATIS</>
                    }
                  </button>
                ) : (
                  // Pago con MP (con o sin cupón parcial)
                  <button
                    onClick={handleMercadoPago}
                    disabled={mpLoading || !hasCategoryData}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#009EE3] hover:bg-[#007EB8] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {mpLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a MercadoPago...</>
                      : <><CreditCard className="w-4 h-4" /> Pagar {formatARS(effectivePrice)} con MercadoPago</>
                    }
                  </button>
                )
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
