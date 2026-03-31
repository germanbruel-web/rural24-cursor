import { supabase } from './supabaseClient';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  read_at: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

/** Obtener notificaciones del usuario (últimas 50) */
export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

/** Contar no-leídas (para badge) */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count ?? 0;
}

/** Marcar como leídas (todas o específicas) */
export async function markAsRead(userId: string, ids?: string[]): Promise<void> {
  const { error } = await supabase.rpc('mark_notifications_read', {
    p_user_id: userId,
    p_ids: ids ?? null,
  });
  if (error) throw error;
}

/** Eliminar una notificación específica */
export async function deleteNotification(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Suscribirse a notificaciones nuevas via Realtime */
export function subscribeToNotifications(
  userId: string,
  onNew: (n: Notification) => void
) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new as Notification)
    )
    .subscribe();
}

/** Insertar notificación desde frontend (solo para eventos síncronos del usuario) */
export async function insertNotification(
  userId: string,
  type: string,
  title: string,
  body?: string,
  data?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body: body ?? null,
    data: data ?? null,
  });
  if (error) throw error;
}

/** Ícono y color según tipo */
export function getNotificationMeta(type: string): { icon: string; color: string } {
  const map: Record<string, { icon: string; color: string }> = {
    destacado_activado:    { icon: '⭐', color: 'text-amber-500' },
    destacado_por_vencer:  { icon: '⏰', color: 'text-orange-500' },
    aviso_publicado:       { icon: '✅', color: 'text-brand-600' },
    aviso_expirado:        { icon: '❌', color: 'text-red-500' },
    nuevo_contacto:        { icon: '💬', color: 'text-blue-500' },
    nuevo_mensaje_chat:    { icon: '💬', color: 'text-brand-600' },
    cupon_canjeado:        { icon: '🎁', color: 'text-purple-500' },
    nuevo_aviso_favorito:  { icon: '❤️', color: 'text-rose-500' },
  };
  return map[type] ?? { icon: '🔔', color: 'text-gray-500' };
}

/** Formatear tiempo relativo */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Ahora';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
}
