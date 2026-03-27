/**
 * DELETE /api/admin/site-settings/delete-image
 *
 * Elimina una imagen CMS de Cloudinary por public_id (superadmin only).
 *
 * Body JSON:
 *   public_id — public_id completo de Cloudinary (string)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { deleteFromCloudinary } from '@/infrastructure/cloudinary.service';
import { logger } from '@/infrastructure/logger';

export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async (user) => {
      try {
        const body = await request.json().catch(() => null);
        const publicId = body?.public_id as string | undefined;

        if (!publicId || typeof publicId !== 'string' || !publicId.trim()) {
          return NextResponse.json({ error: 'public_id es requerido.' }, { status: 400 });
        }

        const ok = await deleteFromCloudinary(publicId.trim());

        if (!ok) {
          return NextResponse.json({ error: 'No se pudo eliminar la imagen.' }, { status: 500 });
        }

        logger.info(`[site-settings/delete-image] ${publicId} eliminada (by ${user.email})`);

        return NextResponse.json({ success: true });
      } catch (error: any) {
        logger.error('[site-settings/delete-image] Error:', error?.message ?? error);
        return NextResponse.json({ error: 'Error al eliminar la imagen.' }, { status: 500 });
      }
    },
    { roles: ['superadmin'] }
  );
}
