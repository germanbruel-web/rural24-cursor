import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Loader2, Star, Ticket, X, Zap } from 'lucide-react';
import {
  createUserFeaturedAd,
  getFeaturedSettings,
  getUserCredits,
  type FeaturedPlacement,
} from '../../services/userFeaturedService';
import { getSettingBool } from '../../services/v2/globalSettingsService';
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

interface PlacementOption {
  value: FeaturedPlacement;
  label: string;
  description: string;
}

const PLACEMENT_OPTIONS: PlacementOption[] = [
  { value: 'homepage', label: 'ALTO', description: 'Inicio + resultados + detalle' },
  { value: 'results', label: 'MEDIO', description: 'Resultados + detalle' },
  { value: 'detail', label: 'BASICO', description: 'Solo en detalle' },
];

const DEFAULT_COSTS: Record<FeaturedPlacement, number> = {
  homepage: 6,
  results: 2,
  detail: 1,
};

export default function FeaturedAdModal({ isOpen, onClose, ad, onSuccess }: FeaturedAdModalProps) {
  const [selectedPlacements, setSelectedPlacements] = useState<FeaturedPlacement[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [costs, setCosts] = useState<Record<FeaturedPlacement, number>>(DEFAULT_COSTS);
  const [durationDays, setDurationDays] = useState<number>(15);
  const [virtualBalance, setVirtualBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const [paymentToggles, setPaymentToggles] = useState({
    featuredPaymentsEnabled: false,
    mercadoPagoEnabled: false,
  });

  const hasCategoryData = Boolean(ad.category_id && ad.subcategory_id);

  const totalCost = useMemo(
    () => selectedPlacements.reduce((sum, placement) => sum + costs[placement], 0),
    [selectedPlacements, costs]
  );
  const hasEnoughBalance = virtualBalance >= totalCost;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPlacements([]);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setError(null);
    setSuccessText(null);
    setCouponCode('');
    void boot();
  }, [isOpen]);

  const boot = async () => {
    setLoading(true);
    try {
      const [creditsResp, settings, featuredPaymentsEnabled, mercadoPagoEnabled] = await Promise.all([
        getUserCredits(),
        getFeaturedSettings(),
        getSettingBool('featured_payments_enabled', false),
        getSettingBool('mercadopago_enabled', false),
      ]);

      setVirtualBalance(creditsResp.data?.credits_available ?? 0);
      setDurationDays(settings.durationDays || 15);
      setCosts(DEFAULT_COSTS);
      setPaymentToggles({ featuredPaymentsEnabled, mercadoPagoEnabled });
    } catch {
      setError('No se pudo cargar la configuracion de visibilidad');
    } finally {
      setLoading(false);
    }
  };

  const togglePlacement = (placement: FeaturedPlacement) => {
    setSelectedPlacements((prev) =>
      prev.includes(placement) ? prev.filter((value) => value !== placement) : [...prev, placement]
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Ingresa un cupon valido');
      return;
    }

    setCouponLoading(true);
    setError(null);
    setSuccessText(null);
    const result = await redeemCoupon(couponCode.trim());

    if (result.success) {
      const creditsResp = await getUserCredits();
      setVirtualBalance(creditsResp.data?.credits_available ?? virtualBalance);
      setCouponCode('');
      setSuccessText('Cupon aplicado. Tu saldo ARS virtual fue actualizado.');
    } else {
      setError(result.error || 'No se pudo canjear el cupon');
    }
    setCouponLoading(false);
  };

  const handleConfirm = async () => {
    if (!selectedDate || selectedPlacements.length === 0) {
      setError('Selecciona ubicaciones y fecha de inicio');
      return;
    }
    if (!hasCategoryData) {
      setError('El aviso debe tener categoria y subcategoria');
      return;
    }
    if (!hasEnoughBalance) {
      setError('Saldo ARS virtual insuficiente');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessText(null);

    const placementErrors: string[] = [];

    for (const placement of selectedPlacements) {
      const { data, error: createError } = await createUserFeaturedAd(ad.id, placement, selectedDate);
      if (createError || !data?.success) {
        placementErrors.push(`${placement}: ${data?.error_message || createError?.message || 'Error'}`);
      }
    }

    if (placementErrors.length > 0) {
      setError(placementErrors.join(' | '));
      setSubmitting(false);
      return;
    }

    const creditsResp = await getUserCredits();
    setVirtualBalance(creditsResp.data?.credits_available ?? virtualBalance);
    setSubmitting(false);
    setSuccessText('Visibilidad aplicada correctamente');
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between bg-brand-700">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Gestionar visibilidad</h3>
              <p className="text-sm text-white/90">1 aviso por operacion para usuarios no superadmin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          <div className="border rounded-xl">
            <div className="px-4 py-3 bg-emerald-600 text-white font-bold rounded-t-xl">
              1. Aviso Seleccionado
            </div>
            <div className="p-3 space-y-2">
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">{ad.title}</p>
              <p className="text-xs text-gray-500">{ad.category_name || 'Sin categoria'}</p>
              <p className="text-xs text-gray-500">Cantidad: 1 aviso</p>
              {!hasCategoryData && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Faltan categoria y subcategoria para destacar.
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-xl">
            <div className="px-4 py-3 bg-blue-600 text-white font-bold rounded-t-xl">
              2. Configurar Ubicaciones
            </div>
            <div className="p-3 space-y-2">
              {PLACEMENT_OPTIONS.map((option) => {
                const selected = selectedPlacements.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => togglePlacement(option.value)}
                    className={`w-full text-left p-2 rounded-lg border ${
                      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="text-xs font-bold">{costs[option.value]} ARSV</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  </button>
                );
              })}

              <div className="pt-3 border-t mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Duracion estimada: {durationDays} dias
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl">
            <div className="px-4 py-3 bg-orange-500 text-white font-bold rounded-t-xl">
              3. Resumen y Pago
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando saldo...
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    Saldo ARS virtual: <span className="font-bold">{virtualBalance} ARSV</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Total seleccionado: <span className="font-bold">{totalCost} ARSV</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Checkout MercadoPago: {paymentToggles.featuredPaymentsEnabled && paymentToggles.mercadoPagoEnabled ? 'ON' : 'OFF'}
                  </p>
                </>
              )}

              <div className="pt-2 border-t space-y-2">
                <label className="block text-xs font-medium text-gray-600">Aplicar cupon</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="CODIGO"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-brand-700 text-brand-700 rounded-lg hover:bg-brand-50"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    {couponLoading ? 'Aplicando...' : 'Aplicar'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs bg-red-50 text-red-700 border border-red-200 rounded p-2">{error}</div>
              )}
              {successText && (
                <div className="text-xs bg-green-50 text-green-700 border border-green-200 rounded p-2 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {successText}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={submitting || selectedPlacements.length === 0 || !hasEnoughBalance}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aplicando...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Activar visibilidad
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
