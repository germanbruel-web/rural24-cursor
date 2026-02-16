import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircle, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { notify } from '../../utils/notifications';
import { Button } from '../atoms/Button';
import { FormField } from '../molecules/FormField';
import { socialAuthService } from '../../services/socialAuthService';

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mostrar mensaje de verificación al iniciar sesión
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      const lastLogin = localStorage.getItem('last_login_shown');
      const currentLogin = user.id;
      
      // Solo mostrar el mensaje una vez por sesión
      if (lastLogin !== currentLogin) {
        notify.success('Tu cuenta ha sido verificada. Una cuenta verificada demuestra más confianza frente al mercado de agronegocios.');
        localStorage.setItem('last_login_shown', currentLogin);
      }
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    setError(null);
    const { error: googleError } = await socialAuthService.signInWithGoogle();
    if (googleError) {
      setError(googleError.message || 'Error con Google');
      setSocialLoading(null);
    }
    // Si no hay error, redirigirá a Google
  };

  const handleFacebookLogin = async () => {
    setSocialLoading('facebook');
    setError(null);
    const { error: fbError } = await socialAuthService.signInWithFacebook();
    if (fbError) {
      setError(fbError.message || 'Error con Facebook');
      setSocialLoading(null);
    }
    // Si no hay error, redirigirá a Facebook
  };

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
        <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#16a135] mx-auto mb-3" />
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1b2f23]">Iniciar Sesión</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Accede a tu cuenta de Rural24</p>
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

        <div className="relative">
          <FormField
            label="Contraseña"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

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
          leftIcon={<UserCircle size={18} />}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">o continúa con</span>
          </div>
        </div>

        {/* Botones de login social */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={socialLoading !== null || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">
              {socialLoading === 'google' ? 'Conectando...' : 'Google'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={socialLoading !== null || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-gray-700 font-medium">
              {socialLoading === 'facebook' ? 'Conectando...' : 'Facebook'}
            </span>
          </button>
        </div>
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
