/**
 * useMessages — Mensajes de un canal con suscripción Realtime
 *
 * - Carga inicial de mensajes
 * - Suscripción Supabase Realtime para nuevos mensajes
 * - Optimistic UI: mensaje aparece inmediatamente antes del ACK de DB
 * - Marca el canal como leído al abrir
 * - Cleanup automático al desmontar
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  getChannelMessages,
  sendMessage,
  markChannelRead,
  type ChatMessage,
} from '../services/chatService';

interface UseMessagesReturn {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  send: (text: string) => Promise<boolean>;
}

export function useMessages(
  channelId: string | null,
  currentUserId: string | null
): UseMessagesReturn {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const optimisticIds             = useRef<Set<string>>(new Set());

  // Carga inicial + mark read
  useEffect(() => {
    if (!channelId) return;
    setLoading(true);

    getChannelMessages(channelId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    markChannelRead(channelId);
  }, [channelId]);

  // Realtime: escuchar INSERT en chat_messages del canal
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`chat_messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;

          // Si ya existe (optimistic), reemplazarlo con el real
          setMessages((prev) => {
            const alreadyExists = prev.some((m) => m.id === incoming.id);
            if (alreadyExists) return prev;

            // Remover optimistic duplicado por sender+message+tiempo (~2s)
            const filtered = prev.filter((m) => {
              if (!optimisticIds.current.has(m.id)) return true;
              const sameContent = m.message === incoming.message && m.sender_id === incoming.sender_id;
              const timeDiff = Math.abs(
                new Date(m.created_at).getTime() - new Date(incoming.created_at).getTime()
              );
              if (sameContent && timeDiff < 3000) {
                optimisticIds.current.delete(m.id);
                return false;
              }
              return true;
            });

            return [...filtered, incoming];
          });

          // Marcar leído si el mensaje es del otro usuario
          if (incoming.sender_id !== currentUserId) {
            markChannelRead(channelId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, currentUserId]);

  // Envío con optimistic UI
  const send = useCallback(async (text: string): Promise<boolean> => {
    if (!channelId || !currentUserId || !text.trim()) return false;

    const optimisticId = `opt_${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      channel_id: channelId,
      sender_id: currentUserId,
      message: text.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    optimisticIds.current.add(optimisticId);
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);

    const result = await sendMessage(channelId, text);
    setSending(false);

    if (!result.success) {
      // Revertir optimistic en caso de error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      optimisticIds.current.delete(optimisticId);
      return false;
    }

    return true;
  }, [channelId, currentUserId]);

  return { messages, loading, sending, send };
}
