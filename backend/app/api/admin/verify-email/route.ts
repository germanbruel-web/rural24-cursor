/**
 * ============================================================================
 * API ENDPOINT: POST /api/admin/verify-email
 * ============================================================================
 * 
 * Endpoint protegido para que superadmin confirme email de usuarios
 * 
 * IMPORTANTE: Esta ruta requiere:
 * - Header: Authorization: Bearer {jwt}
 * - Usuario debe tener role = 'superadmin'
 * - Solo funciona desde servidor (service_role_key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { verifyEmailAsAdmin } from '@/app/services/adminAuthService';

const supabaseAdmin = getSupabaseClient();

/**
 * POST /api/admin/verify-email
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Obtener token del header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 2️⃣ Verificar que es superadmin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 3️⃣ Verificar que tiene role superadmin
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only superadmin can verify emails' },
        { status: 403 }
      );
    }

    // 4️⃣ Obtener userId del body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // 5️⃣ Confirmar email
    const result = await verifyEmailAsAdmin(userId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error en POST /api/admin/verify-email:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
