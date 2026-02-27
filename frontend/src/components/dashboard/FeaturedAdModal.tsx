import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Ticket,
  X,
  Zap,
} from 'lucide-react';
import {
  createUserFeaturedAd,
  getFeaturedSettings,
  getUserCredits,
  type FeaturedPlacement,
} from '../../services/userFeaturedService';
import { redeemCoupon } from '../../services/creditsService';

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

const PLACEMENT_OPTIONS: { value: FeaturedPlacement; label: string; description: string; defaultCost: number }[] = [
  { value: 'homepage', label: 'PREMIUM',   description: 'Inicio + resultados + detalle del aviso', defaultCost: 6 },
  { value: 'results',  label: 'ESTÁNDAR',  description: 'Resultados + detalle del aviso',          defaultCost: 2 },
  { value: 'detail',   label: 'BÁSICO',    description: 'Solo en el detalle del aviso',             defaultCost: 1 },
];

export default function FeaturedAdModal({ isOpen, onClose, ad, onSuccess }: FeaturedAdModalProps) {
  const [selectedPlacement, setSelectedPlacement] = useState<FeaturedPlacement | null>(null);
  const [costs, setCosts] = useState<Record<FeaturedPlacement, number>>({ homepage: 6, results: 2, detail: 1 });
  const [durationDays, setDurationDays] = useState<number>(15);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  const hasCategoryData = Boolean(ad.category_id && ad.subcategory_id);
  const totalCost = selectedPlacement ? costs[selectedPlacement] : 0;
  const balanceAfter = balance - totalCost;
  const hasEnoughBalance = selectedPlacement ? balance >= costs[selectedPlacement] : false;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPlacement(null);
    setError(null);
    setSuccessText(null);
    setCouponCode('');
    setCouponOpen(false);
    void boot();
  }, [isOpen]);

  const boot = async () => {
    setLoading(true);
    try {
      const [creditsResp, settings] = await Promise.all([
        getUserCredits(),
        getFeaturedSettings(),
      ]);
      setBalance(creditsResp.data?.credits_available ?? 0);
      setDurationDays(settings.durationDays || 15);
      setCosts({ homepage: 6, results: 2, detail: 1 });
    } catch {
      setError('No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Ingresá un código de cupón');
      return;
    }
    setCouponLoading(true);
    setError(null);
    setSuccessText(null);
    const result = await redeemCoupon(couponCode.trim());
    if (result.success) {
      const creditsResp = await getUserCredits();
      setBalance(creditsResp.data?.credits_available ?? balance);
      setCouponCode('');
      setCouponOpen(false);
      setSuccessText('Cupón aplicado. Tu saldo fue actualizado.');
    } else {
      setError(result.error || 'No se pudo canjear el cupón');
    }
    setCouponLoading(false);
  };

  const handleConfirm = async () => {
    if (!selectedPlacement) {
      setError('Elegí dónde querés que aparezca el aviso');
      return;
    }
    if (!hasCategoryData) {
      setError('El aviso debe tener categoría y subcategoría para destacarse');
      return;
    }
    if (!hasEnoughBalance) {
      setError('Saldo insuficiente para esta selección');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessText(null);
    const today = new Date().toISOString().split('T')[0];
    const { data, error: createError } = await createUserFeaturedAd(ad.id, selectedPlacement, today);
    if (createError || !data?.success) {
      setError(data?.error_message || createError?.message || 'No se pudo activar el destacado');
      setSubmitting(false);
      return;
    }
    const creditsResp = await getUserCredits();
    setBalance(creditsResp.data?.credits_available ?? balance);
    setSubmitting(false);
    setSuccessText('¡Aviso destacado correctamente!');
    onSuccess?.();
    onClose();
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
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0 ml-3"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Saldo disponible */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando saldo...
            </div>
          ) : (
            <div className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-brand-800">Saldo disponible</span>
              <span className="text-lg font-bold text-brand-700">{balance} ARS</span>
            </div>
          )}

          {/* Alerta categoría faltante */}
          {!hasCategoryData && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              El aviso necesita categoría y subcategoría para poder destacarse.
            </div>
          )}

          {/* Opciones de placement */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">¿Dónde querés que aparezca?</p>
            {PLACEMENT_OPTIONS.map((option) => {
              const cost = costs[option.value];
              const selected = selectedPlacement === option.value;
              const canAfford = balance >= cost;
              return (
                <button
                  key={option.value}
                  onClick={() => { setSelectedPlacement(option.value); setError(null); }}
                  disabled={!canAfford}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selected
                      ? 'border-brand-600 bg-brand-50'
                      : canAfford
                      ? 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                      : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? 'border-brand-600 bg-brand-600' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm font-bold ${selected ? 'text-brand-700' : 'text-gray-800'}`}>
                        {option.label}
                      </span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${selected ? 'text-brand-700' : 'text-gray-500'}`}>
                      {cost} ARS
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6.5 pl-0.5">
                    {option.description} · {durationDays} días
                  </p>
                </button>
              );
            })}
          </div>

          {/* Cupón — colapsado por defecto */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setCouponOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                ¿Tenés un cupón?
              </span>
              {couponOpen
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />}
            </button>
            {couponOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="CÓDIGO"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="px-4 py-2 text-sm font-semibold border border-brand-700 text-brand-700 rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? 'Aplicando...' : 'Aplicar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
          {successText && (
            <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-xl p-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {successText}
            </div>
          )}

          {/* Resumen + CTA */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            {selectedPlacement && (
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Costo</span>
                  <span className="font-semibold">{totalCost} ARS</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Saldo después</span>
                  <span className={`font-semibold ${balanceAfter < 0 ? 'text-red-600' : 'text-brand-700'}`}>
                    {balanceAfter} ARS
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleConfirm}
              disabled={submitting || !selectedPlacement || !hasEnoughBalance || !hasCategoryData}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 py-3 rounded-xl font-semibold transition-colors"
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Activando...
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  {selectedPlacement ? `Destacar por ${durationDays} días` : 'Elegí una opción'}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
