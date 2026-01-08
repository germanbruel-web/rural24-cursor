import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { CatalogRepository } from '@/domain/catalog/repository';
import { CatalogService } from '@/domain/catalog/service';
import { BrandsResponseSchema } from '@/types/schemas';
import { z } from 'zod';

/**
 * GET /api/config/brands?subcategoryId=<uuid>
 * Retorna marcas filtradas por subcategoría
 * Cache: 1 hora (las marcas no cambian frecuentemente)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subcategoryId = searchParams.get('subcategoryId');

    // Validación de parámetros
    if (!subcategoryId) {
      return NextResponse.json(
        { error: 'Missing required parameter: subcategoryId' },
        { status: 400 }
      );
    }

    // Validar UUID
    try {
      z.string().uuid().parse(subcategoryId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid subcategoryId format (must be UUID)' },
        { status: 400 }
      );
    }

    // Crear cliente Supabase y servicios
    const supabase = getSupabaseClient();
    const repository = new CatalogRepository(supabase);
    const service = new CatalogService(repository);

    // Obtener marcas desde el dominio
    const result = await service.getBrandsBySubcategory(subcategoryId);

    if (result.isFailure) {
      console.error('[GET /api/config/brands] Error:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch brands', details: result.error.message },
        { status: 500 }
      );
    }

    // Preparar respuesta validada con Zod
    const response = {
      brands: result.value,
      timestamp: new Date().toISOString(),
    };

    const validatedResponse = BrandsResponseSchema.parse(response);

    return NextResponse.json(validatedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });

  } catch (error) {
    console.error('[GET /api/config/brands] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
