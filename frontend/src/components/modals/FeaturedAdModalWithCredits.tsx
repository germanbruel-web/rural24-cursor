/**
 * FeaturedAdModalWithCredits.tsx
 * Modal para destacar un anuncio usando créditos
 * Mobile First - Design System RURAL24
 */

import React, { useEffect, useState } from 'react';
import { X, Sparkles, Clock, AlertCircle, Loader2, CheckCircle2, ShoppingCart, Gift, Calendar } from 'lucide-react';
import {
  activateFeaturedWithCredits,
  getCreditsConfig,
  getUserCredits,
  getDaysRemainingInBillingPeriod
} from '../../services/creditsService';
import { supabase } from '../../services/supabaseClient';
import BuyCreditsModal from './BuyCreditsModal';
import RedeemCouponModal from './RedeemCouponModal';

interface Props {
  isOpen: boolean;
  adId: string;
  adTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FeaturedAdModalWithCredits: React.FC<Props> = ({
  isOpen,
  adId,
  adTitle = 'Tu anuncio',
  onClose,
  onSuccess
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [config, setConfig] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modales adicionales
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showRedeemCouponModal, setShowRedeemCouponModal] = useState(false);
  const [daysRemainingInPeriod, setDaysRemainingInPeriod] = useState<number>(30);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }

    setUser(authUser);

    const [configData, creditsData, daysRemaining] = await Promise.all([
      getCreditsConfig(),
      getUserCredits(authUser.id),
      getDaysRemainingInBillingPeriod(authUser.id)
    ]);

    setConfig(configData);
    setCredits(creditsData);
    setDaysRemainingInPeriod(daysRemaining);
    setLoading(false);
  };

  const getCurrentDurationConfig = () => {
    if (!config) return null;
    const found = config.featured_durations.find(
      (d: any) => d.duration_days === selectedDuration
    );
    return found || { credits_needed: 1, label: '7 días', duration_days: 7 };
  };

  // Filtrar duraciones según días restantes en el periodo
  const getAvailableDurations = () => {
    if (!config || !config.featured_durations) return [];
    
    // Filtrar solo las duraciones que caben en el periodo restante
    return config.featured_durations.filter(
      (d: any) => d.duration_days <= daysRemainingInPeriod
    );
  };

  const durationConfig = getCurrentDurationConfig();
  const availableDurations = getAvailableDurations();
  const canAfford = credits?.balance >= (durationConfig?.credits_needed || 0);

  const handleActivate = async () => {
    if (!user || !durationConfig || !canAfford) return;

    setSubmitting(true);
    setError(null);

    try {
      await activateFeaturedWithCredits(user.id, adId, selectedDuration);
      setSuccess(true);

      // Recargar créditos
      const updatedCredits = await getUserCredits(user.id);
      setCredits(updatedCredits);

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al destacar el anuncio');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* ============================================
            HEADER
            ============================================ */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 sm:px-8 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Destacar Anuncio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6">
            {/* ============================================
                TITULO DEL ANUNCIO
                ============================================ */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-xs sm:text-sm text-green-700 font-semibold mb-1">
                ANUNCIO A DESTACAR
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-800 truncate">
                {adTitle}
              </p>
            </div>

            {/* ============================================
                BALANCE Y PERIODO
                ============================================ */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Tus créditos:</span>
                <span className="text-2xl font-black text-blue-600">
                  {credits?.balance || 0}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-4">
                <Calendar className="w-4 h-4" />
                <span>
                  Tu periodo termina en <strong className="text-amber-700">{daysRemainingInPeriod} días</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowBuyCreditsModal(true)}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all text-xs sm:text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Comprar
                </button>
                
                <button
                  onClick={() => setShowRedeemCouponModal(true)}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all text-xs sm:text-sm"
                >
                  <Gift className="w-4 h-4" />
                  Canjear
                </button>
              </div>
            </div>

            {/* ============================================
                AVISO SI HAY DURACIONES FILTRADAS
                ============================================ */}
            {availableDurations.length < (config?.featured_durations?.length || 0) && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-700 text-sm">
                    Opciones limitadas por tu periodo
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Solo podés destacar por hasta {daysRemainingInPeriod} días. Las opciones más largas estarán disponibles cuando se renueve tu periodo.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================
                SELECTOR DE DURACIÓN
                ============================================ */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4 text-base sm:text-lg">
                Elegí el tiempo de duración
              </h3>

              <div className="space-y-2 sm:space-y-3">
                {availableDurations.map((duration: any) => {
                  const isSelected = selectedDuration === duration.duration_days;
                  const creditNeeded = duration.credits_needed;
                  const price = config.credit_base_price * creditNeeded;

                  return (
                    <button
                      key={duration.duration_days}
                      onClick={() => setSelectedDuration(duration.duration_days)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-green-600 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            isSelected ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className="font-bold text-gray-800 text-sm sm:text-base">
                              {duration.label}
                            </p>
                            <p className="text-xs text-gray-500">
                              {creditNeeded} {creditNeeded === 1 ? 'crédito' : 'créditos'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-green-600 text-sm sm:text-base">
                            ${price.toLocaleString('es-AR')}
                          </p>
                          {isSelected && (
                            <div className="w-4 h-4 bg-green-600 rounded-full mx-auto mt-1"></div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ============================================
                RESUMEN
                ============================================ */}
            {durationConfig && (
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tu balance actual:</span>
                  <span className="font-bold text-gray-800">
                    {credits?.balance} créditos
                  </span>
                </div>

                <div className="border-t border-gray-300 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Créditos a usar:</span>
                    <span className="font-bold text-red-600">
                      -{durationConfig.credits_needed}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-3">
                  <div className="flex items-center justify-between text-base sm:text-lg">
                    <span className="font-bold text-gray-800">Nuevo balance:</span>
                    <span className={`font-black ${
                      canAfford ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(credits?.balance || 0) - durationConfig.credits_needed}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================
                ERRORES
                ============================================ */}
            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {!canAfford && !success && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-700 text-sm">
                    No tenés suficientes créditos
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Te faltan {durationConfig ? durationConfig.credits_needed - (credits?.balance || 0) : 0} créditos
                  </p>
                </div>
              </div>
            )}

            {/* ============================================
                SUCCESS
                ============================================ */}
            {success && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-700 text-sm">
                    ¡Anuncio destacado exitosamente!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Aparecerá con un badge especial en los resultados de búsqueda
                  </p>
                </div>
              </div>
            )}

            {/* ============================================
                BOTONES
                ============================================ */}
            <div className="flex gap-3 pt-4 sm:pt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all text-sm sm:text-base"
              >
                Cancelar
              </button>

              <button
                onClick={handleActivate}
                disabled={!canAfford || submitting || success}
                className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all text-sm sm:text-base flex items-center justify-center gap-2 ${
                  canAfford && !submitting && !success
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {success ? '✓ Destacado' : `Destacar por ${durationConfig?.label}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          MODALES ADICIONALES
          ============================================ */}
      <BuyCreditsModal
        isOpen={showBuyCreditsModal}
        onClose={() => setShowBuyCreditsModal(false)}
        onSuccess={() => {
          setShowBuyCreditsModal(false);
          loadData(); // Recargar datos para actualizar el balance
        }}
      />

      <RedeemCouponModal
        isOpen={showRedeemCouponModal}
        onClose={() => setShowRedeemCouponModal(false)}
        onSuccess={(creditsGranted, newBalance) => {
          setShowRedeemCouponModal(false);
          loadData(); // Recargar datos para actualizar el balance
        }}
      />
    </div>
  );
};

export default FeaturedAdModalWithCredits;
