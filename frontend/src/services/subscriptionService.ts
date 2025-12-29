import { supabase } from './supabaseClient';

// ================================================
// TIPOS
// ================================================

export interface SubscriptionPlan {
  id: string;
  name: string; // 'free', 'premium_particular', 'premium_empresa'
  display_name: string;
  max_ads: number;
  max_contacts_received: number | null;
  max_contacts_sent: number | null;
  max_featured_ads: number;
  max_highlighted_ads: number;
  can_publish_immediately: boolean;
  has_inbox: boolean;
  has_analytics: boolean;
  has_priority_support: boolean;
  has_public_profile: boolean;
  has_catalog: boolean;
  has_multiuser: boolean;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  subscription_plan_id: string;
  subscription_status: 'active' | 'inactive' | 'expired' | 'cancelled' | 'pending';
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  subscription_auto_renew: boolean;
  plan?: SubscriptionPlan; // Join con subscription_plans
}

// ================================================
// FUNCIONES
// ================================================

/**
 * Obtener todos los planes de suscripción activos
 */
export async function getAllPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('❌ Error getting plans:', error);
    throw error;
  }

  return data || [];
}

/**
 * Obtener plan específico por nombre
 */
export async function getPlanByName(planName: string): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('name', planName)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`❌ Error getting plan ${planName}:`, error);
    return null;
  }

  return data;
}

/**
 * Obtener suscripción del usuario
 */
export async function getUserSubscription(userId?: string): Promise<UserSubscription | null> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  
  if (!uid) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('users')
    .select(`
      subscription_plan_id,
      subscription_status,
      subscription_started_at,
      subscription_expires_at,
      subscription_auto_renew,
      subscription_plans:subscription_plan_id (*)
    `)
    .eq('id', uid)
    .single();

  if (error) {
    console.error('❌ Error getting user subscription:', error);
    return null;
  }

  if (!data) return null;

  return {
    subscription_plan_id: data.subscription_plan_id,
    subscription_status: data.subscription_status,
    subscription_started_at: data.subscription_started_at,
    subscription_expires_at: data.subscription_expires_at,
    subscription_auto_renew: data.subscription_auto_renew,
    plan: data.subscription_plans as any,
  };
}

/**
 * Actualizar plan del usuario (upgrade/downgrade)
 */
export async function updateUserPlan(
  userId: string,
  planName: string,
  autoRenew: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener el plan
    const plan = await getPlanByName(planName);
    if (!plan) {
      return { success: false, error: 'Plan no encontrado' };
    }

    // Actualizar usuario
    const { error } = await supabase
      .from('users')
      .update({
        subscription_plan_id: plan.id,
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        subscription_auto_renew: autoRenew,
        // Si es upgrade a empresa, actualizar role
        ...(planName === 'premium_empresa' && { role: 'premium' })
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating user plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception updating user plan:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar si un plan tiene una feature específica
 */
export function planHasFeature(plan: SubscriptionPlan | null, feature: string): boolean {
  if (!plan) return false;

  switch (feature) {
    case 'publish_immediately':
      return plan.can_publish_immediately;
    case 'inbox':
      return plan.has_inbox;
    case 'analytics':
      return plan.has_analytics;
    case 'priority_support':
      return plan.has_priority_support;
    case 'public_profile':
      return plan.has_public_profile;
    case 'catalog':
      return plan.has_catalog;
    case 'multiuser':
      return plan.has_multiuser;
    default:
      return false;
  }
}

/**
 * Calcular ahorro anual vs mensual
 */
export function calculateYearlySavings(plan: SubscriptionPlan): {
  monthlyTotal: number;
  yearlyTotal: number;
  savings: number;
  savingsPercentage: number;
} {
  const monthlyTotal = plan.price_monthly * 12;
  const yearlyTotal = plan.price_yearly;
  const savings = monthlyTotal - yearlyTotal;
  const savingsPercentage = (savings / monthlyTotal) * 100;

  return {
    monthlyTotal,
    yearlyTotal,
    savings,
    savingsPercentage
  };
}

/**
 * Formatear precio con símbolo de moneda
 */
export function formatPrice(amount: number, currency: string = 'ARS'): string {
  const symbols: Record<string, string> = {
    ARS: '$',
    USD: 'USD $',
    EUR: '€'
  };

  const symbol = symbols[currency] || currency;
  
  return `${symbol}${amount.toLocaleString('es-AR')}`;
}
