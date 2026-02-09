/**
 * API Route - /api/ads
 * Crear y listar anuncios clasificados
 * 
 * Runtime: Node.js ⚠️ (requiere Cloudinary SDK + validación compleja)
 * NO usar Edge Runtime - Cloudinary no es compatible
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdsService } from '@/domain/ads/service';
import { AdCreateSchema, AdFiltersSchema } from '@/types/schemas';
import { ValidationError } from '@/domain/shared/errors';
import { withAuth, withOptionalAuth, type AuthUser } from '@/infrastructure/auth/guard';

// NO declarar runtime = 'edge' - Cloudinary requiere Node.js

/**
 * POST /api/ads - Crear nuevo anuncio
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (user: AuthUser) => {
    try {
      const body = await request.json();

      // Asegurar que el user_id sea el del usuario autenticado
      body.user_id = user.id;

      // Sensitive data — only log in dev
      if (process.env.NODE_ENV !== 'production') console.log('[Ads] Body recibido:', JSON.stringify(body, null, 2));

    // Validar schema básico con Zod
    const validationResult = AdCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {} as Record<string, string>);

      // Validation errors returned to client — no need to log in prod

      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Los datos proporcionados son inválidos',
          fields: errors,
        },
        { status: 400 }
      );
    }

    const adData = validationResult.data;

    // Crear anuncio con validación de atributos dinámicos
    const adsService = new AdsService();
    const result = await adsService.createAd(adData);

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

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error.message,
        },
        { status: 500 }
      );
    }

    const ad = result.value;

    return NextResponse.json(
      {
        success: true,
        message: 'Anuncio creado exitosamente',
        data: ad,
      },
      { status: 201 }
    );
    } catch (error) {
    console.error('Error creating ad:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Ocurrió un error inesperado al crear el anuncio',
      },
      { status: 500 }
    );
    }
  });
}

/**
 * GET /api/ads - Listar anuncios con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validar y parsear filtros
    const validationResult = AdFiltersSchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {} as Record<string, string>);

      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Los filtros proporcionados son inválidos',
          fields: errors,
        },
        { status: 400 }
      );
    }

    const filters = validationResult.data;

    // Obtener anuncios
    const adsService = new AdsService();
    const result = await adsService.getAds(filters);

    if (result.isFailure) {
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: result.error.message,
        },
        { status: 500 }
      );
    }

    const response = result.value;

    return NextResponse.json(
      {
        success: true,
        data: response.ads,
        pagination: {
          total: response.total,
          limit: response.limit,
          offset: response.offset,
          hasMore: response.hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Ocurrió un error inesperado al obtener los anuncios',
      },
      { status: 500 }
    );
  }
}

