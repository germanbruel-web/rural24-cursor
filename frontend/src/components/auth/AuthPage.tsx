/**
 * AuthPage — Página full-screen de login/registro.
 * Reemplaza el AuthModal en rutas #/login y #/register.
 *
 * Desktop: split layout — formulario izquierda | carrusel onboarding derecha
 * Mobile:  solo el formulario, sin carrusel
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ResetPasswordForm from './ResetPasswordForm';
import OnboardingCarousel from './OnboardingCarousel';
import { navigateTo } from '../../hooks/useNavigate';

type View = 'login' | 'register' | 'reset';

interface AuthPageProps {
  initialView?: View;
  onSuccess?: () => void;
}

export default function AuthPage({ initialView = 'login', onSuccess }: AuthPageProps) {
  const [view, setView] = useState<View>(initialView);

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigateTo('/');
    }
  };

  const handleClose = () => navigateTo('/');

  return (
    <div className="fixed inset-0 z-50 bg-white flex">

      {/* ── Panel izquierdo: formulario (50% desktop, 100% mobile) ── */}
      <div className="relative flex flex-col w-full lg:w-1/2 overflow-y-auto">

        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenido del form centrado verticalmente */}
        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <div className="w-full max-w-md">
            {view === 'login' && (
              <LoginForm
                onSuccess={handleSuccess}
                onClose={handleClose}
                onSwitchToRegister={() => setView('register')}
                onSwitchToReset={() => setView('reset')}
              />
            )}
            {view === 'register' && (
              <RegisterForm
                onSuccess={handleSuccess}
                onClose={handleClose}
                onSwitchToLogin={() => setView('login')}
              />
            )}
            {view === 'reset' && (
              <ResetPasswordForm
                onSuccess={() => setView('login')}
                onBack={() => setView('login')}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Panel derecho: carrusel onboarding (50% desktop, oculto mobile) ── */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <OnboardingCarousel />
      </div>

    </div>
  );
}
