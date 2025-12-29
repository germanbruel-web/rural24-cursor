import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { notify } from '../../utils/notifications';

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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToReset}
          className="text-sm text-[#16a135] hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#16a135] text-white rounded-lg font-medium hover:bg-[#1b2f23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          ¿No tienes cuenta?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-[#16a135] font-medium hover:underline"
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}
