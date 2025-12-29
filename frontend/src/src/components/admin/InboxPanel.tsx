import React, { useEffect, useState } from 'react';
import { getMyReceivedMessages, markMessageAsRead } from '../../services/contactService';
import type { ContactMessage } from '../../../types';
import { useAuth } from '../../contexts/AuthContext';

export const InboxPanel: React.FC = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    const { messages: data } = await getMyReceivedMessages();
    setMessages(data || []);
    setLoading(false);
  };

  const handleSelectMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    
    // Marcar como leído si no lo está
    if (!message.is_read) {
      await markMessageAsRead(message.id);
      // Actualizar el estado local
      setMessages(prev =>
        prev.map(m => (m.id === message.id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m))
      );
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return !m.is_read;
    return true;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  // Verificar suscripción activa
  const hasActiveSubscription = profile?.subscription_status === 'active';

  if (!hasActiveSubscription) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-8 text-center">
          <svg
            className="w-16 h-16 text-yellow-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600 mb-4">
            Tu suscripción ha expirado. Renueva tu membresía Premium para acceder al inbox de mensajes.
          </p>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Renovar Suscripción
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Inbox</h1>
              <p className="text-green-100">
                Mensajes de tus avisos publicados
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{messages.length}</div>
              <div className="text-sm text-green-100">Total de mensajes</div>
              {unreadCount > 0 && (
                <div className="mt-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block">
                  {unreadCount} sin leer
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            No leídos ({unreadCount})
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando mensajes...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No hay mensajes
            </h3>
            <p className="text-gray-600">
              {filter === 'unread'
                ? 'No tienes mensajes sin leer'
                : 'Aún no has recibido consultas sobre tus avisos'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 divide-x">
            {/* Lista de mensajes */}
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredMessages.map(message => (
                <div
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !message.is_read ? 'bg-green-50' : ''
                  } ${
                    selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {message.sender_name}
                      {!message.is_read && (
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {message.sender_email}
                  </div>
                  <div className="text-sm text-gray-800 line-clamp-2">
                    {message.message}
                  </div>
                  {message.ads && (
                    <div className="text-xs text-gray-500 mt-2">
                      Aviso: {message.ads.title}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Detalle del mensaje */}
            <div className="p-6 bg-gray-50 max-h-[600px] overflow-y-auto">
              {selectedMessage ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {selectedMessage.sender_name}{' '}
                      {selectedMessage.sender_last_name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${selectedMessage.sender_email}`} className="text-green-600 hover:underline">
                          {selectedMessage.sender_email}
                        </a>
                      </div>
                      {selectedMessage.sender_phone && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <a href={`tel:${selectedMessage.sender_phone}`} className="text-green-600 hover:underline">
                            {selectedMessage.sender_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedMessage.ads && (
                    <div className="mb-4 p-3 bg-white rounded-lg border">
                      <div className="text-xs text-gray-500 mb-1">
                        Referencia al aviso:
                      </div>
                      <div className="font-semibold text-gray-900">
                        {selectedMessage.ads.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedMessage.ads.category} {selectedMessage.ads.subcategory && `> ${selectedMessage.ads.subcategory}`}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">
                      Recibido: {new Date(selectedMessage.created_at).toLocaleString('es-AR')}
                    </div>
                    {selectedMessage.read_at && (
                      <div className="text-xs text-gray-500">
                        Leído: {new Date(selectedMessage.read_at).toLocaleString('es-AR')}
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Mensaje:
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  Selecciona un mensaje para ver los detalles
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
