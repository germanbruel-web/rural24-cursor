import { NextRequest, NextResponse } from 'next/server';
import { AdsService } from '@/domain/ads/service';
import { AdUpdateSchema } from '@/types/schemas';
import { ValidationError, NotFoundError } from '@/domain/shared/errors';
import { withAuth, withOptionalAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { sanitizeRichText } from '@/domain/shared/sanitize';

/**
 * GET /api/ads/[id] - Obtener anuncio por ID o slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withOptionalAuth(request, async (user: AuthUser | null) => {
    try {
      const { id } = params;

      const adsService = new AdsService();
      const result = await adsService.getAdById(
        id,
        user?.id,
        user?.role === 'superadmin'
      );

      if (result.isFailure) {
        const error = result.error;

        if (error instanceof NotFoundError) {
          return NextResponse.json(
            { error: 'Not found', message: 'El anuncio no existe o no está disponible' },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { error: 'Internal server error', message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error fetching ad:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Ocurrió un error inesperado al obtener el anuncio' },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH /api/ads/[id] - Actualizar anuncio
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user: AuthUser) => {
    try {
      const { id } = params;
      const body = await request.json();

      if (typeof body.description === 'string') {
        body.description = sanitizeRichText(body.description);
      }

      const validationResult = AdUpdateSchema.safeParse(body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.reduce((acc, err) => {
          const field = err.path.join('.');
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>);

        return NextResponse.json(
          {
            error: 'Validation error',
            message: 'Los datos proporcionados son inválidos',
            fields: errors,
          },
          { status: 400 }
        );
      }

      const adsService = new AdsService();
      const result = await adsService.updateAd(
        id,
        validationResult.data,
        user.id,
        user.role === 'superadmin'
      );

      if (result.isFailure) {
        const error = result.error;

        if (error instanceof ValidationError) {
          return NextResponse.json(
            {
              error: 'Validation error',
              message: error.message,
              fields: error.fields,
            },
            { status: 400 }
          );
        }

        if (error instanceof NotFoundError) {
          return NextResponse.json(
            { error: 'Not found', message: 'El anuncio no existe o no tiene permisos para modificarlo' },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { error: 'Internal server error', message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error updating ad:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Ocurrió un error inesperado al actualizar el anuncio' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/ads/[id] - Eliminar anuncio (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user: AuthUser) => {
    try {
      const { id } = params;

      const adsService = new AdsService();
      const result = await adsService.deleteAd(
        id,
        user.id,
        user.role === 'superadmin'
      );

      if (result.isFailure) {
        const error = result.error;

        if (error instanceof NotFoundError) {
          return NextResponse.json(
            { error: 'Not found', message: 'El anuncio no existe o no tiene permisos para eliminarlo' },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { error: 'Internal server error', message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting ad:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Ocurrió un error inesperado al eliminar el anuncio' },
        { status: 500 }
      );
    }
  });
}
