/**
 * chatService.ts — Sistema de Chat P2P Rural24
 *
 * Cada conversación nace de un aviso (ad_id).
 * Un comprador solo puede abrir UN canal por aviso.
 * Plan FREE: máximo 3 canales activos como buyer.
 */

import { supabase } from './supabaseClient';

// ── Tipos ────────────────────────────────────────────────────

export type ChatChannelStatus = 'active' | 'archived' | 'blocked';

export interface ChatChannel {
  id: string;
  ad_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  last_message_at: string;
  last_message_preview?: string;
  buyer_unread: number;
  seller_unread: number;
  status: ChatChannelStatus;
  // Joined
  ad?: { id: string; title: string; images?: any[]; price?: number; currency?: string };
  buyer?: { id: string; full_name?: string };
  seller?: { id: string; full_name?: string };
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  was_masked: boolean;
  created_at: string;
}

export type GetOrCreateError =
  | 'AUTH_REQUIRED'
  | 'SELF_CONTACT'
  | 'PLAN_LIMIT_REACHED'
  | 'UNKNOWN';

export type GetOrCreateResult =
  | { success: true; channel: ChatChannel; isNew: boolean }
  | { success: false; error: GetOrCreateError; message: string };

// ── Canal ────────────────────────────────────────────────────

export async function getOrCreateChannel(
  adId: string,
  sellerId: string
): Promise<GetOrCreateResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'AUTH_REQUIRED', message: 'Iniciá sesión para contactar' };
  }
  if (user.id === sellerId) {
    return { success: false, error: 'SELF_CONTACT', message: 'No podés contactarte a vos mismo' };
  }

  const { data, error } = await supabase.rpc('get_or_create_chat_channel', {
    p_ad_id: adId,
    p_buyer_id: user.id,
    p_seller_id: sellerId,
  });

  if (error) {
    if (error.message?.includes('PLAN_LIMIT_REACHED')) {
      return {
        success: false,
        error: 'PLAN_LIMIT_REACHED',
        message: 'Alcanzaste el límite de 3 conversaciones activas. Pasá a Premium para ilimitadas.',
      };
    }
    if (error.message?.includes('SELF_CONTACT')) {
      return { success: false, error: 'SELF_CONTACT', message: 'No podés contactarte a vos mismo' };
    }
    return { success: false, error: 'UNKNOWN', message: error.message };
  }

  return {
    success: true,
    channel: data.channel as ChatChannel,
    isNew: data.is_new as boolean,
  };
}

export async function getMyChannels(): Promise<ChatChannel[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('chat_channels')
    .select(`
      *,
      ad:ads(id, title, images, price, currency),
      buyer:users!chat_channels_buyer_id_fkey(id, full_name),
      seller:users!chat_channels_seller_id_fkey(id, full_name)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false });

  return (data as ChatChannel[]) || [];
}

// ── Mensajes ─────────────────────────────────────────────────

export async function getChannelMessages(channelId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true });

  return (data as ChatMessage[]) || [];
}

export async function sendMessage(
  channelId: string,
  message: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ channel_id: channelId, sender_id: user.id, message: message.trim() })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, message: data as ChatMessage };
}

export async function markChannelRead(channelId: string): Promise<void> {
  await supabase.rpc('mark_channel_read', { p_channel_id: channelId });
}

// ── Badge ────────────────────────────────────────────────────

export async function getTotalUnreadCount(): Promise<number> {
  const { data } = await supabase.rpc('get_user_chat_unread_count');
  return (data as number) ?? 0;
}
