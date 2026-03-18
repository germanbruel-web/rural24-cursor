/**
 * useChatBadge — Contador de mensajes no leídos con Realtime
 *
 * Suscripción a chat_channels para detectar cambios en
 * buyer_unread / seller_unread del usuario actual.
 * Cleanup automático al desmontar.
 */

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getTotalUnreadCount } from '../services/chatService';

export function useChatBadge(userId: string | null): number {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }

    // Carga inicial
    getTotalUnreadCount().then(setUnread);

    // Realtime: escuchar cambios en chat_channels donde es participante
    const channel = supabase
      .channel(`chat_badge:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_channels',
        },
        () => {
          // Recalcular al detectar cualquier cambio en canales
          getTotalUnreadCount().then(setUnread);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const msg = payload.new as { sender_id: string };
          // Solo actualizar si el mensaje es de otro usuario
          if (msg.sender_id !== userId) {
            getTotalUnreadCount().then(setUnread);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unread;
}
