/**
 * API Route - DELETE /api/admin/users/[id]
 * Elimina un usuario del sistema (Auth + cascade en DB).
 *
 * Solo accesible por superadmin.
 * Usa service_role key server-side — nunca exponer en frontend.
 *
 * Restricciones:
 * - No permite auto-eliminación (superadmin borrándose a sí mismo)
 * - No permite eliminar a otro superadmin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const supabaseAdmin = getSupabaseClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (admin: AuthUser) => {
    try {
      const { id: targetUserId } = await params;

      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'ID de usuario requerido' },
          { status: 400 }
        );
      }

      // Protección 1: no permitir auto-eliminación
      if (admin.id === targetUserId) {
        return NextResponse.json(
          { success: false, error: 'No podés eliminar tu propia cuenta' },
          { status: 400 }
        );
      }

      // Protección 2: verificar que el target no sea otro superadmin
      const { data: targetProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('id', targetUserId)
        .single<{ id: string; email: string; role: string }>();

      if (profileError || !targetProfile) {
        return NextResponse.json(
          { success: false, error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      if (targetProfile.role === 'superadmin') {
        return NextResponse.json(
          { success: false, error: 'No se puede eliminar una cuenta superadmin' },
          { status: 403 }
        );
      }

      // Eliminar del Auth de Supabase (CASCADE elimina datos relacionados vía FK)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      if (deleteError) {
        logger.error('[DELETE /api/admin/users/[id]] Auth delete error:', deleteError);
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        );
      }

      logger.log(`[admin] Usuario eliminado: ${targetProfile.email} por ${admin.email}`);

      return NextResponse.json({
        success: true,
        message: `Usuario ${targetProfile.email} eliminado correctamente`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error interno del servidor';
      logger.error('[DELETE /api/admin/users/[id]] Error:', err);
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }
  }, { roles: ['superadmin'] });
}
