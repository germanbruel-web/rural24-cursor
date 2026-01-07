import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { notify } from '../../utils/notifications';
import { Button } from '../atoms/Button';
import { FormField } from '../molecules/FormField';

interface LoginFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToReset?: () => void;
}

export default function LoginForm({ onSuccess, onClose, onSwitchToRegister, onSwitchToReset }: LoginFormProps) {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mostrar mensaje de verificación al iniciar sesión
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      const lastLogin = localStorage.getItem('last_login_shown');
      const currentLogin = user.id;
      
      // Solo mostrar el mensaje una vez por sesión
      if (lastLogin !== currentLogin) {
        notify.success('✅ Tu cuenta ha sido verificada. Una cuenta verificada demuestra más confianza frente al mercado de agronegocios.');
        localStorage.setItem('last_login_shown', currentLogin);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message || 'Error al iniciar sesión');
      setLoading(false);
    } else {
      setLoading(false);
      onSuccess?.();
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="relative text-center mb-4 sm:mb-6">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-1 -right-1 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <LogIn className="w-10 h-10 sm:w-12 sm:h-12 text-[#16a135] mx-auto mb-3" />
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1b2f23]">Iniciar Sesión</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Accede a tu cuenta de AgroBuscador</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
          leftIcon={<Mail size={18} />}
        />

        <FormField
          label="Contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
        />

        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onSwitchToReset}
          className="-mt-2"
        >
          ¿Olvidaste tu contraseña?
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
          leftIcon={<LogIn size={18} />}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm mb-3">
          ¿No tienes cuenta?
        </p>
        <Button
          variant="outline"
          size="md"
          onClick={onSwitchToRegister}
          className="w-full"
        >
          Regístrate aquí
        </Button>
      </div>
    </div>
  );
}
