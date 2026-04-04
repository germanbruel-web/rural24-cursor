import React, { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const RESEND_COOLDOWN = 120; // segundos
import { API_CONFIG } from '@/config/api';

interface EmailGatePageProps {
  email: string;
}

export const EmailGatePage: React.FC<EmailGatePageProps> = ({ email }) => {
  const { signOut } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const storageKey = `rural24_resend_${email}`;

  // Inicializar countdown desde localStorage para persistir entre recargas
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    let firstSeen: number;
    let alreadyResent = false;

    if (stored) {
      try {
        const data = JSON.parse(stored) as { firstSeen: number; resentAt?: number };
        firstSeen    = data.firstSeen;
        alreadyResent = !!data.resentAt;
      } catch {
        firstSeen = Date.now();
        localStorage.setItem(storageKey, JSON.stringify({ firstSeen }));
      }
    } else {
      firstSeen = Date.now();
      localStorage.setItem(storageKey, JSON.stringify({ firstSeen }));
    }

    if (alreadyResent) {
      setResent(true);
      return;
    }

    const updateCountdown = () => {
      const elapsed    = Math.floor((Date.now() - firstSeen) / 1000);
      const remaining  = Math.max(0, RESEND_COOLDOWN - elapsed);
      setCountdown(remaining);
      if (remaining === 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [storageKey]);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/resend-verification`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });

      if (!response.ok) {
        const body = await response.json() as { error?: string };
        if (body.error !== 'already_confirmed') {
          throw new Error(body.error || 'Error al reenviar');
        }
      }

      // Marcar como reenviado en localStorage
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const data = JSON.parse(stored) as { firstSeen: number };
          localStorage.setItem(storageKey, JSON.stringify({ ...data, resentAt: Date.now() }));
        } catch { /* ignorar */ }
      }

      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setResent(true);
    } catch (err: unknown) {
      setError('No se pudo reenviar el email. Intentá de nuevo en unos minutos.');
    } finally {
      setResending(false);
    }
  };

  const canResend = countdown === 0 && !resent;

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
            disabled={!canResend || resending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed mb-4 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            {resending
              ? 'Reenviando...'
              : countdown > 0
              ? `Reenviar en ${countdown}s`
              : 'Reenviar email de confirmación'}
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
