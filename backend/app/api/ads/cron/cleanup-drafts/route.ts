/**
 * API Route - /api/ads/cron/cleanup-drafts
 * Limpia borradores expirados: elimina imágenes de Cloudinary y soft-delete el ad.
 *
 * Llamar cada hora via scheduler (mismo patrón que /api/featured-ads/cron).
 * Protegido por X-Cron-Secret header.
 *
 * Lógica:
 *   1. Busca ads con status='draft' AND draft_expires_at < now()
 *   2. Elimina sus imágenes de Cloudinary
 *   3. Soft-delete: status='deleted'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { deleteManyFromCloudinary } from '@/infrastructure/cloudinary.service';

const CRON_SECRET = process.env.CRON_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

export async function GET(request: NextRequest) {
  try {
    // Auth check — mismo patrón que /api/featured-ads/cron
    const cronSecret = request.headers.get('x-cron-secret');
    const isLocalDev = !isProduction && request.headers.get('host')?.includes('localhost');
    const hasValidSecret = CRON_SECRET && cronSecret === CRON_SECRET;

    if (!isLocalDev && !hasValidSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // 1. Buscar drafts expirados
    const { data: expiredDrafts, error: fetchError } = await supabase
      .from('ads')
      .select('id, images')
      .eq('status', 'draft')
      .lt('draft_expires_at', now);

    if (fetchError) throw fetchError;

    if (!expiredDrafts || expiredDrafts.length === 0) {
      return NextResponse.json({
        success: true,
        cleaned: 0,
        message: 'No hay borradores expirados',
        timestamp: now,
      });
    }

    // 2. Recopilar public_ids de Cloudinary de todas las imágenes
    const publicIds: string[] = [];
    for (const draft of expiredDrafts) {
      const images: Array<{ path?: string }> = draft.images ?? [];
      for (const img of images) {
        if (img.path) publicIds.push(img.path);
      }
    }

    // 3. Eliminar imágenes de Cloudinary (batch)
    if (publicIds.length > 0) {
      const cloudinaryResult = await deleteManyFromCloudinary(publicIds);
      if (!isProduction) {
        console.log(`[CRON cleanup-drafts] Cloudinary: ${cloudinaryResult.success} ok, ${cloudinaryResult.failed} fallidos`);
      }
    }

    // 4. Soft-delete de los ads
    const draftIds = expiredDrafts.map((d) => d.id);
    const { error: updateError } = await supabase
      .from('ads')
      .update({ status: 'deleted', images: [] })
      .in('id', draftIds);

    if (updateError) throw updateError;

    console.log(`[CRON cleanup-drafts] ${draftIds.length} borradores expirados eliminados`);

    return NextResponse.json({
      success: true,
      cleaned: draftIds.length,
      images_deleted: publicIds.length,
      timestamp: now,
    });

  } catch (error: any) {
    console.error('[CRON cleanup-drafts] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error en cleanup', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
