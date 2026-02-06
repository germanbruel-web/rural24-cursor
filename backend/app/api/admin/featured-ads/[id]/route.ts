/**
 * API Route - /api/admin/featured-ads/[id]
 * PATCH: Editar featured ad existente (SuperAdmin only)
 * DELETE: Cancelar featured ad con/sin reembolso (SuperAdmin only)
 * GET: Obtener detalle completo de un featured ad
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verificar si el usuario es SuperAdmin
 */
async function isSuperAdmin(request: NextRequest): Promise<{ id: string; email: string; full_name: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('role, email, full_name')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'superadmin') return null;

    return { id: user.id, email: userData.email, full_name: userData.full_name };
  } catch (error) {
    console.error('❌ Error verificando SuperAdmin:', error);
    return null;
  }
}

/**
 * GET /api/admin/featured-ads/[id]
 * Obtener detalle completo de un featured ad
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const admin = await isSuperAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. SuperAdmin required.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Obtener featured con JOINs
    const { data, error } = await supabase
      .from('v_admin_featured_ads') // Usar vista con joins completos
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Featured ad no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error('❌ Error en GET /api/admin/featured-ads/[id]:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/featured-ads/[id]
 * Editar featured ad (fechas, placement, etc)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const admin = await isSuperAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. SuperAdmin required.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { scheduled_start, expires_at, duration_days, placement, reason } = body;

    // Obtener featured actual
    const { data: current, error: fetchError } = await supabase
      .from('featured_ads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { success: false, error: 'Featured ad no encontrado' },
        { status: 404 }
      );
    }

    // Validar que no esté expirado o cancelado
    if (current.status === 'expired') {
      return NextResponse.json(
        { success: false, error: 'No se puede editar un featured ya expirado' },
        { status: 400 }
      );
    }

    if (current.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'No se puede editar un featured cancelado' },
        { status: 400 }
      );
    }

    // Construir objeto de actualización
    const updates: any = {};
    const oldValues: any = {};
    const newValues: any = {};

    if (scheduled_start) {
      oldValues.scheduled_start = current.scheduled_start;
      newValues.scheduled_start = scheduled_start;
      updates.scheduled_start = scheduled_start;
    }

    if (duration_days) {
      oldValues.duration_days = current.duration_days;
      newValues.duration_days = duration_days;
      updates.duration_days = duration_days;
      
      // Recalcular expires_at
      const start = new Date(scheduled_start || current.scheduled_start);
      const newExpires = new Date(start);
      newExpires.setDate(newExpires.getDate() + duration_days);
      updates.expires_at = newExpires.toISOString();
      newValues.expires_at = updates.expires_at;
    }

    if (expires_at) {
      oldValues.expires_at = current.expires_at;
      newValues.expires_at = expires_at;
      updates.expires_at = expires_at;
    }

    if (placement && placement !== current.placement) {
      oldValues.placement = current.placement;
      newValues.placement = placement;
      updates.placement = placement;
    }

    // Validar que haya cambios
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay cambios para aplicar' },
        { status: 400 }
      );
    }

    // Actualizar featured
    updates.updated_at = new Date().toISOString();
    
    const { data: updated, error: updateError } = await supabase
      .from('featured_ads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Registrar en auditoría
    await supabase
      .from('featured_ads_audit')
      .insert({
        featured_ad_id: id,
        ad_id: current.ad_id,
        user_id: current.user_id,
        action: 'edited',
        performed_by: admin.id,
        performer_email: admin.email,
        performer_name: admin.full_name,
        reason: reason || 'Edición manual por SuperAdmin',
        metadata: {
          old_values: oldValues,
          new_values: newValues,
          fields_changed: Object.keys(updates)
        }
      });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Featured ad actualizado exitosamente',
      changes: Object.keys(updates)
    });

  } catch (err: any) {
    console.error('❌ Error en PATCH /api/admin/featured-ads/[id]:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/featured-ads/[id]
 * Cancelar featured ad con/sin reembolso
 * 
 * Body: {
 *   reason: string;
 *   refund_credits?: boolean; // Default: true si credit_consumed
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const admin = await isSuperAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. SuperAdmin required.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { reason, refund_credits } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un motivo de cancelación (mínimo 5 caracteres)' },
        { status: 400 }
      );
    }

    // Obtener featured actual
    const { data: featured, error: fetchError } = await supabase
      .from('featured_ads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !featured) {
      return NextResponse.json(
        { success: false, error: 'Featured ad no encontrado' },
        { status: 404 }
      );
    }

    // Validar estado
    if (featured.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Este featured ya está cancelado' },
        { status: 400 }
      );
    }

    if (featured.status === 'expired') {
      return NextResponse.json(
        { success: false, error: 'Este featured ya expiró naturalmente' },
        { status: 400 }
      );
    }

    // Determinar si se hace reembolso
    const shouldRefund = refund_credits !== false && featured.credit_consumed;
    let refundAmount = 0;

    if (shouldRefund) {
      // Calcular reembolso usando función SQL
      const { data: refundData } = await supabase
        .rpc('calculate_featured_refund', { p_featured_id: id });
      
      refundAmount = refundData || 0;

      if (refundAmount > 0) {
        // Actualizar créditos del usuario
        const { data: currentCredits } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', featured.user_id)
          .single();

        const newBalance = (currentCredits?.balance || 0) + refundAmount;

        await supabase
          .from('user_credits')
          .update({ balance: newBalance })
          .eq('user_id', featured.user_id);

        // Registrar transacción de reembolso
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: featured.user_id,
            type: 'refund',
            amount: refundAmount,
            balance_after: newBalance,
            description: `Reembolso por cancelación de featured: ${reason}`,
            featured_ad_id: id,
            notes: `Cancelado por SuperAdmin: ${admin.email}`
          });
      }
    }

    // Marcar como cancelado
    const { data: cancelled, error: cancelError } = await supabase
      .from('featured_ads')
      .update({
        status: 'cancelled',
        cancelled_by: admin.id,
        cancelled_reason: reason,
        cancelled_at: new Date().toISOString(),
        refunded: shouldRefund && refundAmount > 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (cancelError) throw cancelError;

    // Registrar en auditoría
    await supabase
      .from('featured_ads_audit')
      .insert({
        featured_ad_id: id,
        ad_id: featured.ad_id,
        user_id: featured.user_id,
        action: shouldRefund ? 'refunded' : 'cancelled',
        performed_by: admin.id,
        performer_email: admin.email,
        performer_name: admin.full_name,
        reason,
        metadata: {
          refund_amount: refundAmount,
          credit_consumed: featured.credit_consumed,
          days_remaining: featured.expires_at 
            ? Math.max(0, Math.ceil((new Date(featured.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 0,
          original_duration: featured.duration_days,
          placement: featured.placement
        }
      });

    return NextResponse.json({
      success: true,
      data: cancelled,
      message: shouldRefund && refundAmount > 0
        ? `Featured cancelado. ${refundAmount} créditos reembolsados.`
        : 'Featured cancelado exitosamente',
      refund: {
        applied: shouldRefund && refundAmount > 0,
        amount: refundAmount
      }
    });

  } catch (err: any) {
    console.error('❌ Error en DELETE /api/admin/featured-ads/[id]:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
