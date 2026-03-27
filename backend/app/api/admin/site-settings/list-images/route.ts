/**
 * GET /api/admin/site-settings/list-images
 *
 * Lista imágenes CMS almacenadas en Cloudinary (superadmin only).
 * Busca en:
 *   rural24/{env}/cms/logos/   — imágenes CMS con prefijo de entorno
 *   rural24/app/logos/         — logos de app compartidos entre entornos
 */

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { withAuth } from '@/infrastructure/auth/guard';
import { MEDIA_ROOTS } from '@/lib/media-config';
import { logger } from '@/infrastructure/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const cmsFolder = `${MEDIA_ROOTS.cms}/logos`;
        const appFolder = `${MEDIA_ROOTS.app}/logos`;

        const [cmsResult, appResult] = await Promise.all([
          cloudinary.search
            .expression(`folder:${cmsFolder}/*`)
            .with_field('context')
            .max_results(100)
            .execute()
            .catch(() => ({ resources: [] })),
          cloudinary.search
            .expression(`folder:${appFolder}/*`)
            .with_field('context')
            .max_results(100)
            .execute()
            .catch(() => ({ resources: [] })),
        ]);

        const toItem = (r: any) => ({
          name:       r.public_id.split('/').pop() ?? r.public_id,
          url:        r.secure_url,
          public_id:  r.public_id,
          size:       r.bytes ?? 0,
          created_at: r.created_at ?? new Date().toISOString(),
        });

        const images = [
          ...((cmsResult as any).resources ?? []).map(toItem),
          ...((appResult as any).resources ?? []).map(toItem),
        ];

        logger.info(`[site-settings/list-images] ${images.length} imágenes encontradas`);

        return NextResponse.json({ images });
      } catch (error: any) {
        logger.error('[site-settings/list-images] Error:', error?.message ?? error);
        return NextResponse.json({ error: 'Error al listar imágenes.' }, { status: 500 });
      }
    },
    { roles: ['superadmin'] }
  );
}
