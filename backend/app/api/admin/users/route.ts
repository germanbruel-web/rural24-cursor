/**
 * API: GET /api/admin/users
 * 
 * Obtiene todos los usuarios del sistema.
 * Usa service_role para bypass de RLS.
 * Solo accesible por superadmin (auth guard en backend).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

const supabaseAdmin = getSupabaseClient();

export async function GET(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    try {
    // Obtener usuarios
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, first_name, last_name, phone, mobile, role, user_type, email_verified, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error loading users:', usersError);
      return NextResponse.json(
        { success: false, error: usersError.message },
        { status: 500 }
      );
    }

    // Contar avisos por usuario
    const { data: adsCounts, error: adsError } = await supabaseAdmin
      .from('ads')
      .select('user_id')
      .neq('status', 'deleted');

    const adsCountMap: Record<string, number> = {};
    if (adsCounts) {
      adsCounts.forEach(ad => {
        if (ad.user_id) {
          adsCountMap[ad.user_id] = (adsCountMap[ad.user_id] || 0) + 1;
        }
      });
    }

    // Agregar conteo a cada usuario
    const usersWithAds = (users || []).map(user => ({
      ...user,
      ads_count: adsCountMap[user.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: usersWithAds,
      count: usersWithAds.length
    });

    } catch (error) {
    console.error('❌ Error in /api/admin/users:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
    }
  }, { roles: ['superadmin'] });
}

/**
 * API: PATCH /api/admin/users
 * 
 * Actualiza un usuario (full_name, role, etc.)
 */
export async function PATCH(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    try {
    const body = await request.json();
    const { user_id, ...rawUpdates } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id requerido' },
        { status: 400 }
      );
    }

    // Whitelist de campos permitidos para evitar escrituras arbitrarias
    const ALLOWED_FIELDS = [
      'full_name', 'first_name', 'last_name', 'phone', 'mobile',
      'role', 'is_verified', 'email_verified', 'is_active', 'user_type'
    ];
    const updates: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawUpdates) {
        updates[key] = rawUpdates[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionaron campos válidos para actualizar' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

    } catch (error) {
    console.error('❌ Error in PATCH /api/admin/users:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
    }
  }, { roles: ['superadmin'] });
}
