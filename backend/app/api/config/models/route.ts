/**
 * API Route - /api/config/models
 * Obtener modelos filtrados por marca
 * 
 * Runtime: Edge ✅ (filtrado simple de catálogo)
 * Cache: 1 hora por marca
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { CatalogRepository } from '@/domain/catalog/repository';
import { CatalogService } from '@/domain/catalog/service';
import { ModelsResponseSchema } from '@/types/schemas';
import { z } from 'zod';

export const runtime = 'edge';
export const revalidate = 3600; // Cache 1 hora

/**
 * GET /api/config/models?brandId=<uuid>
 * Retorna modelos filtrados por marca
 * Cache: 1 hora (los modelos no cambian frecuentemente)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');

    // Validación de parámetros
    if (!brandId) {
      return NextResponse.json(
        { error: 'Missing required parameter: brandId' },
        { status: 400 }
      );
    }

    // Validar UUID
    try {
      z.string().uuid().parse(brandId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid brandId format (must be UUID)' },
        { status: 400 }
      );
    }

    // Crear cliente Supabase y servicios
    const supabase = getSupabaseClient();
    const repository = new CatalogRepository(supabase);
    const service = new CatalogService(repository);

    // Obtener modelos desde el dominio
    const result = await service.getModelsByBrand(brandId);

    if (result.isFailure) {
      console.error('[GET /api/config/models] Error:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch models', details: result.error.message },
        { status: 500 }
      );
    }

    // Preparar respuesta validada con Zod
    const response = {
      models: result.value,
      timestamp: new Date().toISOString(),
    };

    const validatedResponse = ModelsResponseSchema.parse(response);

    return NextResponse.json(validatedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });

  } catch (error) {
    console.error('[GET /api/config/models] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
