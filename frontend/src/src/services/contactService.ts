import { supabase } from './supabaseClient';
import type { ContactMessage, CreateContactMessageInput } from '../../types';
import { getUserContactLimits, canUserSendContact, clearCachedLimits, type ContactLimits } from './contactLimitsService';

/**
 * Verificar cuántos contactos ha RECIBIDO un vendedor (límite FREE: 5)
 */
export async function checkSellerContactLimit(adOwnerId: string): Promise<{
  receivedCount: number;
  canReceiveMore: boolean;
  isAtLimit: boolean;
}> {
  try {
    const { count, error } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('ad_owner_id', adOwnerId);

    if (error) throw error;

    const receivedCount = count || 0;
    
    return {
      receivedCount,
      canReceiveMore: receivedCount < 5,
      isAtLimit: receivedCount >= 5
    };
  } catch (error) {
    console.error('❌ Error checking seller limit:', error);
    return { receivedCount: 0, canReceiveMore: true, isAtLimit: false };
  }
}

/**
 * Obtener contador de contactos recibidos del usuario actual
 */
export async function getMyReceivedContactsCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('ad_owner_id', user.id);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('❌ Error getting received contacts count:', error);
    return 0;
  }
}

/**
 * 📤 Obtener contador de contactos ENVIADOS por el usuario actual
 * (para rastrear límites futuros)
 */
export async function getMySentContactsCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_user_id', user.id);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('❌ Error getting sent contacts count:', error);
    return 0;
  }
}

/**
 * 🔐 Enviar mensaje de contacto (REQUIERE AUTENTICACIÓN)
 * Valida límites dinámicamente desde subscription_plans
 */
export async function sendContactMessage(
  input: CreateContactMessageInput
): Promise<{ 
  success: boolean; 
  contactId?: string;
  error?: { 
    code: 'AUTH_REQUIRED' | 'EMAIL_NOT_VERIFIED' | 'LIMIT_REACHED' | 'INVALID_AD' | 'VALIDATION_ERROR' | 'UNKNOWN';
    message: string;
    details?: any;
  };
  limits?: ContactLimits;
}> {
  try {
    // 1. VALIDAR AUTENTICACIÓN
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        success: false, 
        error: { 
          code: 'AUTH_REQUIRED', 
          message: 'Debes iniciar sesión para enviar mensajes' 
        } 
      };
    }

    // 2. OBTENER PERFIL PARA VERIFICAR EMAIL
    const { data: profile } = await supabase
      .from('users')
      .select('email_verified')
      .eq('id', user.id)
      .single();

    if (!profile?.email_verified) {
      return { 
        success: false, 
        error: { 
          code: 'EMAIL_NOT_VERIFIED', 
          message: 'Debes verificar tu email antes de contactar' 
        } 
      };
    }

    // 3. VERIFICAR LÍMITES ANTES DE ENVIAR
    const canSend = await canUserSendContact(user.id);
    if (!canSend) {
      const limits = await getUserContactLimits(user.id);
      return {
        success: false,
        error: { 
          code: 'LIMIT_REACHED', 
          message: `Alcanzaste el límite de contactos enviados (${limits.currentSent}/${limits.maxSent}). Actualiza a Premium para contactos ilimitados.`,
          details: {
            currentSent: limits.currentSent,
            maxSent: limits.maxSent
          }
        }
      };
    }

    // 4. VALIDAR QUE sender_user_id coincida
    if (input.sender_user_id !== user.id) {
      return { 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Usuario no autorizado' 
        } 
      };
    }

    // 5. ENVIAR MENSAJE
    const messageData = {
      ad_id: input.ad_id,
      ad_owner_id: input.ad_owner_id,
      sender_user_id: input.sender_user_id,
      sender_name: input.sender_name,
      sender_last_name: input.sender_last_name,
      sender_phone: input.sender_phone,
      sender_email: input.sender_email,
      message: input.message,
    };
    
    const { data, error } = await supabase
      .from('contact_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error sending contact:', error);
      
      // Parsear errores del backend (triggers)
      if (error.message?.includes('LIMIT_REACHED')) {
        return { 
          success: false, 
          error: { 
            code: 'LIMIT_REACHED', 
            message: error.message 
          } 
        };
      }
      
      return { 
        success: false, 
        error: { 
          code: 'UNKNOWN', 
          message: error.message 
        } 
      };
    }

    // 6. LIMPIAR CACHE Y OBTENER LÍMITES ACTUALIZADOS
    clearCachedLimits(user.id);
    const updatedLimits = await getUserContactLimits(user.id);

    console.log('✅ Mensaje enviado correctamente');
    return { 
      success: true, 
      contactId: data.id,
      limits: updatedLimits 
    };
    
  } catch (error: any) {
    console.error('❌ [ERROR] Exception sending contact message:', error);
    
    // Parsear excepciones del backend
    if (error.message?.includes('AUTH_REQUIRED')) {
      return { success: false, error: { code: 'AUTH_REQUIRED', message: error.message } };
    }
    if (error.message?.includes('EMAIL_NOT_VERIFIED')) {
      return { success: false, error: { code: 'EMAIL_NOT_VERIFIED', message: error.message } };
    }
    if (error.message?.includes('LIMIT_REACHED')) {
      return { success: false, error: { code: 'LIMIT_REACHED', message: error.message } };
    }
    
    return { 
      success: false, 
      error: { 
        code: 'UNKNOWN', 
        message: 'Error al enviar el mensaje' 
      } 
    };
  }
}

/**
 * Obtener mensajes recibidos por el usuario actual (para dashboard)
 */
export async function getMyReceivedMessages(): Promise<{
  messages: ContactMessage[];
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { messages: [], error: 'No autenticado' };

    console.log('🔍 Fetching received messages for user:', user.id);

    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('ad_owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching received messages:', error);
      return { messages: [], error: error.message };
    }

    // Enriquecer con datos de avisos
    const enrichedMessages = await enrichMessagesWithAds(messages || []);

    console.log('✅ Received messages:', enrichedMessages?.length);
    return { messages: enrichedMessages };
  } catch (error) {
    console.error('❌ Exception fetching messages:', error);
    return { messages: [], error: 'Error al cargar mensajes' };
  }
}

/**
 * LEGACY FUNCTIONS - Mantener por compatibilidad pero deprecadas
 */

export async function markMessageAsRead(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  console.warn('⚠️ markMessageAsRead is deprecated');
  return { success: true };
}

export async function getUnreadMessagesCount(): Promise<{
  count: number;
  error?: string;
}> {
  console.warn('⚠️ getUnreadMessagesCount is deprecated');
  return { count: 0 };
}

export async function getAdMessages(
  adId: string
): Promise<{ messages: ContactMessage[]; error?: string }> {
  console.warn('⚠️ getAdMessages is deprecated');
  return { messages: [] };
}

/** * 🔧 HELPER: Enriquecer mensajes con datos de avisos
 * Hace un query batch para obtener todos los avisos relacionados
 */
async function enrichMessagesWithAds(messages: any[]): Promise<ContactMessage[]> {
  if (!messages || messages.length === 0) return [];

  // Obtener IDs únicos de avisos
  const adIds = [...new Set(messages.map(m => m.ad_id).filter(Boolean))];
  
  if (adIds.length === 0) return messages;

  // Traer avisos en batch
  const { data: ads, error } = await supabase
    .from('ads')
    .select('id, title, price, location, images, image_urls')
    .in('id', adIds);

  if (error) {
    console.error('⚠️ Error fetching ads for messages:', error);
    return messages; // Retornar mensajes sin enriquecer
  }

  // Mapear avisos por ID
  const adsMap = new Map(ads?.map(ad => [ad.id, ad]) || []);

  // Enriquecer mensajes
  return messages.map(msg => ({
    ...msg,
    ads: adsMap.get(msg.ad_id) || null
  }));
}

/** * 📤 Obtener mensajes ENVIADOS por el usuario actual (para dashboard)
 */
export async function getMySentMessages(): Promise<{
  messages: ContactMessage[];
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { messages: [], error: 'No autenticado' };

    console.log('🔍 Fetching sent messages for user:', user.id);

    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('sender_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching sent messages:', error);
      return { messages: [], error: error.message };
    }

    // Enriquecer con datos de avisos
    const enrichedMessages = await enrichMessagesWithAds(messages || []);

    console.log('✅ Sent messages:', enrichedMessages?.length);
    return { messages: enrichedMessages };
  } catch (error) {
    console.error('❌ Exception fetching sent messages:', error);
    return { messages: [], error: 'Error al cargar mensajes enviados' };
  }
}

export async function getReceivedContactsCount(
  userId: string
): Promise<{ count: number; error?: string }> {
  console.warn('⚠️ getReceivedContactsCount is deprecated - use checkSellerContactLimit');
  return { count: 0 };
}

export async function getSentContactsCount(): Promise<{
  count: number;
  canSendMore: boolean;
  error?: string;
}> {
  console.warn('⚠️ getSentContactsCount is deprecated');
  return { count: 0, canSendMore: true };
}

export async function canSendContact(): Promise<{
  canSend: boolean;
  reason?: string;
  sentCount?: number;
}> {
  console.warn('⚠️ canSendContact is deprecated');
  return { canSend: true };
}
