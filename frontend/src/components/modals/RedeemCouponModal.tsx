/**
 * RedeemCouponModal.tsx
 * Modal para canjear cupones de créditos
 * ========================================
 * Flujo: validateCoupon (read-only preview) → redeemCoupon (API → RPC atómica)
 */

import { useState } from 'react';
import { X, Gift, Loader2, CheckCircle2, AlertCircle, Ticket } from 'lucide-react';
import { validateCoupon, redeemCoupon } from '../../services/creditsService';

export interface RedeemCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (creditsGranted: number, newBalance: number) => void;
}

const RedeemCouponModal: React.FC<RedeemCouponModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [validated, setValidated] = useState(false);
  const [couponInfo, setCouponInfo] = useState<{
    credits: number;
    description: string;
  } | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!couponCode.trim()) {
      setError('Por favor ingresá un código de cupón');
      return;
    }

    setValidating(true);
    setError(null);
    setValidated(false);
    setCouponInfo(null);

    try {
      const result = await validateCoupon(couponCode);

      if (result.valid && result.credits && result.description) {
        setValidated(true);
        setCouponInfo({
          credits: result.credits,
          description: result.description
        });
      } else {
        setError(result.error || 'Cupón inválido o expirado');
      }
    } catch (err: any) {
      console.error('Error validando cupón:', err);
      setError(err?.message || 'Error al validar el cupón');
    } finally {
      setValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!validated || !couponCode.trim()) {
      return;
    }

    setRedeeming(true);
    setError(null);

    try {
      // El backend extrae userId del JWT — no se envía desde frontend
      const result = await redeemCoupon(couponCode);

      if (result.success && result.creditsGranted !== undefined && result.newBalance !== undefined) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.(result.creditsGranted!, result.newBalance!);
          handleClose();
        }, 2000);
      } else {
        setError(result.error || 'Error al canjear el cupón');
      }
    } catch (err: any) {
      console.error('Error canjeando cupón:', err);
      setError(err?.message || 'Error inesperado al canjear el cupón');
    } finally {
      setRedeeming(false);
    }
  };

  const handleClose = () => {
    setCouponCode('');
    setValidating(false);
    setRedeeming(false);
    setValidated(false);
    setCouponInfo(null);
    setSuccess(false);
    setError(null);
    onClose();
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCouponCode(value);
    setValidated(false);
    setCouponInfo(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 p-6 sm:p-8 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Canjear Cupón
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white/90 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* ============================================
              DESCRIPCIÓN
              ============================================ */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💝 <strong>Tenés un cupón?</strong> Ingresalo acá para obtener créditos gratis
              y destacar tus avisos.
            </p>
          </div>

          {/* ============================================
              INPUT CUPÓN
              ============================================ */}
          <div>
            <label className="block font-bold text-gray-800 mb-3 text-sm sm:text-base">
              Código del cupón
            </label>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Ticket className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={couponCode}
                onChange={handleCodeChange}
                placeholder="Ej: WELCOME2026"
                maxLength={20}
                className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none transition-colors font-mono text-base sm:text-lg uppercase"
                disabled={validating || redeeming || success}
              />
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Los códigos son de hasta 20 caracteres (solo letras y números)
            </p>
          </div>

          {/* ============================================
              INFORMACIÓN DEL CUPÓN (después de validar)
              ============================================ */}
          {validated && couponInfo && !success && (
            <div className="bg-brand-50 border-2 border-green-300 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-600 text-base sm:text-lg">
                    ✓ Cupón válido!
                  </p>
                  <p className="text-sm text-brand-600 mt-1">
                    {couponInfo.description}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-brand-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Créditos a recibir:</span>
                  <span className="font-black text-brand-600 text-2xl">
                    +{couponInfo.credits}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================
              CUPONES EJEMPLO
              ============================================ */}
          {!validated && !success && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="font-bold text-gray-700 text-sm mb-2">
                Cupones disponibles:
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded border border-gray-300 font-mono">
                    WELCOME2026
                  </code>
                  <span>- 3 créditos gratis</span>
                </li>
                <li className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded border border-gray-300 font-mono">
                    PROMO50
                  </code>
                  <span>- 2 créditos</span>
                </li>
                <li className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded border border-gray-300 font-mono">
                    FLASH10
                  </code>
                  <span>- 1 crédito</span>
                </li>
              </ul>
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

          {/* ============================================
              SUCCESS
              ============================================ */}
          {success && (
            <div className="bg-brand-50 border border-green-300 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand-600 text-sm">
                  ¡Cupón canjeado exitosamente!
                </p>
                <p className="text-xs text-brand-600 mt-1">
                  Los créditos fueron agregados a tu balance
                </p>
              </div>
            </div>
          )}

          {/* ============================================
              BOTONES
              ============================================ */}
          {!validated ? (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                disabled={validating}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                onClick={handleValidate}
                disabled={!couponCode.trim() || validating}
                className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  !couponCode.trim() || validating
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg'
                }`}
              >
                {validating && <Loader2 className="w-5 h-5 animate-spin" />}
                {validating ? 'Validando...' : 'Validar cupón'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                disabled={redeeming || success}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                onClick={handleRedeem}
                disabled={redeeming || success}
                className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  redeeming || success
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg'
                }`}
              >
                {redeeming && <Loader2 className="w-5 h-5 animate-spin" />}
                {success ? '✓ Canjeado' : 'Canjear ahora'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedeemCouponModal;
