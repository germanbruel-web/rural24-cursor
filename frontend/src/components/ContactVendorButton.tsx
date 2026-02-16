import React, { useState, useEffect } from 'react';
import { MessageCircle, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { sendContactMessage } from '../services/contactService';
import { getUserContactLimits, type ContactLimits } from '../services/contactLimitsService';

interface ContactVendorButtonProps {
  adId: string;
  adOwnerId: string;
  adTitle: string;
  vendorPhone?: string;
}

export const ContactVendorButton: React.FC<ContactVendorButtonProps> = ({
  adId,
  adOwnerId,
  adTitle,
  vendorPhone
}) => {
  const [showModal, setShowModal] = useState(false);
  const [limits, setLimits] = useState<ContactLimits | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      // Pre-llenar datos del usuario si está autenticado
      const { data: profile } = await supabase
        .from('users')
        .select('nombre, apellido, email, telefono')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData({
          name: `${profile.nombre || ''} ${profile.apellido || ''}`.trim(),
          email: profile.email || user.email || '',
          phone: profile.telefono || '',
          message: `Hola, me interesa "${adTitle}". ¿Está disponible?`
        });
      }

      // Cargar límites solo si está autenticado
      const userLimits = await getUserContactLimits(user.id);
      setLimits(userLimits);
    } else {
      // Usuario no autenticado - usar template default
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: `Hola, me interesa "${adTitle}". ¿Está disponible?`
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendContactMessage({
        adId,
        adOwnerId,
        senderName: formData.name,
        senderEmail: formData.email,
        senderPhone: formData.phone,
        message: formData.message
      });

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error al enviar mensaje:', err);
      if (err.message?.includes('LIMIT_REACHED')) {
        setError('Has alcanzado el límite de contactos. Actualiza a Premium para enviar más mensajes.');
      } else {
        setError(err.message || 'Error al enviar el mensaje. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const canSendContact = !currentUser || (limits?.can_send_more ?? true);

  return (
    <>
      {/* Botón principal */}
      <div className="space-y-3">
        <button
          onClick={() => setShowModal(true)}
          disabled={!canSendContact}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            canSendContact
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          Contactar vendedor
        </button>

        {/* Indicador de límites para usuarios autenticados */}
        {currentUser && limits && (
          <div className="text-xs text-center">
            {limits.can_send_more ? (
              <span className="text-gray-600">
                {limits.max_sent === 999999 ? (
                  <span className="text-brand-500 font-medium">✓ Contactos ilimitados</span>
                ) : (
                  <span>
                    Enviados: <span className="font-medium">{limits.current_sent}</span> de{' '}
                    <span className="font-medium">{limits.max_sent}</span>
                  </span>
                )}
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                ⚠️ Límite alcanzado ({limits.current_sent}/{limits.max_sent})
              </span>
            )}
          </div>
        )}

        {/* WhatsApp como alternativa */}
        {vendorPhone && (
          <a
            href={`https://wa.me/${vendorPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, te contacto por: ${adTitle}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp directo
          </a>
        )}
      </div>

      {/* Modal de contacto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Contactar vendedor</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-16 h-16 text-brand-500 mb-4" />
                <p className="text-lg font-medium text-gray-900">¡Mensaje enviado!</p>
                <p className="text-gray-600 text-center mt-2">
                  El vendedor recibirá tu consulta y te responderá pronto.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="juan@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Escribe tu consulta aquí..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar mensaje'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
