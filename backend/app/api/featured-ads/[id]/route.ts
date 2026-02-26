/**
 * API Route - /api/featured-ads/[id]
 * DELETE: Cancelacion administrativa de destacado (solo superadmin)
 *
 * Regla de negocio:
 * - NO hay reembolso automatico al cancelar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

const supabase = getSupabaseClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user: AuthUser) => {
    try {
      const { id } = await params;

      const { data: featured, error: fetchError } = await supabase
        .from('featured_ads')
        .select('id, ad_id, user_id, status')
        .eq('id', id)
        .single();

      if (fetchError || !featured) {
        return NextResponse.json(
          { success: false, error: 'Destacado no encontrado' },
          { status: 404 }
        );
      }

      if (!['pending', 'active'].includes(featured.status)) {
        return NextResponse.json(
          { success: false, error: 'Solo se pueden cancelar destacados pendientes o activos' },
          { status: 400 }
        );
      }

      const { error: cancelError } = await supabase
        .from('featured_ads')
        .update({
          status: 'cancelled',
          cancelled_by: user.id,
          cancelled_reason: 'Cancelado por superadmin',
          cancelled_at: new Date().toISOString(),
          refunded: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', featured.id);

      if (cancelError) {
        return NextResponse.json(
          { success: false, error: cancelError.message },
          { status: 500 }
        );
      }

      await supabase
        .from('featured_ads_audit')
        .insert({
          featured_ad_id: featured.id,
          ad_id: featured.ad_id,
          user_id: featured.user_id,
          action: 'cancelled_by_superadmin',
          performed_by: user.id,
          performer_email: user.email,
          performer_name: user.full_name,
          reason: 'Cancelacion administrativa de destacado',
          metadata: {
            original_status: featured.status,
            refunded_credits: 0,
          },
        });

      return NextResponse.json({
        success: true,
        refunded_credits: 0,
      });
    } catch (err: any) {
      console.error('Error en DELETE /api/featured-ads/[id]:', err);
      return NextResponse.json(
        { success: false, error: err.message || 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }, { roles: ['superadmin'] });
}