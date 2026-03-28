import React, { useState } from 'react';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface EmailGatePageProps {
  email: string;
}

export const EmailGatePage: React.FC<EmailGatePageProps> = ({ email }) => {
  const { signOut } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/#/auth/confirm`,
      },
    });
    if (resendError) {
      setError('No se pudo reenviar el email. Intentá de nuevo en unos minutos.');
    } else {
      setResent(true);
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmá tu email</h1>
        <p className="text-gray-600 mb-6">
          Enviamos un link de confirmación a{' '}
          <span className="font-medium text-gray-900">{email}</span>.
          Hacé clic en el link del email para activar tu cuenta y continuar.
        </p>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {resent ? (
          <p className="text-sm text-brand-600 font-medium mb-6">
            Email reenviado. Revisá tu bandeja de entrada.
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60 mb-4 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Reenviando...' : 'Reenviar email de confirmación'}
          </button>
        )}

        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>

        <p className="text-xs text-gray-400 mt-6">
          ¿No encontrás el email? Revisá la carpeta de spam o correo no deseado.
        </p>
      </div>
    </div>
  );
};
