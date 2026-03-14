import { useState } from 'react';
import { AlertCircle, CheckCircle2, Crown, Gift, Loader2, Ticket, X } from 'lucide-react';
import { redeemCoupon, validateCoupon } from '../../services/creditsService';
import { formatARS } from '../../services/walletService';

export interface RedeemCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (virtualAmountGranted: number, newBalance: number, membershipGranted?: boolean) => void;
}

interface CouponPreview {
  arsAmount: number | null;
  membershipPlanName: string | null;
  membershipDays: number;
  description: string;
}

const RedeemCouponModal: React.FC<RedeemCouponModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [validated, setValidated] = useState(false);
  const [preview, setPreview] = useState<CouponPreview | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setCouponCode('');
    setValidating(false);
    setRedeeming(false);
    setValidated(false);
    setPreview(null);
    setSuccess(false);
    setSuccessMessage('');
    setError(null);
    onClose();
  };

  const handleValidate = async () => {
    if (!couponCode.trim()) {
      setError('Ingresá un cupón');
      return;
    }

    setValidating(true);
    setError(null);
    setValidated(false);
    setPreview(null);

    const result = await validateCoupon(couponCode);

    if (result.valid) {
      setValidated(true);
      setPreview({
        arsAmount: result.arsAmount ?? null,
        membershipPlanName: result.membershipPlanName ?? null,
        membershipDays: result.membershipDays ?? 365,
        description: result.description || '',
      });
    } else {
      setError(result.error || 'Cupón inválido');
    }

    setValidating(false);
  };

  const handleRedeem = async () => {
    if (!validated) return;

    setRedeeming(true);
    setError(null);

    const result = await redeemCoupon(couponCode);

    if (result.success) {
      setSuccess(true);
      setSuccessMessage(result.message || 'Cupón canjeado correctamente');
      setTimeout(() => {
        onSuccess?.(result.creditsGranted ?? 0, result.newBalance ?? 0, result.membershipGranted);
        handleClose();
      }, 1500);
    } else {
      setError(result.error || 'No se pudo canjear el cupón');
    }

    setRedeeming(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

        {/* Header */}
        <div className="p-5 bg-brand-700 text-white flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <h2 className="font-bold text-lg">Canjear cupón</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Ingresá tu código para aplicar el beneficio a tu cuenta.
          </p>

          {/* Input código */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Código</label>
            <div className="relative">
              <Ticket className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  setValidated(false);
                  setPreview(null);
                  setError(null);
                }}
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm font-mono tracking-widest focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="RURAL2026"
                maxLength={30}
              />
            </div>
          </div>

          {/* Preview del cupón */}
          {validated && preview && !success && (
            <div className="p-3 rounded-xl border border-brand-200 bg-brand-50 space-y-2">
              {preview.description && (
                <p className="text-sm font-semibold text-brand-800">{preview.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {preview.arsAmount != null && preview.arsAmount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    + {formatARS(preview.arsAmount)} ARS al saldo
                  </span>
                )}
                {preview.membershipPlanName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                    <Crown className="w-3 h-3" />
                    {preview.membershipPlanName} · {preview.membershipDays} días
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2">
            {!validated ? (
              <button
                onClick={handleValidate}
                disabled={validating || !couponCode.trim()}
                className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold disabled:bg-gray-300 transition-colors"
              >
                {validating ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validando...
                  </span>
                ) : 'Validar'}
              </button>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={redeeming || success}
                className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold disabled:bg-gray-300 transition-colors"
              >
                {redeeming ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Canjeando...
                  </span>
                ) : 'Confirmar canje'}
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemCouponModal;
