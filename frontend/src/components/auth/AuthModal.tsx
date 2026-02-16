import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ResetPasswordForm from './ResetPasswordForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register' | 'reset';
}

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register' | 'reset'>(initialView);

  // Sync view with initialView when modal opens
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md my-8 animate-in fade-in slide-in-from-bottom-4 duration-200">
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
