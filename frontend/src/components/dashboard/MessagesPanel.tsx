import React, { useEffect, useState } from 'react';
import { Inbox, Send, MessageCircle, Mail, Phone, Calendar, Eye, EyeOff, AlertCircle, MapPin } from 'lucide-react';
import { getMyReceivedMessages, getMySentMessages, markMessageAsRead } from '../../services/contactService';
import { getUserContactLimits, type ContactLimits } from '../../services/contactLimitsService';
import type { ContactMessage } from '../../../types';
import { useAuth } from '../../contexts/AuthContext';

type TabType = 'received' | 'sent';

export const MessagesPanel: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [receivedMessages, setReceivedMessages] = useState<ContactMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [limits, setLimits] = useState<ContactLimits | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar mensajes recibidos y enviados en paralelo
      const [received, sent] = await Promise.all([
        getMyReceivedMessages(),
        getMySentMessages()
      ]);
      
      setReceivedMessages(received.messages || []);
      setSentMessages(sent.messages || []);

      // Cargar límites si el usuario está autenticado
      if (profile?.id) {
        const userLimits = await getUserContactLimits(profile.id);
        setLimits(userLimits);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    
    // Marcar como leído solo si es un mensaje recibido y no está leído
    if (activeTab === 'received' && !message.is_read) {
      await markMessageAsRead(message.id);
      setReceivedMessages(prev =>
        prev.map(m => (m.id === message.id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m))
      );
    }
  };

  const currentMessages = activeTab === 'received' ? receivedMessages : sentMessages;
  const filteredMessages = currentMessages.filter(m => {
    if (activeTab === 'sent') return true; // Enviados no tienen estado "leído"
    if (filter === 'unread') return !m.is_read;
    return true;
  });

  const unreadCount = receivedMessages.filter(m => !m.is_read).length;

  // Límites y estadísticas
  const receivedCount = receivedMessages.length;
  const sentCount = sentMessages.length;
  const canReceiveMore = limits?.canReceiveMore ?? true;
  const canSendMore = limits?.canSendMore ?? true;

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header con estadísticas */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                <MessageCircle className="w-8 h-8" />
                Centro de Mensajes
              </h1>
              <p className="text-blue-100">Gestiona tus conversaciones y consultas</p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{receivedCount}</div>
                  <div className="text-sm text-blue-100">Recibidos</div>
                  {unreadCount > 0 && (
                    <div className="text-xs font-bold text-yellow-300">{unreadCount} sin leer</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{sentCount}</div>
                  <div className="text-sm text-blue-100">Enviados</div>
                  {limits && (
                    <div className="text-xs text-blue-100">
                      {limits.maxSent === 999999 ? 'Ilimitados' : `${limits.currentSent}/${limits.maxSent}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {limits?.planName === 'free' ? 'Plan Gratuito' :
                     limits?.planName === 'premium_empresa' ? 'Premium Empresa' :
                     limits?.planName === 'premium_particular' ? 'Premium Particular' : 'Plan Básico'}
                  </div>
                  <div className="text-sm text-blue-100">
                    {canSendMore ? '✓ Puedes enviar mensajes' : '⚠ Límite alcanzado'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('received');
                setSelectedMessage(null);
                setFilter('all');
              }}
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'received'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Inbox className="w-5 h-5" />
              Recibidos ({receivedCount})
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('sent');
                setSelectedMessage(null);
              }}
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'sent'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Send className="w-5 h-5" />
              Enviados ({sentCount})
            </button>
          </div>
        </div>

        {/* Filtros (solo para recibidos) */}
        {activeTab === 'received' && (
          <div className="p-4 bg-gray-50 border-b flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              No leídos {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mensajes...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay mensajes</h3>
            <p className="text-gray-600">
              {activeTab === 'received'
                ? filter === 'unread'
                  ? 'No tienes mensajes sin leer'
                  : 'Aún no has recibido consultas sobre tus avisos'
                : 'No has enviado ningún mensaje todavía'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 divide-x min-h-[600px]">
            {/* Lista de mensajes (2/5) */}
            <div className="md:col-span-2 divide-y max-h-[600px] overflow-y-auto">
              {filteredMessages.map(message => {
                // Obtener primera imagen del aviso
                const adImage = message.ads?.images?.[0]?.url || message.ads?.image_urls?.[0] || null;
                
                return (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                      !message.is_read && activeTab === 'received' ? 'bg-blue-50' : ''
                    } ${
                      selectedMessage?.id === message.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {activeTab === 'received' ? message.sender_name : 'Tu consulta'}
                        {!message.is_read && activeTab === 'received' && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {new Date(message.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1 truncate">
                      {message.sender_email}
                    </div>
                    <div className="text-sm text-gray-800 line-clamp-2 mb-2">
                      {message.message}
                    </div>
                    
                    {/* Miniatura del aviso */}
                    {message.ads && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-gray-100 rounded-lg">
                        {adImage && (
                          <img 
                            src={adImage} 
                            alt={message.ads.title}
                            className="w-12 h-12 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {message.ads.title}
                          </div>
                          {message.ads.price && (
                            <div className="text-xs font-bold text-brand-600">
                              ${message.ads.price.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Detalle del mensaje (3/5) */}
            <div className="md:col-span-3 p-6 bg-gray-50 max-h-[600px] overflow-y-auto">
              {selectedMessage ? (
                <div className="space-y-4">
                  {/* Header del mensaje */}
                  <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {activeTab === 'received' 
                            ? `De: ${selectedMessage.sender_name}` 
                            : `Consulta enviada`
                          }
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <a
                              href={`mailto:${selectedMessage.sender_email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {selectedMessage.sender_email}
                            </a>
                          </div>
                          {selectedMessage.sender_phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <a
                                href={`tel:${selectedMessage.sender_phone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {selectedMessage.sender_phone}
                              </a>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(selectedMessage.created_at).toLocaleString('es-AR')}
                          </div>
                          {selectedMessage.is_read && selectedMessage.read_at && activeTab === 'received' && (
                            <div className="flex items-center gap-2 text-brand-600">
                              <Eye className="w-4 h-4" />
                              Leído: {new Date(selectedMessage.read_at).toLocaleString('es-AR')}
                            </div>
                          )}
                        </div>
                      </div>
                      {activeTab === 'received' && !selectedMessage.is_read && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          NUEVO
                        </span>
                      )}
                    </div>

                    {/* Aviso relacionado */}
                    {selectedMessage.ads && (
                      <div className="border-t pt-4">
                        <div className="text-xs font-semibold text-gray-500 mb-2">
                          {activeTab === 'received' ? 'Consulta sobre tu aviso:' : 'Tu consulta sobre:'}
                        </div>
                        <a
                          href={`#/ad/${selectedMessage.ad_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border-2 border-transparent hover:border-blue-500"
                        >
                          <div className="flex items-start gap-4">
                            {/* Imagen del aviso */}
                            {(selectedMessage.ads.images?.[0]?.url || selectedMessage.ads.image_urls?.[0]) && (
                              <img
                                src={selectedMessage.ads.images?.[0]?.url || selectedMessage.ads.image_urls?.[0]}
                                alt={selectedMessage.ads.title}
                                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                {selectedMessage.ads.title}
                              </div>
                              {selectedMessage.ads.price && (
                                <div className="text-xl font-bold text-brand-600 mb-1">
                                  ${selectedMessage.ads.price.toLocaleString()}
                                </div>
                              )}
                              {selectedMessage.ads.location && (
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {selectedMessage.ads.location}
                                </div>
                              )}
                              <div className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
                                Ver aviso completo →
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Mensaje */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Mensaje:
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.message}
                    </div>
                  </div>

                  {/* Acciones rápidas (solo para recibidos) */}
                  {activeTab === 'received' && (
                    <div className="flex gap-3">
                      <a
                        href={`mailto:${selectedMessage.sender_email}?subject=Re: ${selectedMessage.ads?.title}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        Responder por Email
                      </a>
                      {selectedMessage.sender_phone && (
                        <a
                          href={`https://wa.me/${selectedMessage.sender_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${selectedMessage.sender_name}, te respondo sobre: ${selectedMessage.ads?.title}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-4 rounded-lg hover:bg-brand-500 font-medium transition-colors"
                        >
                          <Phone className="w-5 h-5" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-20">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">Selecciona un mensaje para ver los detalles</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
