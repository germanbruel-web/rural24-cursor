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
import { verifyEmailAsAdmin } from '@/app/services/adminAuthService';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

/**
 * POST /api/admin/verify-email
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (_admin: AuthUser) => {
    try {
      // Obtener userId del body
      const body = await request.json();
      const { userId } = body;

      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required' },
          { status: 400 }
        );
      }

      // Confirmar email vía service
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
  }, { roles: ['superadmin'] });
}
