/**
 * Payments Service
 * Gestión de pagos (simulado para desarrollo)
 */

import { supabase } from '../supabaseClient';

// ============================================================================
// TIPOS
// ============================================================================

export type PaymentType = 'subscription' | 'featured_ad' | 'upgrade' | 'renewal' | 'other';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'simulated' | 'mercadopago' | 'stripe' | 'transfer' | 'cash' | 'other';

export interface Payment {
  id: string;
  user_id: string;
  payment_type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  external_id: string | null;
  external_status: string | null;
  description: string | null;
  metadata: Record<string, any>;
  receipt_number: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expires_at: string | null;
  admin_notes: string | null;
  // Joins
  user_email?: string;
  user_name?: string;
  plan_name?: string;
}

export interface CreatePaymentData {
  payment_type: PaymentType;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

export interface PaymentSummary {
  month: string;
  completed_count: number;
  total_revenue: number;
  subscription_revenue: number;
  featured_revenue: number;
  pending_count: number;
}

// ============================================================================
// FUNCIONES PARA USUARIOS
// ============================================================================

/**
 * Crear un nuevo pago (pendiente)
 */
export async function createPayment(data: CreatePaymentData): Promise<Payment | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      payment_type: data.payment_type,
      amount: data.amount,
      currency: data.currency || 'ARS',
      description: data.description,
      metadata: data.metadata || {},
      expires_at: data.expires_at,
      status: 'pending',
      payment_method: 'simulated'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    return null;
  }

  return payment;
}

/**
 * Simular pago completado (para desarrollo)
 */
export async function simulatePayment(paymentId: string): Promise<{ success: boolean; receiptNumber?: string }> {
  const { data, error } = await supabase
    .from('payments')
    .update({ 
      status: 'completed',
      payment_method: 'simulated'
    })
    .eq('id', paymentId)
    .select('receipt_number')
    .single();

  if (error) {
    console.error('Error simulating payment:', error);
    return { success: false };
  }

  return { 
    success: true, 
    receiptNumber: data?.receipt_number 
  };
}

/**
 * Obtener mis pagos
 */
export async function getMyPayments(limit: number = 50): Promise<Payment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting my payments:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtener un pago por ID
 */
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error) {
    console.error('Error getting payment:', error);
    return null;
  }

  return data;
}

/**
 * Cancelar un pago pendiente
 */
export async function cancelPayment(paymentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('payments')
    .update({ status: 'cancelled' })
    .eq('id', paymentId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error cancelling payment:', error);
    return false;
  }

  return true;
}

// ============================================================================
// FUNCIONES PARA SUPERADMIN
// ============================================================================

/**
 * Obtener todos los pagos (SuperAdmin)
 */
export async function getAllPayments(
  filters?: {
    status?: PaymentStatus;
    type?: PaymentType;
    startDate?: string;
    endDate?: string;
  },
  limit: number = 100
): Promise<Payment[]> {
  let query = supabase
    .from('payments')
    .select(`
      *,
      users!inner (email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.type) {
    query = query.eq('payment_type', filters.type);
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting all payments:', error);
    return [];
  }

  return (data || []).map(p => ({
    ...p,
    user_email: (p.users as any)?.email,
    user_name: (p.users as any)?.full_name
  }));
}

/**
 * Obtener resumen mensual de pagos (SuperAdmin)
 */
export async function getPaymentsSummary(months: number = 6): Promise<PaymentSummary[]> {
  // Calcular fecha de inicio
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from('payments')
    .select('created_at, status, payment_type, amount')
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('Error getting payments summary:', error);
    return [];
  }

  // Agrupar por mes
  const byMonth: Record<string, PaymentSummary> = {};

  (data || []).forEach(p => {
    const month = p.created_at.substring(0, 7); // YYYY-MM
    
    if (!byMonth[month]) {
      byMonth[month] = {
        month,
        completed_count: 0,
        total_revenue: 0,
        subscription_revenue: 0,
        featured_revenue: 0,
        pending_count: 0
      };
    }

    if (p.status === 'completed') {
      byMonth[month].completed_count++;
      byMonth[month].total_revenue += p.amount;
      
      if (p.payment_type === 'subscription' || p.payment_type === 'upgrade' || p.payment_type === 'renewal') {
        byMonth[month].subscription_revenue += p.amount;
      } else if (p.payment_type === 'featured_ad') {
        byMonth[month].featured_revenue += p.amount;
      }
    } else if (p.status === 'pending') {
      byMonth[month].pending_count++;
    }
  });

  return Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Marcar pago como completado (SuperAdmin)
 */
export async function markPaymentCompleted(paymentId: string, notes?: string): Promise<boolean> {
  const { error } = await supabase
    .from('payments')
    .update({ 
      status: 'completed',
      admin_notes: notes
    })
    .eq('id', paymentId);

  if (error) {
    console.error('Error marking payment completed:', error);
    return false;
  }

  return true;
}

/**
 * Marcar pago como reembolsado (SuperAdmin)
 */
export async function refundPayment(paymentId: string, reason?: string): Promise<boolean> {
  const { error } = await supabase
    .from('payments')
    .update({ 
      status: 'refunded',
      admin_notes: reason
    })
    .eq('id', paymentId);

  if (error) {
    console.error('Error refunding payment:', error);
    return false;
  }

  return true;
}

// ============================================================================
// HELPERS PARA CHECKOUT
// ============================================================================

/**
 * Crear pago para suscripción
 */
export async function createSubscriptionPayment(
  planId: string,
  planName: string,
  amount: number,
  periodMonths: number = 1
): Promise<Payment | null> {
  return createPayment({
    payment_type: periodMonths === 1 ? 'subscription' : 'subscription',
    amount,
    description: `Suscripción ${planName} (${periodMonths === 1 ? 'Mensual' : 'Anual'})`,
    metadata: {
      plan_id: planId,
      plan_name: planName,
      period_months: periodMonths
    }
  });
}

/**
 * Crear pago para destacar aviso
 */
export async function createFeaturedPayment(
  adId: string,
  adTitle: string,
  days: number,
  pricePerDay: number
): Promise<Payment | null> {
  const amount = days * pricePerDay;
  
  return createPayment({
    payment_type: 'featured_ad',
    amount,
    description: `Destacar aviso: ${adTitle} (${days} días)`,
    metadata: {
      ad_id: adId,
      ad_title: adTitle,
      days,
      price_per_day: pricePerDay
    }
  });
}

// ============================================================================
// FORMATEO
// ============================================================================

/**
 * Formatear monto como moneda
 */
export function formatAmount(amount: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Obtener label de estado
 */
export function getStatusLabel(status: PaymentStatus): { label: string; color: string } {
  const labels: Record<PaymentStatus, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'yellow' },
    processing: { label: 'Procesando', color: 'blue' },
    completed: { label: 'Pagado', color: 'green' },
    failed: { label: 'Fallido', color: 'red' },
    refunded: { label: 'Reembolsado', color: 'purple' },
    cancelled: { label: 'Cancelado', color: 'gray' }
  };
  return labels[status] || { label: status, color: 'gray' };
}

/**
 * Obtener label de tipo de pago
 */
export function getTypeLabel(type: PaymentType): string {
  const labels: Record<PaymentType, string> = {
    subscription: 'Suscripción',
    featured_ad: 'Destacado',
    upgrade: 'Upgrade',
    renewal: 'Renovación',
    other: 'Otro'
  };
  return labels[type] || type;
}
