/**
 * ChatWindow — Ventana de chat P2P
 *
 * Mobile:  fixed inset-0 z-50 (pantalla completa)
 * Desktop: fixed bottom-0 right-4 w-[380px] h-[560px] (widget flotante)
 *
 * Usa useMessages para realtime + optimistic UI.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Send, ChevronLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useMessages } from '../../hooks/useMessages';
import type { ChatChannel } from '../../services/chatService';
import { formatMessageTime, formatMessageDate } from '../../utils/formatters';

interface ChatWindowProps {
  channel: ChatChannel;
  currentUserId: string;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  channel,
  currentUserId,
  onClose,
}) => {
  const { messages, loading, sending, send } = useMessages(channel.id, currentUserId);
  const [input, setInput]         = useState('');
  const [sensitiveWarning, setSensitiveWarning] = useState(false);
  const messagesEndRef             = useRef<HTMLDivElement>(null);
  const inputRef                   = useRef<HTMLTextAreaElement>(null);

  const SENSITIVE_RE = [
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    /(\+?54[\s\-.]?)?(\(?\d{2,4}\)?)[\s\-.]?\d{4}[\s\-.]?\d{4}/,
    /https?:\/\/\S+/i,
    /\b(whatsapp|wsp|telegram|instagram|facebook|mercadolibre|mercadopago|tiktok|signal)\b/i,
  ];

  const hasSensitive = (text: string) => SENSITIVE_RE.some((re) => re.test(text));

  const isBuyer      = currentUserId === channel.buyer_id;
  const otherUser    = isBuyer ? channel.seller : channel.buyer;
  const otherName    = otherUser?.full_name || 'Usuario';
  const adTitle      = channel.ad?.title || 'Aviso';

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input al abrir
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setSensitiveWarning(hasSensitive(e.target.value));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSensitiveWarning(false);
    await send(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Agrupar mensajes por día
  const grouped = messages.reduce<{ date: string; msgs: typeof messages }[]>((acc, msg) => {
    const day = msg.created_at.slice(0, 10);
    const last = acc[acc.length - 1];
    if (last?.date === day) {
      last.msgs.push(msg);
    } else {
      acc.push({ date: day, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <>
      {/* Backdrop mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Ventana */}
      <div
        role="dialog"
        aria-label={`Chat con ${otherName}`}
        className={[
          'fixed z-50 flex flex-col bg-white',
          // Mobile: pantalla completa
          'inset-0',
          // Desktop: widget flotante abajo-derecha
          'lg:inset-auto lg:bottom-0 lg:right-4 lg:w-[380px] lg:h-[560px]',
          'lg:rounded-t-2xl lg:shadow-2xl lg:border lg:border-gray-200',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white lg:rounded-t-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 -ml-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors"
            aria-label="Volver"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{otherName}</p>
            <p className="text-xs text-gray-400 truncate">{adTitle}</p>
          </div>

          <button
            onClick={onClose}
            className="hidden lg:flex p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <p className="text-sm font-medium text-gray-500">Sé el primero en escribir</p>
              <p className="text-xs text-gray-400">Los mensajes son privados entre vos y {otherName}</p>
            </div>
          ) : (
            grouped.map(({ date, msgs }) => (
              <div key={date}>
                {/* Separador de día */}
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-medium px-2">
                    {formatMessageDate(date + 'T00:00:00')}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {msgs.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  const isOptimistic = msg.id.startsWith('opt_');
                  return (
                    <div
                      key={msg.id}
                      className={`flex mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={[
                          'max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                          isOwn
                            ? 'bg-brand-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm shadow-sm',
                          isOptimistic ? 'opacity-70' : '',
                        ].join(' ')}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-[10px] mt-0.5 text-right ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                          {formatMessageTime(msg.created_at)}
                          {isOptimistic && ' · enviando'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {sensitiveWarning && (
            <div className="flex items-start gap-2 px-3 py-2 mb-1 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Tu mensaje contiene datos de contacto que serán ocultados automáticamente.</span>
            </div>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribí un mensaje..."
            className="flex-1 resize-none px-3 py-2.5 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 max-h-[120px] overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 text-white transition-colors"
            aria-label="Enviar"
          >
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;
