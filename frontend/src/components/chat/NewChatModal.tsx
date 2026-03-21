/**
 * NewChatModal — Modal de primer mensaje al iniciar conversación
 *
 * Muestra mensaje predefinido editable. Al confirmar:
 *   1. Crea el canal (getOrCreateChannel)
 *   2. Envía el primer mensaje
 *   3. Abre ChatWindow
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { getOrCreateChannel, sendMessage, type ChatChannel } from '../../services/chatService';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useBodyOverflow } from '../../hooks/useBodyOverflow';

interface NewChatModalProps {
  adId: string;
  adTitle: string;
  sellerId: string;
  sellerName: string;
  onSuccess: (channel: ChatChannel) => void;
  onClose: () => void;
  onPlanLimit: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  adId,
  adTitle,
  sellerId,
  sellerName,
  onSuccess,
  onClose,
  onPlanLimit,
}) => {
  const DEFAULT_MSG = 'Hola, me interesa. ¿Está disponible?';
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useBodyOverflow(true);
  useEscapeKey(onClose);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);

    const result = await getOrCreateChannel(adId, sellerId);

    if (result.success === false) {
      setLoading(false);
      if (result.error === 'PLAN_LIMIT_REACHED') {
        onClose();
        onPlanLimit();
        return;
      }
      setError(result.message);
      return;
    }

    // Enviar primer mensaje
    const msgResult = await sendMessage(result.channel.id, message);
    setLoading(false);

    if (!msgResult.success) {
      setError('No se pudo enviar el mensaje. Intentá de nuevo.');
      return;
    }

    onSuccess(result.channel);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Nuevo mensaje a ${sellerName}`}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-brand-600" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nuevo mensaje</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              Para: <span className="text-brand-700">{sellerName}</span>
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{adTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-gray-50"
            placeholder="Escribí tu mensaje..."
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              : <><Send className="w-4 h-4" /> Enviar mensaje</>
            }
          </button>
        </form>
      </div>
    </>
  );
};

export default NewChatModal;
