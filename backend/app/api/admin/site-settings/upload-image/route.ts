/**
 * POST /api/admin/site-settings/upload-image
 *
 * Sube una imagen de site_settings a Cloudinary (superadmin only).
 *
 * Carpetas Cloudinary:
 *   header_logo / footer_logo → rural24/app/logos/ (sin env prefix, compartido DEV↔PROD)
 *   Otros settings de imagen  → rural24/{env}/cms/logos/
 *
 * Body: multipart/form-data
 *   file       — imagen (File)
 *   settingKey — clave del setting (string) — determina la carpeta
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { uploadToCloudinary } from '@/infrastructure/cloudinary.service';
import { logger } from '@/infrastructure/logger';

const LOGO_KEYS = ['header_logo', 'footer_logo', 'site_logo'];

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (user) => {
      try {
        const formData = await request.formData();
        const file       = formData.get('file') as File | null;
        const settingKey = (formData.get('settingKey') as string | null) ?? '';

        if (!file) {
          return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
          return NextResponse.json(
            { error: `Formato no permitido: ${file.type}. Formatos válidos: JPG, PNG, WebP, AVIF, SVG.` },
            { status: 400 }
          );
        }

        if (file.size > MAX_SIZE) {
          return NextResponse.json(
            { error: `Archivo muy grande. Máximo 5MB. Tu archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB.` },
            { status: 400 }
          );
        }

        // Determinar carpeta según el tipo de setting
        // Logos → app-logos (sin prefijo de entorno, compartido DEV/PROD)
        // Resto  → logos (CMS, con prefijo de entorno)
        const folder = LOGO_KEYS.includes(settingKey) ? 'app-logos' : 'logos';

        const bytes  = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await uploadToCloudinary(buffer, folder, undefined, user.id);

        logger.info(`[site-settings/upload] ${settingKey} → ${result.url} (by ${user.email})`);

        return NextResponse.json({
          url:       result.url,
          public_id: result.public_id,
        });
      } catch (error: any) {
        logger.error('[site-settings/upload] Error:', error?.message ?? error);
        return NextResponse.json({ error: 'Error al subir la imagen.' }, { status: 500 });
      }
    },
    { roles: ['superadmin'] }
  );
}
