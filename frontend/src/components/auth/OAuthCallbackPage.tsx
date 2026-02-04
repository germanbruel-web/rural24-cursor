/**
 * OAuthCallbackPage.tsx
 * Página de callback para autenticación OAuth (Google, Facebook)
 * 
 * Esta página se muestra brevemente mientras se procesa el callback de OAuth.
 * Supabase maneja el token automáticamente y redirige al usuario.
 */

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { handleOAuthCallback, createOAuthUserProfile } from '../../services/socialAuthService';
import { useAuth } from '../../contexts/AuthContext';

interface OAuthCallbackPageProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function OAuthCallbackPage({ onComplete, onError }: OAuthCallbackPageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // 1. Manejar el callback de OAuth y obtener la sesión
        const { session, error } = await handleOAuthCallback();
        
        if (error) {
          console.error('❌ Error en OAuth callback:', error);
          setStatus('error');
          setMessage(error.message || 'Error al procesar la autenticación');
          onError?.(error.message || 'Error de autenticación');
          return;
        }

        if (!session?.user) {
          setStatus('error');
          setMessage('No se pudo obtener la información del usuario');
          onError?.('No se obtuvo sesión');
          return;
        }

        // 2. Crear perfil en la tabla users si es nuevo
        const provider = session.user.app_metadata?.provider as 'google' | 'facebook' | undefined;
        if (provider) {
          await createOAuthUserProfile(session.user, provider);
        }

        // 3. Refrescar el perfil en el contexto
        await refreshProfile();

        setStatus('success');
        setMessage('¡Autenticación exitosa! Redirigiendo...');

        // 4. Redirigir al home después de un breve delay
        setTimeout(() => {
          window.location.hash = '#/';
          onComplete?.();
        }, 1500);

      } catch (err: any) {
        console.error('❌ Exception en OAuth callback:', err);
        setStatus('error');
        setMessage(err.message || 'Error inesperado');
        onError?.(err.message || 'Error inesperado');
      }
    };

    processCallback();
  }, [onComplete, onError, refreshProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {message}
              </h2>
              <p className="text-gray-500">
                Por favor espera un momento...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Bienvenido a Rural24!
              </h2>
              <p className="text-gray-500">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error de autenticación
              </h2>
              <p className="text-red-600 mb-4">
                {message}
              </p>
              <button
                onClick={() => {
                  window.location.hash = '#/';
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Volver al inicio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
