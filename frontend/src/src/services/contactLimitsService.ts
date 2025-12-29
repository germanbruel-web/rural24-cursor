import { supabase } from './supabaseClient';

// ================================================
// TIPOS
// ================================================

export interface ContactLimits {
  maxReceived: number | null; // null = ilimitado
  maxSent: number | null; // null = ilimitado
  currentReceived: number;
  currentSent: number;
  canReceiveMore: boolean;
  canSendMore: boolean;
  planName: string;
}

export interface ContactLimitWarning {
  type: 'info' | 'warning' | 'blocked';
  message: string;
  percentage: number; // 0-100
  title?: string;
  action?: string;
}

// ================================================
// FUNCIONES
// ================================================

/**
 * Obtener límites de contacto del usuario
 * Consulta directamente la función SQL get_user_contact_limits
 */
export async function getUserContactLimits(userId?: string): Promise<ContactLimits> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  
  if (!uid) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .rpc('get_user_contact_limits', { user_uuid: uid })
    .single();

  if (error) {
    console.error('❌ Error getting contact limits:', error);
    throw error;
  }

  return {
    maxReceived: data.max_received,
    maxSent: data.max_sent,
    currentReceived: data.current_received,
    currentSent: data.current_sent,
    canReceiveMore: data.can_receive_more,
    canSendMore: data.can_send_more,
    planName: data.plan_name,
  };
}

/**
 * Verificar si un usuario puede enviar más contactos
 */
export async function canUserSendContact(userId?: string): Promise<boolean> {
  try {
    const limits = await getUserContactLimits(userId);
    return limits.canSendMore;
  } catch (error) {
    console.error('❌ Error checking if user can send contact:', error);
    return false;
  }
}

/**
 * Obtener warnings de límites para mostrar en UI
 * Retorna advertencias progresivas según el uso
 */
export function getContactLimitWarnings(limits: ContactLimits): ContactLimitWarning[] {
  const warnings: ContactLimitWarning[] = [];
  
  // Solo generar warnings si hay límite definido
  if (limits.maxSent !== null) {
    const percentage = (limits.currentSent / limits.maxSent) * 100;
    
    if (percentage >= 100) {
      // Límite alcanzado - BLOQUEADO
      warnings.push({
        type: 'blocked',
        title: '🚫 Límite Alcanzado',
        message: `Alcanzaste el límite de contactos enviados (${limits.currentSent}/${limits.maxSent}). Actualiza a Premium para contactos ilimitados.`,
        percentage: 100,
        action: 'Actualizar a Premium'
      });
    } else if (percentage >= 75) {
      // Último contacto disponible - WARNING
      const remaining = limits.maxSent - limits.currentSent;
      warnings.push({
        type: 'warning',
        title: '⚠️ Límite Próximo',
        message: `Te queda${remaining > 1 ? 'n' : ''} ${remaining} contacto${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''} de ${limits.maxSent}.`,
        percentage,
        action: 'Ver Planes Premium'
      });
    }
  }
  
  return warnings;
}

/**
 * Obtener texto descriptivo del estado de límites
 */
export function getContactLimitStatus(limits: ContactLimits): string {
  if (limits.maxSent === null) {
    return 'Contactos ilimitados';
  }
  
  return `${limits.currentSent} de ${limits.maxSent} contactos enviados`;
}

/**
 * Cache de límites en localStorage (5 minutos de TTL)
 */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface CachedLimits {
  data: ContactLimits;
  timestamp: number;
}

export function getCachedLimits(userId: string): ContactLimits | null {
  try {
    const cached = localStorage.getItem(`contact_limits_${userId}`);
    if (!cached) return null;
    
    const parsed: CachedLimits = JSON.parse(cached);
    
    // Verificar si el cache expiró
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(`contact_limits_${userId}`);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('Error reading cached limits:', error);
    return null;
  }
}

export function setCachedLimits(userId: string, limits: ContactLimits): void {
  try {
    const cached: CachedLimits = {
      data: limits,
      timestamp: Date.now()
    };
    localStorage.setItem(`contact_limits_${userId}`, JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching limits:', error);
  }
}

export function clearCachedLimits(userId: string): void {
  localStorage.removeItem(`contact_limits_${userId}`);
}
