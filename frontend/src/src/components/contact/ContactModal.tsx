import { useState, useEffect } from 'react';
import { X, Mail, Phone, MessageSquare, AlertTriangle, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sendContactMessage } from '../../services/contactService';
import { getUserContactLimits, getContactLimitWarnings, type ContactLimits } from '../../services/contactLimitsService';
import UpgradeModal from './UpgradeModal';
import type { CreateContactMessageInput } from '../../../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
  adOwnerId: string;
  adTitle: string;
}

/**
 * 💬 Modal de contacto con validaciones progresivas
 * - Verifica autenticación
 * - Verifica email verificado
 * - Verifica límites dinámicos
 * - Muestra advertencias al 75% y 100%
 */
export default function ContactModal({ isOpen, onClose, adId, adOwnerId, adTitle }: ContactModalProps) {
  const { user, profile } = useAuth();
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [limits, setLimits] = useState<ContactLimits | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadLimits();
    }
  }, [isOpen, user]);

  const loadLimits = async () => {
    if (!user) return;
    const userLimits = await getUserContactLimits(user.id);
    setLimits(userLimits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para enviar mensajes');
      return;
    }

    if (!profile?.email_verified) {
      setError('Debes verificar tu email antes de contactar vendedores');
      return;
    }

    if (!message.trim()) {
      setError('Por favor escribe un mensaje');
      return;
    }

    setLoading(true);

    const nameParts = (profile.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const input: CreateContactMessageInput = {
      ad_id: adId,
      ad_owner_id: adOwnerId,
      sender_user_id: user.id,
      sender_name: firstName,
      sender_last_name: lastName,
      sender_phone: profile.mobile || profile.phone || '',
      sender_email: user.email || '',
      message: message.trim(),
    };

    const result = await sendContactMessage(input);

    if (!result.success) {
      if (result.error?.code === 'LIMIT_REACHED') {
        setShowUpgradeModal(true);
      } else {
        setError(result.error?.message || 'Error al enviar el mensaje');
      }
      setLoading(false);
      return;
    }

    // Actualizar límites
    if (result.limits) {
      setLimits(result.limits);
    }

    setSuccess(true);
    setLoading(false);
  };

  const handleClose = () => {
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  // 🔒 Usuario NO logueado
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#1b2f23]">Iniciar Sesión</h3>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-6">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">
              Debes iniciar sesión para contactar al vendedor
            </p>
            <button
              onClick={() => {
                handleClose();
                // TODO: Abrir modal de login
              }}
              className="w-full bg-[#16a135] hover:bg-[#0e7d28] text-white py-3 rounded-lg font-semibold"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✉️ Email NO verificado
  if (!profile?.email_verified) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#1b2f23]">Verificación Requerida</h3>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-6">
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Debes verificar tu email antes de contactar vendedores
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Revisá tu casilla de correo y hacé click en el enlace de verificación que te enviamos a <strong>{user.email}</strong>
            </p>
            <button
              onClick={handleClose}
              className="w-full bg-[#16a135] hover:bg-[#0e7d28] text-white py-3 rounded-lg font-semibold"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Mensaje enviado exitosamente
  if (success) {
    const warnings = limits ? getContactLimitWarnings(limits) : [];
    const showWarning = warnings.length > 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#1b2f23]">¡Mensaje Enviado!</h3>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">
              Tu mensaje fue enviado correctamente al vendedor. Recibirás una respuesta en tu correo electrónico.
            </p>

            {/* Advertencia de límite */}
            {showWarning && limits && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4 text-left">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 text-sm mb-1">
                      {limits.currentSent >= limits.maxSent ? '🚫 Límite Alcanzado' : '⚠️ Límite Próximo'}
                    </p>
                    <p className="text-xs text-gray-700">
                      Has enviado {limits.currentSent} de {limits.maxSent} contactos disponibles en tu plan {limits.planName}.
                    </p>
                    {limits.currentSent >= limits.maxSent && (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="mt-2 text-xs text-amber-700 hover:text-amber-900 underline font-medium"
                      >
                        Actualizar a Premium para contactos ilimitados
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full bg-[#16a135] hover:bg-[#0e7d28] text-white py-3 rounded-lg font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Modal de upgrade */}
        {showUpgradeModal && (
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            planName={limits?.planName || 'FREE'}
          />
        )}
      </div>
    );
  }

  // 💬 Formulario de contacto
  const warnings = limits ? getContactLimitWarnings(limits) : [];
  const isBlocked = limits ? limits.currentSent >= limits.maxSent : false;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#1b2f23]">Contactar Vendedor</h3>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Información del aviso */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 mb-1">Aviso:</p>
            <p className="font-semibold text-gray-900">{adTitle}</p>
          </div>

          {/* Advertencias de límite */}
          {warnings.map((warning, idx) => (
            <div key={idx} className={`
              border-2 rounded-lg p-4 mb-4
              ${warning.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}
            `}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  warning.type === 'warning' ? 'text-amber-600' : 'text-red-600'
                }`} />
                <div>
                  <p className={`font-semibold text-sm mb-1 ${
                    warning.type === 'warning' ? 'text-amber-900' : 'text-red-900'
                  }`}>
                    {warning.title}
                  </p>
                  <p className="text-xs text-gray-700">{warning.message}</p>
                  {warning.action && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      {warning.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Formulario */}
          {!isBlocked ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tu Nombre
                </label>
                <input
                  id="name"
                  type="text"
                  value={profile?.full_name || ''}
                  disabled
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tu Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mensaje *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent resize-none"
                  placeholder="Hola, estoy interesado en..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#16a135] hover:bg-[#0e7d28] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </div>

              {/* Info de límites */}
              {limits && (
                <p className="text-xs text-gray-500 text-center">
                  {limits.currentSent}/{limits.maxSent} contactos enviados ({limits.planName})
                </p>
              )}
            </form>
          ) : (
            <div className="text-center py-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">
                Alcanzaste el límite de {limits?.maxSent} contactos enviados de tu plan {limits?.planName}.
              </p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-[#16a135] hover:bg-[#0e7d28] text-white py-3 rounded-lg font-semibold"
              >
                Actualizar a Premium
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de upgrade */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          planName={limits?.planName || 'FREE'}
        />
      )}
    </>
  );
}
