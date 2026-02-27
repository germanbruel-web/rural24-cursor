import { useState } from 'react';
import { AlertCircle, CheckCircle2, Gift, Loader2, Ticket, X } from 'lucide-react';
import { redeemCoupon, validateCoupon } from '../../services/creditsService';

export interface RedeemCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (virtualAmountGranted: number, newBalance: number) => void;
}

const RedeemCouponModal: React.FC<RedeemCouponModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [validated, setValidated] = useState(false);
  const [couponInfo, setCouponInfo] = useState<{ amount: number; description: string } | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleValidate = async () => {
    if (!couponCode.trim()) {
      setError('Ingresa un cupon');
      return;
    }

    setValidating(true);
    setError(null);
    setValidated(false);
    setCouponInfo(null);

    const result = await validateCoupon(couponCode);
    if (result.valid && result.credits && result.description) {
      setValidated(true);
      setCouponInfo({
        amount: result.credits,
        description: result.description,
      });
    } else {
      setError(result.error || 'Cupon invalido');
    }
    setValidating(false);
  };

  const handleRedeem = async () => {
    if (!validated) return;

    setRedeeming(true);
    setError(null);
    const result = await redeemCoupon(couponCode);

    if (result.success && result.creditsGranted !== undefined && result.newBalance !== undefined) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.(result.creditsGranted ?? 0, result.newBalance ?? 0);
        handleClose();
      }, 1200);
    } else {
      setError(result.error || 'No se pudo canjear el cupon');
    }
    setRedeeming(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-5 bg-amber-600 text-white flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <h2 className="font-bold text-lg">Canjear cupon</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700">
            Ingresa tu cupon para sumar ARS virtuales al saldo interno.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Codigo</label>
            <div className="relative">
              <Ticket className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm"
                placeholder="WELCOME2026"
                maxLength={30}
              />
            </div>
          </div>

          {validated && couponInfo && !success && (
            <div className="p-3 rounded-lg border border-green-200 bg-green-50">
              <p className="text-sm font-semibold text-green-700">{couponInfo.description}</p>
              <p className="text-xs text-green-700 mt-1">Monto: +{couponInfo.amount} ARSV</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Cupon canjeado correctamente
            </div>
          )}

          <div className="flex gap-2">
            {!validated ? (
              <button
                onClick={handleValidate}
                disabled={validating || !couponCode.trim()}
                className="flex-1 py-2 rounded-lg bg-amber-600 text-white font-semibold disabled:bg-gray-300"
              >
                {validating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validando...
                  </span>
                ) : (
                  'Validar'
                )}
              </button>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={redeeming || success}
                className="flex-1 py-2 rounded-lg bg-brand-600 text-white font-semibold disabled:bg-gray-300"
              >
                {redeeming ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Canjeando...
                  </span>
                ) : (
                  'Canjear'
                )}
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
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
