import { supabase } from './supabaseClient';

// ================================================
// TIPOS
// ================================================

export interface SubscriptionPlan {
  id: string;
  name: string; // 'free', 'starter', 'pro', 'empresa'
  display_name: string;
  description?: string;
  max_ads: number | null; // null = ilimitado
  max_contacts_per_month: number | null; // null = ilimitado
  max_contacts_received?: number | null;
  max_contacts_sent?: number | null;
  max_featured_ads: number;
  max_highlighted_ads?: number;
  can_publish_immediately?: boolean;
  has_inbox?: boolean;
  has_analytics: boolean;
  has_priority_support?: boolean;
  has_public_profile: boolean;
  has_catalog: boolean;
  has_multiuser?: boolean;
  price_monthly: number;
  price_yearly: number;
  currency?: string;
  is_active: boolean;
  sort_order: number;
  badge_color?: string;
  features?: string[];
  icon_name?: string;
  badge_text?: string;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
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
 * Obtener plan específico por nombre (case-insensitive)
 */
export async function getPlanByName(planName: string): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .ilike('name', planName)
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

// ================================================
// CRUD DE PLANES (SuperAdmin)
// ================================================

export interface PlanCreateInput {
  name: string;
  display_name: string;
  description?: string;
  max_ads: number | null;
  max_contacts_per_month: number | null;
  max_featured_ads: number;
  has_public_profile: boolean;
  has_catalog: boolean;
  has_analytics: boolean;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  sort_order: number;
  badge_color?: string;
  features?: string[];
  icon_name?: string;
  badge_text?: string;
  is_featured?: boolean;
}

export interface PlanUpdateInput extends Partial<PlanCreateInput> {
  id: string;
}

/**
 * Obtener TODOS los planes (incluyendo inactivos) - Solo SuperAdmin
 */
export async function getAllPlansAdmin(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order');

  if (error) {
    console.error('❌ Error getting all plans:', error);
    throw error;
  }

  return data || [];
}

/**
 * Crear nuevo plan
 */
export async function createPlan(input: PlanCreateInput): Promise<{ success: boolean; plan?: SubscriptionPlan; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        name: input.name,
        display_name: input.display_name,
        description: input.description || '',
        max_ads: input.max_ads,
        max_contacts_per_month: input.max_contacts_per_month,
        max_featured_ads: input.max_featured_ads || 0,
        has_public_profile: input.has_public_profile || false,
        has_catalog: input.has_catalog || false,
        has_analytics: input.has_analytics !== false,
        price_monthly: input.price_monthly || 0,
        price_yearly: input.price_yearly || 0,
        is_active: input.is_active !== false,
        sort_order: input.sort_order || 99,
        badge_color: input.badge_color || 'gray',
        features: input.features || [],
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true, plan: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Actualizar plan existente
 */
export async function updatePlan(input: PlanUpdateInput): Promise<{ success: boolean; error?: string }> {
  const { id, ...updates } = input;

  try {
    const { error } = await supabase
      .from('subscription_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Error updating plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Desactivar plan (soft delete)
 */
export async function deactivatePlan(planId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Reactivar plan
 */
export async function reactivatePlan(planId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Contar usuarios por plan
 */
export async function countUsersByPlan(planId: string): Promise<number> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_plan_id', planId);

  if (error) {
    console.error('❌ Error counting users:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Eliminar plan permanentemente (hard delete)
 * Solo permite eliminar si no hay usuarios con este plan
 */
export async function deletePlan(planId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verificar que no haya usuarios con este plan
    const userCount = await countUsersByPlan(planId);
    if (userCount > 0) {
      return { 
        success: false, 
        error: `No se puede eliminar: hay ${userCount} usuario(s) con este plan. Primero migra los usuarios a otro plan.` 
      };
    }

    // 2. Eliminar el plan
    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('❌ Error deleting plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
