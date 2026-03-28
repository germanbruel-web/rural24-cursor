import React, { useState, useEffect } from 'react';
import { Smartphone, X, CheckCircle } from 'lucide-react';
import { sendVerificationCode, verifyCode } from '../../services/phoneVerificationService';
import { useAuth } from '../../contexts/AuthContext';

interface PhoneVerificationModalProps {
  onClose: () => void;
  onVerified: () => void;
}

type Step = 'input-phone' | 'input-code' | 'verified';

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({ onClose, onVerified }) => {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('input-phone');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-cierre cuando se verifica
  useEffect(() => {
    if (step === 'verified') {
      const timer = setTimeout(() => {
        onVerified();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, onVerified]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) return;
    setLoading(true);
    setError(null);

    const result = await sendVerificationCode(mobile.trim());
    setLoading(false);

    if (result.success) {
      setStep('input-code');
    } else {
      setError(result.error || 'Error al enviar el código. Verificá el número e intentá de nuevo.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const result = await verifyCode(mobile.trim(), code.trim());
    setLoading(false);

    if (result.success || result.alreadyVerified) {
      await refreshProfile();
      setStep('verified');
    } else {
      setError(result.error || 'Código incorrecto. Revisá el SMS e intentá de nuevo.');
    }
  };

  const handleResend = async () => {
    setError(null);
    setCode('');
    const result = await sendVerificationCode(mobile.trim());
    if (!result.success) {
      setError('No se pudo reenviar el código.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'input-phone' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-brand-500" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">Verificá tu celular</h2>
              <p className="text-sm text-gray-500 mt-1">
                Para contactar al vendedor necesitás un celular verificado
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de celular
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="+54 9 11 XXXX-XXXX"
                required
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !mobile.trim()}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        )}

        {step === 'input-code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-brand-500" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">Ingresá el código</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enviamos un código de 4 dígitos a{' '}
                <span className="font-medium text-gray-700">{mobile}</span>
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div>
              <input
                type="number"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="0000"
                required
                autoFocus
                maxLength={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-center text-2xl tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              className="w-full text-sm text-brand-600 hover:text-brand-700 transition-colors"
            >
              Reenviar código
            </button>
          </form>
        )}

        {step === 'verified' && (
          <div className="py-4 text-center space-y-3">
            <div className="flex justify-center">
              <CheckCircle className="w-14 h-14 text-brand-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">¡Celular verificado!</h2>
            <p className="text-sm text-gray-500">Abriendo WhatsApp...</p>
          </div>
        )}
      </div>
    </div>
  );
};
