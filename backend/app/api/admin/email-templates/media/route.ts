/**
 * GET  /api/admin/email-templates/media  — lista imágenes de la media library
 * POST /api/admin/email-templates/media  — sube imagen a Cloudinary + guarda en DB
 * Superadmin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { uploadToCloudinary } from '@/infrastructure/cloudinary.service';
import { logger } from '@/infrastructure/logger';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_SIZE     = 5 * 1024 * 1024; // 5MB

// ── GET — listar ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('email_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[email-media] GET error:', error.message);
        return NextResponse.json({ error: 'Error al obtener imágenes.' }, { status: 500 });
      }
      return NextResponse.json({ data: data ?? [] });
    },
    { roles: ['superadmin'] }
  );
}

// ── POST — subir ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (user) => {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
          return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
        }

        if (!ALLOWED_MIME.includes(file.type.toLowerCase())) {
          return NextResponse.json(
            { error: `Formato no permitido: ${file.type}. Válidos: JPG, PNG, WebP, GIF, SVG.` },
            { status: 400 }
          );
        }

        if (file.size > MAX_SIZE) {
          return NextResponse.json(
            { error: `Archivo muy grande. Máximo 5MB.` },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadToCloudinary(buffer, 'email-media', undefined, user.id);

        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('email_media')
          .insert({
            url:       result.url,
            public_id: result.public_id,
            filename:  file.name,
            width:     result.width,
            height:    result.height,
            bytes:     result.bytes,
          })
          .select()
          .single();

        if (error) {
          logger.error('[email-media] DB insert error:', error.message);
          return NextResponse.json({ error: 'Imagen subida a Cloudinary pero error al guardar en DB.' }, { status: 500 });
        }

        logger.info(`[email-media] Subida: ${result.url} (by ${user.email})`);
        return NextResponse.json({ data });
      } catch (err: any) {
        logger.error('[email-media] POST exception:', err?.message);
        return NextResponse.json({ error: 'Error al subir imagen.' }, { status: 500 });
      }
    },
    { roles: ['superadmin'] }
  );
}
