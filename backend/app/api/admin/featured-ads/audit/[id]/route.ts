/**
 * API Route - GET /api/admin/featured-ads/audit/[id]
 * Obtener historial completo de auditoría de un featured ad (SuperAdmin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verificar si el usuario es SuperAdmin
 */
async function isSuperAdmin(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) return false;

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return userData?.role === 'superadmin';
  } catch (error) {
    console.error('❌ Error verificando SuperAdmin:', error);
    return false;
  }
}

/**
 * GET /api/admin/featured-ads/audit/[id]
 * Historial de auditoría de un featured ad
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. SuperAdmin required.' },
        { status: 403 }
      );
    }

    const { id } = params;

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
}
