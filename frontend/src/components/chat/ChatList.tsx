/**
 * ChatList — Inbox de conversaciones P2P
 *
 * Reemplaza MessagesPanel. Muestra canales activos del usuario
 * ordenados por último mensaje. Click → abre ChatWindow.
 */

import React, { useEffect, useState } from 'react';
import { MessageCircle, Loader2, Search } from 'lucide-react';
import { getMyChannels, type ChatChannel } from '../../services/chatService';
import { ChatWindow } from './ChatWindow';
import { getFirstImage } from '../../utils/imageHelpers';
import { formatRelativeDate } from '../../utils/formatters';

interface ChatListProps {
  currentUserId: string;
  onClose?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ currentUserId }) => {
  const [channels, setChannels]           = useState<ChatChannel[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [openChannel, setOpenChannel]     = useState<ChatChannel | null>(null);

  useEffect(() => {
    getMyChannels().then((data) => {
      setChannels(data);
      setLoading(false);
    });
  }, []);

  const filtered = channels.filter((ch) => {
    const adTitle   = ch.ad?.title?.toLowerCase() || '';
    const otherName = (currentUserId === ch.buyer_id
      ? ch.seller?.full_name
      : ch.buyer?.full_name
    )?.toLowerCase() || '';
    const q = search.toLowerCase();
    return !q || adTitle.includes(q) || otherName.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Mensajes</h1>
        {channels.length > 0 && (
          <span className="text-xs text-gray-400">{channels.length} conversaciones</span>
        )}
      </div>

      {/* Buscador */}
      {channels.length > 4 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <MessageCircle className="w-10 h-10 text-gray-200 mx-auto" />
          <p className="text-sm font-medium text-gray-500">
            {search ? 'Sin resultados' : 'No tenés conversaciones aún'}
          </p>
          {!search && (
            <p className="text-xs text-gray-400">
              Tus chats con vendedores aparecerán acá
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((ch) => {
            const isBuyer   = currentUserId === ch.buyer_id;
            const other     = isBuyer ? ch.seller : ch.buyer;
            const unread    = isBuyer ? ch.buyer_unread : ch.seller_unread;
            const adImage   = getFirstImage(ch.ad?.images || []);

            return (
              <button
                key={ch.id}
                onClick={() => setOpenChannel(ch)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
              >
                {/* Avatar / imagen del aviso */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {adImage ? (
                    <img src={adImage} alt={ch.ad?.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {other?.full_name || 'Usuario'}
                    </span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {formatRelativeDate(ch.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {ch.ad?.title || 'Aviso'}
                  </p>
                  <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                    {ch.last_message_preview || 'Sin mensajes'}
                  </p>
                </div>

                {/* Badge no leídos */}
                {unread > 0 && (
                  <div className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center bg-brand-600 text-white text-[10px] font-bold rounded-full px-1.5">
                    {unread > 9 ? '9+' : unread}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ChatWindow overlay */}
      {openChannel && (
        <ChatWindow
          channel={openChannel}
          currentUserId={currentUserId}
          onClose={() => setOpenChannel(null)}
        />
      )}
    </div>
  );
};

export default ChatList;
