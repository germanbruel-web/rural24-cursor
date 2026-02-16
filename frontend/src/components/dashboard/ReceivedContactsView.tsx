import React, { useState, useEffect } from 'react';
import { Mail, Phone, User, Calendar, MessageSquare, ArrowLeft, ExternalLink } from 'lucide-react';
import { getMyReceivedMessages } from '../../services/contactService';
import type { ContactMessage } from '../../../types';

export const ReceivedContactsView: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { messages: data } = await getMyReceivedMessages();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contactos...</p>
        </div>
      </div>
    );
  }

  // Detail view
  if (selectedMessage) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedMessage(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a contactos
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {selectedMessage.sender_name} {selectedMessage.sender_last_name || ''}
                </h2>
                <p className="text-brand-100 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedMessage.created_at)}
                </p>
              </div>
              {selectedMessage.ads && (
                <a
                  href={`#/ad/${selectedMessage.ad_id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver aviso
                </a>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900 mb-4">Datos de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a
                    href={`mailto:${selectedMessage.sender_email}`}
                    className="font-medium text-gray-900 hover:text-brand-500 transition-colors"
                  >
                    {selectedMessage.sender_email}
                  </a>
                </div>
              </div>

              {selectedMessage.sender_phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-brand-500" />
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <a
                      href={`tel:${selectedMessage.sender_phone}`}
                      className="font-medium text-gray-900 hover:text-brand-500 transition-colors"
                    >
                      {selectedMessage.sender_phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-500" />
              Mensaje
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
          </div>

          {/* Ad Info */}
          {selectedMessage.ads && (
            <div className="p-6 bg-gray-50 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Aviso Relacionado</h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="font-medium text-gray-900">{selectedMessage.ads.title}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedMessage.ads.category}
                  {selectedMessage.ads.subcategory && ` > ${selectedMessage.ads.subcategory}`}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 bg-gray-50 border-t flex gap-3">
            <a
              href={`mailto:${selectedMessage.sender_email}?subject=Re: ${selectedMessage.ads?.title || 'Consulta'}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors font-medium"
            >
              <Mail className="w-5 h-5" />
              Responder por Email
            </a>
            {selectedMessage.sender_phone && (
              <a
                href={`tel:${selectedMessage.sender_phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Phone className="w-5 h-5" />
                Llamar
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contactos Recibidos</h1>
          <p className="text-gray-600 mt-1">
            {messages.length} {messages.length === 1 ? 'contacto' : 'contactos'} en total
          </p>
        </div>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay contactos aún</h3>
          <p className="text-gray-600">
            Cuando alguien se interese en tus avisos, sus mensajes aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <button
              key={message.id}
              onClick={() => setSelectedMessage(message)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left w-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="bg-brand-100 rounded-full p-3">
                    <User className="w-6 h-6 text-brand-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {message.sender_name} {message.sender_last_name || ''}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {message.sender_email}
                    </p>
                    {message.sender_phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4" />
                        {message.sender_phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{formatDate(message.created_at)}</p>
                </div>
              </div>

              {/* Message preview */}
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-gray-700 line-clamp-2">{message.message}</p>
              </div>

              {/* Ad info */}
              {message.ads && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4" />
                  <span>Aviso: {message.ads.title}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
