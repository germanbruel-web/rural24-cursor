import { useState } from 'react';
import { UserPlus, Mail, Lock, User, AlertCircle, Phone, Building2, FileText } from 'lucide-react';
import { registerPersona, registerEmpresa, formatCUIT, type RegisterPersonaInput, type RegisterEmpresaInput } from '../../services/authService';

interface RegisterFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

type AccountType = 'persona' | 'empresa';
type Step = 1 | 2;

export default function RegisterForm({ onSuccess, onClose, onSwitchToLogin }: RegisterFormProps) {
  // Estado del flujo
  const [step, setStep] = useState<Step>(1);
  const [accountType, setAccountType] = useState<AccountType>('persona');
  
  // Campos comunes
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Campos empresa
  const [companyName, setCompanyName] = useState('');
  const [cuit, setCuit] = useState('');
  const [website, setWebsite] = useState('');
  
  // Control de estado
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones comunes
    if (!firstName.trim() || !lastName.trim()) {
      setError('Por favor ingresa tu nombre y apellido');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validaciones empresa
    if (accountType === 'empresa') {
      if (!companyName.trim()) {
        setError('Por favor ingresa el nombre de la empresa');
        return;
      }
      if (!cuit.trim()) {
        setError('Por favor ingresa el CUIT de la empresa');
        return;
      }
    }

    setLoading(true);

    try {
      let result;
      
      if (accountType === 'persona') {
        const input: RegisterPersonaInput = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          phone: phone || undefined,
          mobile: mobile || undefined,
        };
        result = await registerPersona(input);
      } else {
        const input: RegisterEmpresaInput = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          phone: phone || undefined,
          mobile: mobile || undefined,
          companyName: companyName.trim(),
          cuit: cuit.trim(),
          website: website.trim() || undefined,
        };
        result = await registerEmpresa(input);
      }

      if (!result.success) {
        setError(result.error || 'Error al registrarse');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
      setLoading(false);
    }
  };

  // Auto-formatear CUIT mientras se escribe
  const handleCuitChange = (value: string) => {
    const cleaned = value.replace(/[-\s]/g, '');
    if (cleaned.length <= 11 && /^\d*$/.test(cleaned)) {
      setCuit(cleaned);
    }
  };

  if (success) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg p-8">
        <div className="relative text-center">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1b2f23] mb-3">¡Cuenta Creada!</h2>
          <p className="text-gray-600 mb-2">
            Tu cuenta ha sido registrada exitosamente:
          </p>
          <p className="text-lg font-semibold text-[#16a135] mb-6">
            {email}
          </p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 mb-6 text-left">
            <div className="flex items-start gap-3 mb-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-2">
                  📧 Verificá tu correo electrónico
                </p>
                <p className="text-sm text-gray-700">
                  Te enviamos un enlace de verificación a <strong>{email}</strong>. Por favor, hacé click en el enlace para activar tu cuenta.
                </p>
              </div>
            </div>
          </div>
          
          {accountType === 'empresa' && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-2">
                    🏢 Verificación de Empresa en Proceso
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    Nuestro equipo revisará la información de <strong>{companyName}</strong> (CUIT: {formatCUIT(cuit)}) en las próximas 24-48 horas.
                  </p>
                  <p className="text-xs text-gray-600">
                    💼 Mientras tanto, podés acceder a tu cuenta con el plan FREE (3 avisos, 3 contactos enviados/recibidos).
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700">
              💚 <strong>¿Por qué verificar tu email?</strong><br/>
              <span className="text-xs">Una cuenta verificada demuestra más confianza frente al mercado de agronegocios y te permite acceder a todas las funcionalidades de la plataforma.</span>
            </p>
          </div>
          <button
            onClick={() => {
              onClose?.();
              onSwitchToLogin?.();
            }}
            className="w-full bg-[#16a135] hover:bg-[#0e7d28] text-white py-3 rounded-lg transition-colors font-semibold"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // 🎯 STEP 1: Selector de tipo de cuenta
  if (step === 1) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg p-6">
        <div className="relative text-center mb-6">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <UserPlus className="w-12 h-12 text-[#16a135] mx-auto mb-3" />
          <h2 className="text-3xl font-bold text-[#1b2f23]">Crear Cuenta</h2>
          <p className="text-gray-600 mt-2">Seleccioná el tipo de cuenta que deseas crear</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Card Persona */}
          <button
            onClick={() => {
              setAccountType('persona');
              setStep(2);
            }}
            className="group relative p-6 border-2 border-gray-300 rounded-lg hover:border-[#16a135] hover:shadow-lg transition-all text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1b2f23] mb-2">Persona</h3>
              <p className="text-sm text-gray-600 mb-3">
                Para productores, comerciantes y particulares
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>✓ Registro rápido</p>
                <p>✓ 3 avisos gratis</p>
                <p>✓ 3 contactos enviados</p>
              </div>
            </div>
          </button>

          {/* Card Empresa */}
          <button
            onClick={() => {
              setAccountType('empresa');
              setStep(2);
            }}
            className="group relative p-6 border-2 border-gray-300 rounded-lg hover:border-[#16a135] hover:shadow-lg transition-all text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
                <Building2 className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1b2f23] mb-2">Empresa</h3>
              <p className="text-sm text-gray-600 mb-3">
                Para concesionarios, revendedores y empresas
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>✓ CUIT verificado</p>
                <p>✓ Perfil profesional</p>
                <p>✓ Mayor visibilidad</p>
              </div>
            </div>
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-[#16a135] font-medium hover:underline"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    );
  }

  // 🎯 STEP 2: Formulario de datos
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
        
        {/* Breadcrumb */}
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 text-gray-600 hover:text-[#16a135] mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Cambiar tipo de cuenta</span>
        </button>

        <div className="flex items-center justify-center gap-2 mb-3">
          {accountType === 'persona' ? (
            <User className="w-10 h-10 text-blue-600" />
          ) : (
            <Building2 className="w-10 h-10 text-amber-600" />
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1b2f23]">
          Crear Cuenta {accountType === 'persona' ? 'Personal' : 'Empresarial'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {accountType === 'persona' ? 'Completá tus datos personales' : 'Completá los datos de tu empresa'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre *
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                placeholder="Juan"
              />
            </div>
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
              Apellido *
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                placeholder="Pérez"
              />
            </div>
          </div>
        </div>

        {/* 🏢 CAMPOS EMPRESA */}
        {accountType === 'empresa' && (
          <>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre de la Empresa *
              </label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  placeholder="Ej: Agropecuaria San José S.A."
                />
              </div>
            </div>

            <div>
              <label htmlFor="cuit" className="block text-sm font-medium text-gray-700 mb-1.5">
                CUIT *
              </label>
              <div className="relative">
                <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="cuit"
                  type="text"
                  value={cuit.length === 11 ? formatCUIT(cuit) : cuit}
                  onChange={(e) => handleCuitChange(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  placeholder="20-12345678-9"
                  maxLength={13}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Formato: XX-XXXXXXXX-X (11 dígitos)</p>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1.5">
                Sitio Web (opcional)
              </label>
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  placeholder="https://www.ejemplo.com"
                />
              </div>
            </div>
          </>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        {/* Teléfonos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1.5">
              Celular
            </label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Teléfono Fijo
            </label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                placeholder="011 1234-5678"
              />
            </div>
          </div>
        </div>

        {/* Contraseña */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Contraseña *
          </label>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
        </div>

        {/* Confirmar Contraseña */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirmar Contraseña *
          </label>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#16a135] text-white text-base rounded-lg font-semibold hover:bg-[#0e7d28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? 'Creando cuenta...' : 'CREAR CUENTA'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-[#16a135] font-medium hover:underline"
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
}
