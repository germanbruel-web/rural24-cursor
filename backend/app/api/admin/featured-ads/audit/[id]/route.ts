/**
 * API Route - GET /api/admin/featured-ads/audit/[id]
 * Obtener historial completo de auditoría de un featured ad (SuperAdmin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/featured-ads/audit/[id]
 * Historial de auditoría de un featured ad
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_user: AuthUser) => {
  try {
    const { id } = await params;

    // Obtener historial de auditoría
    const { data, error } = await supabase
      .from('featured_ads_audit')
      .select('*')
      .eq('featured_ad_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (err: any) {
    console.error('❌ Error en GET /api/admin/featured-ads/audit/[id]:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
  }, { roles: ['superadmin'] });
}
