/**
 * DELETE /api/admin/email-templates/media/[id]
 * Elimina imagen de Cloudinary y de la tabla email_media.
 * Superadmin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { deleteFromCloudinary } from '@/infrastructure/cloudinary.service';
import { logger } from '@/infrastructure/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    request,
    async (user) => {
      try {
        const { id } = await params;
        const supabase = getSupabaseClient();

        // Obtener public_id antes de borrar
        const { data: media, error: fetchErr } = await supabase
          .from('email_media')
          .select('public_id, url')
          .eq('id', id)
          .single();

        if (fetchErr || !media) {
          return NextResponse.json({ error: 'Imagen no encontrada.' }, { status: 404 });
        }

        // Borrar de Cloudinary
        await deleteFromCloudinary(media.public_id);

        // Borrar de DB
        const { error: delErr } = await supabase
          .from('email_media')
          .delete()
          .eq('id', id);

        if (delErr) {
          logger.error('[email-media] DELETE DB error:', delErr.message);
          return NextResponse.json({ error: 'Error al eliminar de DB.' }, { status: 500 });
        }

        logger.info(`[email-media] Eliminada: ${media.public_id} (by ${user.email})`);
        return NextResponse.json({ success: true });
      } catch (err: any) {
        logger.error('[email-media] DELETE exception:', err?.message);
        return NextResponse.json({ error: 'Error al eliminar imagen.' }, { status: 500 });
      }
    },
    { roles: ['superadmin'] }
  );
}
