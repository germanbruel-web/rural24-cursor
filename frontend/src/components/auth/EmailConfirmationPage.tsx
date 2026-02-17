import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { navigateTo } from '../../hooks/useNavigate';

export const EmailConfirmationPage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Verificar si el hash tiene tokens de confirmación
    const checkConfirmation = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1).split('?')[1] || '');
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      console.log('🔍 Verificando confirmación:', { type, hasToken: !!accessToken });

      if (type === 'signup' && accessToken) {
        setStatus('success');
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigateTo('/');
          // Trigger auth modal with login view
          const event = new CustomEvent('openAuthModal', { detail: { view: 'login' } });
          window.dispatchEvent(event);
        }, 3000);
      } else if (user) {
        setStatus('success');
        setTimeout(() => {
          navigateTo('/');
          const event = new CustomEvent('openAuthModal', { detail: { view: 'login' } });
          window.dispatchEvent(event);
        }, 2000);
      } else {
        // Dar un poco más de tiempo para que Supabase procese
        setTimeout(() => {
          if (!user) {
            setStatus('error');
          }
        }, 2000);
      }
    };

    checkConfirmation();
  }, [user]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <Loader2 className="w-16 h-16 text-brand-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verificando tu email...
          </h1>
          <p className="text-gray-600">
            Por favor esperá un momento
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="w-20 h-20 text-brand-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ✅ Email Verificado!
          </h1>
          <p className="text-gray-600 mb-4">
            Tu cuenta ha sido activada correctamente.
          </p>
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700">
              💚 <strong>¡Cuenta Verificada!</strong><br/>
              <span className="text-xs">Una cuenta verificada demuestra más confianza frente al mercado de agronegocios. Ahora podés iniciar sesión y acceder a todas las funcionalidades.</span>
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Serás redirigido al inicio de sesión en unos segundos...
          </p>
          <button
            onClick={() => {
              navigateTo('/');
              const event = new CustomEvent('openAuthModal', { detail: { view: 'login' } });
              window.dispatchEvent(event);
            }}
            className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Iniciar Sesión Ahora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <XCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ❌ Error de Verificación
        </h1>
        <p className="text-gray-600 mb-6">
          El link de verificación es inválido o ha expirado. Por favor, intentá registrarte nuevamente.
        </p>
        <button
          onClick={() => (navigateTo('/'))}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};
