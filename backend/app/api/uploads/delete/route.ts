/**
 * DELETE /api/uploads
 * Elimina imagen de Cloudinary (hard delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteFromCloudinary, deleteManyFromCloudinary } from '@/infrastructure/cloudinary.service';
import { extractCloudinaryPublicId } from '@/domain/images/service';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, urls } = body;

    // Batch delete
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

      console.log(`[DELETE BATCH] ${result.success}/${publicIds.length} deleted`);

      return NextResponse.json({
        success: result.success,
        failed: result.failed,
        errors: result.errors
      });
    }

    // Single delete
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
        console.log(`[DELETE] ${publicId} deleted`);
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: 'Failed to delete image' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Missing url or urls parameter' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[DELETE ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
