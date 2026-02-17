/**
 * RegisterForm.tsx — Formulario de Registro Compacto
 * Design System RURAL24
 * 
 * Single-step, minimalista:
 * - Nombre + Apellido
 * - Email
 * - Contraseña
 * - ¿Cuál es tu actividad? (dropdown)
 * - Nombre empresa (condicional si actividad = 'empresa')
 * - Social login (Google / Facebook)
 */

import { useState } from 'react';
import { Mail, Lock, User, AlertCircle, Building2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { registerUser, type RegisterUserInput } from '../../services/authService';
import { signInWithGoogle, signInWithFacebook } from '../../services/socialAuthService';
import { Button } from '../atoms/Button';
import FormField from '../molecules/FormField';

interface RegisterFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

type Activity = 'productor' | 'empresa' | 'comerciante' | 'profesional' | 'usuario_general';

const ACTIVITY_OPTIONS: { value: Activity; label: string }[] = [
  { value: 'productor', label: 'Productor' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'comerciante', label: 'Comerciante' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'usuario_general', label: 'Usuario General' },
];

export default function RegisterForm({ onSuccess, onClose, onSwitchToLogin }: RegisterFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activity, setActivity] = useState<Activity | ''>('');
  const [companyName, setCompanyName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ingresá tu nombre y apellido');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!activity) {
      setError('Seleccioná tu actividad');
      return;
    }
    if (activity === 'empresa' && !companyName.trim()) {
      setError('Ingresá el nombre de tu empresa');
      return;
    }

    setLoading(true);

    try {
      const input: RegisterUserInput = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        activity: activity as Activity,
        companyName: activity === 'empresa' ? companyName.trim() : undefined,
      };
      
      const result = await registerUser(input);

      if (!result.success) {
        if (result.errorCode === 'RATE_LIMIT') {
          setError('RATE_LIMIT');
        } else if (result.errorCode === 'EMAIL_EXISTS') {
          setError('Este email ya está registrado. ¿Querés iniciar sesión?');
        } else if (result.errorCode === 'WEAK_PASSWORD') {
          setError('La contraseña debe tener al menos 6 caracteres');
        } else {
          setError(result.error || 'Error al registrarse');
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    setError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || 'Error con Google');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setSocialLoading('facebook');
    setError(null);
    try {
      const { error } = await signInWithFacebook();
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || 'Error con Facebook');
    } finally {
      setSocialLoading(null);
    }
  };

  // ── SUCCESS STATE ──
  if (success) {
    return (
      <div className="w-full bg-white rounded-xl shadow-lg p-6">
        <div className="relative text-center">
          {onClose && (
            <button onClick={onClose} className="absolute -top-1 -right-1 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-9 h-9 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta Creada!</h2>
          <p className="text-sm text-gray-600 mb-1">Te enviamos un email de verificación a:</p>
          <p className="text-base font-semibold text-brand-600 mb-5">{email}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-left">
            <p className="text-sm text-blue-800">
              Revisá tu bandeja de entrada y hacé click en el enlace para activar tu cuenta.
            </p>
          </div>
          <Button
            onClick={() => { onClose?.(); onSwitchToLogin?.(); }}
            variant="primary"
            size="lg"
            fullWidth
          >
            Ir a Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  // ── FORM ──
  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-4 sm:p-6">
      {/* Header */}
      <div className="relative text-center mb-5">
        {onClose && (
          <button onClick={onClose} className="absolute -top-1 -right-1 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <img 
          src="/images/logos/rural24-dark.webp" 
          alt="RURAL24" 
          className="h-7 w-auto mx-auto mb-2" 
        />
        <h2 className="text-2xl font-bold text-gray-900">Crear Cuenta</h2>
        <p className="text-sm text-gray-500 mt-1">Registrate gratis en Rural24</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4">
          {error === 'RATE_LIMIT' ? (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-amber-900 mb-1">Límite temporal</p>
                  <p className="text-amber-800 mb-2">Demasiados registros. Probá en 30 min o usá Google/Facebook.</p>
                  <button onClick={onSwitchToLogin} className="text-brand-600 font-medium underline">
                    ¿Ya tenés cuenta? Iniciá sesión
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-red-800">
                {error}
                {error.includes('ya está registrado') && (
                  <button onClick={onSwitchToLogin} className="block text-brand-600 font-medium underline mt-1">
                    Ir a iniciar sesión
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Nombre"
            name="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            leftIcon={<User size={16} />}
            placeholder="Juan"
            required
          />
          <FormField
            label="Apellido"
            name="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Pérez"
            required
          />
        </div>

        {/* Email */}
        <FormField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
          placeholder="tu@email.com"
          required
        />

        {/* Contraseña */}
        <div className="relative">
          <FormField
            label="Contraseña"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Actividad (dropdown) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ¿Cuál es tu actividad?
          </label>
          <div className="relative">
            <select
              value={activity}
              onChange={(e) => {
                setActivity(e.target.value as Activity);
                if (e.target.value !== 'empresa') setCompanyName('');
              }}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-900 
                         focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent
                         transition-colors cursor-pointer"
              required
            >
              <option value="" disabled>Seleccioná una opción</option>
              {ACTIVITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Nombre de empresa (condicional) */}
        {activity === 'empresa' && (
          <FormField
            label="Nombre de la Empresa"
            name="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            leftIcon={<Building2 size={16} />}
            placeholder="Ej: Agropecuaria San José"
            required
          />
        )}

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading}
          loading={loading}
        >
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </Button>
      </form>

      {/* Separador */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-gray-400">o registrate con</span>
        </div>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={socialLoading !== null || loading}
          className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {socialLoading === 'google' ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span className="text-sm font-medium text-gray-700">Google</span>
        </button>

        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={socialLoading !== null || loading}
          className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {socialLoading === 'facebook' ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          )}
          <span className="text-sm font-medium text-gray-700">Facebook</span>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          ¿Ya tenés cuenta?{' '}
          <button onClick={onSwitchToLogin} className="text-brand-600 font-medium hover:underline">
            Iniciá sesión
          </button>
        </p>
      </div>
    </div>
  );
}
