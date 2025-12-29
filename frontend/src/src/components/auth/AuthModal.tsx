import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ResetPasswordForm from './ResetPasswordForm';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register' | 'reset';
}

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register' | 'reset'>(initialView);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="relative w-full max-w-md md:max-w-lg my-8">
        {view === 'login' && (
          <LoginForm
            onSuccess={onClose}
            onClose={onClose}
            onSwitchToRegister={() => setView('register')}
            onSwitchToReset={() => setView('reset')}
          />
        )}

        {view === 'register' && (
          <RegisterForm
            onSuccess={onClose}
            onClose={onClose}
            onSwitchToLogin={() => setView('login')}
          />
        )}

        {view === 'reset' && (
          <ResetPasswordForm
            onSuccess={onClose}
            onBack={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
}
