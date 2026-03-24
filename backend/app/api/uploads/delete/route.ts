/**
 * DELETE /api/uploads
 * Elimina imagen de Cloudinary (hard delete)
 * Requiere autenticación
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteFromCloudinary, deleteManyFromCloudinary } from '@/infrastructure/cloudinary.service';
import { extractCloudinaryPublicId } from '@/domain/images/service';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    try {
    const body = await request.json();
    const { url, urls, public_id, public_ids } = body;

    // Batch delete — acepta urls[] (legacy) o public_ids[]
    if (urls && Array.isArray(urls)) {
      const publicIds = urls
        .map(extractCloudinaryPublicId)
        .filter(Boolean) as string[];

      if (publicIds.length === 0) {
        return NextResponse.json(
          { error: 'No valid Cloudinary URLs provided' },
          { status: 400 }
        );
      }

      const result = await deleteManyFromCloudinary(publicIds);
      if (process.env.NODE_ENV !== 'production') console.log(`[DELETE BATCH] ${result.success}/${publicIds.length} deleted`);
      return NextResponse.json({ success: result.success, failed: result.failed, errors: result.errors });
    }

    if (public_ids && Array.isArray(public_ids)) {
      const ids = public_ids.filter(Boolean) as string[];
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No public_ids provided' }, { status: 400 });
      }
      const result = await deleteManyFromCloudinary(ids);
      if (process.env.NODE_ENV !== 'production') console.log(`[DELETE BATCH] ${result.success}/${ids.length} deleted`);
      return NextResponse.json({ success: result.success, failed: result.failed, errors: result.errors });
    }

    // Single delete — acepta url (legacy) o public_id
    if (public_id) {
      const success = await deleteFromCloudinary(public_id);
      if (process.env.NODE_ENV !== 'production') console.log(`[DELETE] ${public_id} deleted`);
      return NextResponse.json(success ? { success: true } : { error: 'Failed to delete image' }, { status: success ? 200 : 500 });
    }

    if (url) {
      const publicId = extractCloudinaryPublicId(url);

      if (!publicId) {
        return NextResponse.json(
          { error: 'Invalid Cloudinary URL' },
          { status: 400 }
        );
      }

      const success = await deleteFromCloudinary(publicId);

      if (success) {
        if (process.env.NODE_ENV !== 'production') console.log(`[DELETE] ${publicId} deleted`);
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: 'Failed to delete image' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Missing url, urls, public_id or public_ids parameter' },
      { status: 400 }
    );

    } catch (error: any) {
    console.error('[DELETE ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
    }
  });
}
