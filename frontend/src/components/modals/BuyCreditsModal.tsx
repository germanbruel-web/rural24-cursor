/**
 * BuyCreditsModal.tsx
 * Modal para comprar créditos con Mercado Pago
 * Mobile First - Design System RURAL24
 */

import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { purchaseCredits, getCreditsConfig } from '../../services/creditsService';
import { supabase } from '../../services/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BuyCreditsModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedQuantity, setSelectedQuantity] = useState<number>(3);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const configData = await getCreditsConfig();
    setConfig(configData);
    setLoading(false);
  };

  const totalPrice = config?.credit_base_price ? config.credit_base_price * selectedQuantity : 0;

  const handlePurchase = async () => {
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      // En un ambiente real, aquí redirigirías a Mercado Pago
      // Por ahora, creamos la transacción con payment_id simulado
      
      const mockPaymentId = `MP_${Date.now()}`;
      
      await purchaseCredits(user.id, selectedQuantity, mockPaymentId);
      
      setSuccess(true);

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al comprar créditos');
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
        <div className="sticky top-0 bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 sm:px-8 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Cargar saldo
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
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6">
            {/* ============================================
                SELECTOR DE CANTIDAD
                ============================================ */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4 text-base sm:text-lg">
                Elegí cuánto saldo querés cargar
              </h3>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {[1, 2, 3, 4].map(qty => {
                  const price = config?.credit_base_price ? config.credit_base_price * qty : 0;
                  const isSelected = selectedQuantity === qty;
                  const isRecommended = qty === 3;

                  return (
                    <button
                      key={qty}
                      onClick={() => setSelectedQuantity(qty)}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all relative ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                      }`}
                    >
                      {isRecommended && (
                        <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">
                          ⭐ MEJOR
                        </div>
                      )}

                      <div className="text-3xl sm:text-5xl font-black text-brand-600 mb-2">
                        {qty}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        {qty === 1 ? 'destacado' : 'destacados'}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-800">
                        ${price.toLocaleString('es-AR')}
                      </p>

                      {isSelected && (
                        <div className="mt-3 w-5 h-5 bg-brand-600 rounded-full mx-auto"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ============================================
                INFORMACIÓN DE PRECIOS
                ============================================ */}
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3 text-sm sm:text-base">
                💡 ¿Cómo funciona el saldo?
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-blue-800">
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">•</span>
                  <span>1 ARS = {config?.featured_durations?.[0]?.label || '7 días'} de visibilidad</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">•</span>
                  <span>4 ARS = {config?.featured_durations?.[3]?.label || '28 días'} de visibilidad</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">•</span>
                  <span>Usá tu saldo para destacar tus avisos</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">•</span>
                  <span>El saldo no caduca</span>
                </li>
              </ul>
            </div>

            {/* ============================================
                RESUMEN DE COMPRA
                ============================================ */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Créditos a comprar:</span>
                <span className="font-bold text-gray-800 text-base sm:text-lg">
                  {selectedQuantity}
                </span>
              </div>

              <div className="border-t border-gray-300 pt-3">
                <div className="flex items-center justify-between text-base sm:text-lg">
                  <span className="font-bold text-gray-800">Total a pagar:</span>
                  <span className="font-black text-brand-600 text-xl sm:text-2xl">
                    ${totalPrice.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================
                NOTA SOBRE MERCADO PAGO
                ============================================ */}
            <div className="bg-brand-50 rounded-lg p-4 border border-brand-200 flex items-start gap-3">
              <div>
                <p className="text-xs sm:text-sm text-brand-600">
                  <span className="font-bold">🔒 Pago seguro:</span> Usamos <strong>Mercado Pago</strong> para procesar tu pago de forma segura.
                </p>
              </div>
            </div>

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

            {/* ============================================
                SUCCESS
                ============================================ */}
            {success && (
              <div className="bg-brand-50 border border-green-300 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-600 text-sm">
                    ¡Compra realizada exitosamente!
                  </p>
                  <p className="text-xs text-brand-600 mt-1">
                    Se agregaron {selectedQuantity} créditos a tu cuenta
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
                onClick={handlePurchase}
                disabled={submitting || success}
                className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all text-sm sm:text-base flex items-center justify-center gap-2 ${
                  !submitting && !success
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {success ? '✓ Pagado' : `Pagar $${totalPrice.toLocaleString('es-AR')}`}
              </button>
            </div>

            {/* ============================================
                TÉRMINOS
                ============================================ */}
            <p className="text-xs text-center text-gray-500 pt-2">
              Al comprar, aceptás nuestros <strong>Términos de Uso</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyCreditsModal;
