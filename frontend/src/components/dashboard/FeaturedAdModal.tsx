import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  Zap,
} from 'lucide-react';
import {
  createUserFeaturedAd,
  getFeaturedSettings,
  type FeaturedPlacement,
} from '../../services/userFeaturedService';
import {
  getWalletBalance,
  formatARS,
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

const PLACEMENT_OPTIONS: {
  value: FeaturedPlacement;
  label: string;
  tag: string;
  description: string;
  coverage: string[];
}[] = [
  {
    value:       'homepage',
    label:       'PREMIUM',
    tag:         'Más visible',
    description: 'Inicio + resultados + detalle del aviso',
    coverage:    ['Página de inicio', 'Resultados de búsqueda', 'Detalle del aviso'],
  },
  {
    value:       'results',
    label:       'ESTÁNDAR',
    tag:         '',
    description: 'Resultados + detalle del aviso',
    coverage:    ['Resultados de búsqueda', 'Detalle del aviso'],
  },
  {
    value:       'detail',
    label:       'BÁSICO',
    tag:         '',
    description: 'Solo en el detalle del aviso',
    coverage:    ['Detalle del aviso'],
  },
];

export default function FeaturedAdModal({ isOpen, onClose, ad, onSuccess }: FeaturedAdModalProps) {
  const [selectedPlacement, setSelectedPlacement] = useState<FeaturedPlacement | null>(null);
  const [slotPrice,         setSlotPrice]         = useState<number>(2500);
  const [durationDays,      setDurationDays]       = useState<number>(15);
  const [balance,           setBalance]            = useState<number>(0);
  const [loading,           setLoading]            = useState(false);
  const [submitting,        setSubmitting]         = useState(false);
  const [error,             setError]              = useState<string | null>(null);
  const [successText,       setSuccessText]        = useState<string | null>(null);

  const hasCategoryData  = Boolean(ad.category_id && ad.subcategory_id);
  const hasEnoughBalance = balance >= slotPrice;
  const balanceAfter     = balance - slotPrice;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPlacement(null);
    setError(null);
    setSuccessText(null);
    void boot();
  }, [isOpen]);

  const boot = async () => {
    setLoading(true);
    try {
      // Obtener user_id del auth
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const [walletData, settings, priceRow] = await Promise.all([
        authUser ? getWalletBalance(authUser.id) : Promise.resolve(null),
        getFeaturedSettings(),
        // Leer precio del slot desde global_config
        supabase
          .from('global_config')
          .select('value')
          .eq('key', 'featured_slot_price_ars')
          .single()
          .then(r => r.data),
      ]);

      setBalance(walletData?.virtual_balance ?? 0);
      setDurationDays(settings.durationDays || 15);

      const price = priceRow?.value ? Number(priceRow.value) : 2500;
      setSlotPrice(isNaN(price) ? 2500 : price);
    } catch {
      setError('No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
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
      setError('Saldo insuficiente');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessText(null);

    const today = new Date().toISOString().split('T')[0];
    const { data, error: createError } = await createUserFeaturedAd(ad.id, selectedPlacement, today);

    if (createError || !data?.success) {
      setError(data?.message || createError?.message || 'No se pudo activar el destacado');
      setSubmitting(false);
      return;
    }

    // Recargar saldo desde wallet
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const updatedWallet = await getWalletBalance(authUser.id);
      setBalance(updatedWallet?.virtual_balance ?? balance - slotPrice);
    }

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
              <span className={`text-lg font-bold ${hasEnoughBalance ? 'text-brand-700' : 'text-red-600'}`}>
                {formatARS(balance)} ARS
              </span>
            </div>
          )}

          {/* Alerta saldo insuficiente */}
          {!loading && !hasEnoughBalance && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-200">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Saldo insuficiente. Necesitás {formatARS(slotPrice)} ARS.{' '}
                <span className="font-medium">Canjea un cupón desde Mi Cuenta para cargar saldo.</span>
              </span>
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">¿Dónde querés que aparezca?</p>
              <span className="text-xs text-gray-400 font-medium">
                {formatARS(slotPrice)} ARS · {durationDays} días
              </span>
            </div>
            {PLACEMENT_OPTIONS.map((option) => {
              const selected  = selectedPlacement === option.value;
              const canAfford = hasEnoughBalance;
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
                      {option.tag && (
                        <span className="px-1.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-full leading-none">
                          {option.tag}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${selected ? 'text-brand-700' : 'text-gray-500'}`}>
                      {formatARS(slotPrice)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {option.description}
                  </p>
                </button>
              );
            })}
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
                  <span className="font-semibold">{formatARS(slotPrice)} ARS</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Saldo después</span>
                  <span className={`font-semibold ${balanceAfter < 0 ? 'text-red-600' : 'text-brand-700'}`}>
                    {formatARS(balanceAfter)} ARS
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
                  {selectedPlacement
                    ? `Usar ${formatARS(slotPrice)} ARS · Destacar ${durationDays} días`
                    : 'Elegí una opción'}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
