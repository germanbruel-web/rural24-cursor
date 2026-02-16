import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { KeyRound, Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function ResetPasswordForm({ onSuccess, onBack }: ResetPasswordFormProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError.message || 'Error al enviar email de recuperación');
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-brand-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brand-950 mb-2">Email Enviado</h2>
          <p className="text-gray-600 mb-4">
            Te hemos enviado un email a <strong>{email}</strong> con instrucciones para restablecer tu contraseña.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Por favor revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
          <button
            onClick={onBack}
            className="text-brand-500 font-medium hover:underline"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <KeyRound className="w-12 h-12 text-brand-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-brand-950">Recuperar Contraseña</h2>
        <p className="text-gray-600 mt-2">
          Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Instrucciones'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-brand-500 font-medium hover:underline"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}
