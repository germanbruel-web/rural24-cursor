import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  Loader2,
  Star,
  X,
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
} from '../../services/walletService';
import { supabase } from '../../services/supabaseClient';

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

const TIER_ICONS: Record<string, React.ReactNode> = {
  alta:  <Zap  className="w-4 h-4 flex-shrink-0" />,
  media: <Star className="w-4 h-4 flex-shrink-0" />,
  baja:  <div className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" />,
};

const PLACEMENT_LABELS: Record<string, string> = {
  homepage: 'Homepage',
  results:  'Resultados',
  detail:   'Detalle',
};

export default function FeaturedAdModal({ isOpen, onClose, ad, onSuccess }: FeaturedAdModalProps) {
  const [tiers,      setTiers]      = useState<TierOption[]>([]);
  const [balance,    setBalance]    = useState<number>(0);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);

  const [selectedTier,  setSelectedTier]  = useState<TierOption | null>(null);
  const [periods,       setPeriods]       = useState<1 | 2>(1);
  const [availability,  setAvailability]  = useState<SlotAvailability | null>(null);
  const [availLoading,  setAvailLoading]  = useState(false);
  const [mpLoading,     setMpLoading]     = useState(false);

  const hasCategoryData  = Boolean(ad.category_id && ad.subcategory_id);
  const totalCost        = selectedTier ? selectedTier.price_ars * periods : 0;
  const balanceAfter     = balance - totalCost;
  const hasEnoughBalance = balance >= totalCost;
  const canPurchase      = availability?.can_purchase !== false;
  const durationDays     = periods * 15;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTier(null);
    setPeriods(1);
    setAvailability(null);
    setError(null);
    setSuccess(false);
    void boot();
  }, [isOpen]);

  const boot = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const [tiersData, walletData] = await Promise.all([
        getTierConfig(),
        user ? getWalletBalance(user.id) : Promise.resolve(null),
      ]);
      setTiers(tiersData);
      setBalance(walletData?.virtual_balance ?? 0);
    } catch {
      setError('No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleTierSelect = async (tier: TierOption) => {
    setSelectedTier(tier);
    setError(null);
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

  const handleMercadoPago = async () => {
    if (!selectedTier || !hasCategoryData) return;
    setMpLoading(true);
    setError(null);

    const result = await createMPPreference(ad.id, selectedTier.tier, periods);

    if ('error' in result) {
      setError(result.error);
      setMpLoading(false);
      return;
    }

    sessionStorage.setItem('mp_payment_id', result.payment_id);

    const isMobileDevice = window.innerWidth < 768;

    if (isMobileDevice) {
      // Mobile: redirect directo (App.tsx detecta el callback al volver)
      window.location.href = result.init_point;
    } else {
      // Desktop: popup centrado — App.tsx recibe el resultado via postMessage
      const W = 800, H = 650;
      const left = Math.round((window.screen.width  - W) / 2);
      const top  = Math.round((window.screen.height - H) / 2);
      window.open(
        result.init_point,
        'mp_checkout',
        `width=${W},height=${H},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      // Cerrar el modal: App.tsx muestra PaymentResultPage cuando llegue el postMessage
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!selectedTier)    { setError('Elegí un nivel de visibilidad'); return; }
    if (!hasCategoryData) { setError('El aviso necesita categoría y subcategoría'); return; }
    if (!hasEnoughBalance){ setError('Saldo insuficiente'); return; }

    setSubmitting(true);
    setError(null);

    const result = await activateFeaturedByTier(ad.id, selectedTier.tier, periods);

    if (!result.success) {
      setError(result.error ?? 'No se pudo activar el destacado');
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    onSuccess?.();
    setTimeout(() => onClose(), 1800);
  };

  if (!isOpen) return null;

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

        <div className="p-5 space-y-4">

          {/* Saldo */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
            </div>
          ) : (
            <div className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-brand-800">Saldo disponible</span>
              <span className={`text-lg font-bold ${balance > 0 ? 'text-brand-700' : 'text-red-600'}`}>
                {formatARS(balance)} ARS
              </span>
            </div>
          )}

          {/* Alerta categoría faltante */}
          {!hasCategoryData && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              El aviso necesita categoría y subcategoría para destacarse.
            </div>
          )}

          {/* Tiers */}
          {!loading && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Elegí tu nivel de visibilidad</p>
              {tiers.map((tier) => {
                const isSelected = selectedTier?.tier === tier.tier;
                const affordable = balance >= tier.price_ars;
                return (
                  <button
                    key={tier.tier}
                    onClick={() => handleTierSelect(tier)}
                    disabled={!affordable}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50'
                        : affordable
                        ? 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={isSelected ? 'text-brand-600' : 'text-gray-400'}>
                          {TIER_ICONS[tier.tier]}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isSelected ? 'text-brand-700' : 'text-gray-800'}`}>
                              {tier.label}
                            </span>
                            {tier.tier === 'alta' && (
                              <span className="px-1.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-full leading-none">
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
                        <p className={`text-sm font-bold tabular-nums ${isSelected ? 'text-brand-700' : 'text-gray-500'}`}>
                          {formatARS(tier.price_ars)}
                        </p>
                        <p className="text-xs text-gray-400">ARS · 15 días</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selector de períodos */}
          {selectedTier && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Períodos:</span>
              <div className="flex gap-2">
                {([1, 2] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriods(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
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
          )}

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

          {/* Saldo insuficiente → opción MercadoPago */}
          {selectedTier && !hasEnoughBalance && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-200">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Saldo insuficiente para este nivel. Podés pagar con MercadoPago o canjear un cupón desde Mi Cuenta.
                </span>
              </div>
              <button
                onClick={handleMercadoPago}
                disabled={mpLoading || !hasCategoryData}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#009EE3] hover:bg-[#007EB8] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 rounded-xl font-semibold text-sm transition-colors"
              >
                {mpLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {mpLoading
                  ? 'Redirigiendo a MercadoPago...'
                  : `Pagar ${formatARS(totalCost)} con MercadoPago`}
              </button>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-xl p-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> ¡Aviso destacado correctamente!
            </div>
          )}

          {/* Resumen + CTA */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            {selectedTier && (
              <div className="space-y-1.5 text-sm">
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
            )}

            <button
              onClick={handleConfirm}
              disabled={submitting || !selectedTier || !hasEnoughBalance || !hasCategoryData || !canPurchase}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 py-3 rounded-xl font-semibold transition-colors"
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Activando...
                </span>
              ) : selectedTier ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Destacar {durationDays} días por {formatARS(totalCost)} ARS
                </span>
              ) : (
                'Elegí un nivel de visibilidad'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
