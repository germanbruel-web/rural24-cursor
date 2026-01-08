import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { CatalogRepository } from '@/domain/catalog/repository';
import { CatalogService } from '@/domain/catalog/service';
import { FormConfigResponseSchema } from '@/types/schemas';
import { z } from 'zod';

/**
 * GET /api/config/form/[subcategoryId]
 * Retorna la configuración completa del formulario para una subcategoría:
 * - form_config (requires_brand, requires_model, requires_year, requires_condition)
 * - dynamic_attributes agrupados por field_group
 * Cache: 1 hora (la configuración no cambia frecuentemente)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subcategoryId: string }> }
) {
  try {
    const { subcategoryId } = await params;

    // Validar UUID
    try {
      z.string().uuid().parse(subcategoryId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid subcategoryId format (must be UUID)' },
        { status: 400 }
      );
    }

    // Crear cliente Supabase
    const supabase = getSupabaseClient();

    // 1. Obtener subcategoría con form_config
    const { data: subcategory, error: subError } = await supabase
      .from('subcategories')
      .select(`
        id,
        name,
        display_name,
        has_brands,
        has_models,
        has_year,
        has_condition
      `)
      .eq('id', subcategoryId)
      .eq('is_active', true)
      .single<{
        id: string;
        name: string;
        display_name: string;
        has_brands: boolean;
        has_models: boolean;
        has_year: boolean;
        has_condition: boolean;
      }>();

    if (subError || !subcategory) {
      console.error('[GET /api/config/form] Subcategory not found:', subError);
      return NextResponse.json(
        { error: 'Subcategory not found or inactive' },
        { status: 404 }
      );
    }

    // 2. Obtener dynamic_attributes usando el servicio de catálogo
    const repository = new CatalogRepository(supabase);
    const service = new CatalogService(repository);

    const attributesResult = await service.getDynamicAttributesBySubcategory(subcategoryId);

    if (attributesResult.isFailure) {
      console.error('[GET /api/config/form] Error fetching attributes:', attributesResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch form configuration', details: attributesResult.error.message },
        { status: 500 }
      );
    }

    // 3. Preparar respuesta validada con Zod
    const response = {
      subcategory_id: subcategory.id,
      subcategory_name: subcategory.display_name,
      requires_brand: subcategory.has_brands || false,
      requires_model: subcategory.has_models || false,
      requires_year: subcategory.has_year || false,
      requires_condition: subcategory.has_condition || false,
      dynamic_attributes: attributesResult.value,
      timestamp: new Date().toISOString(),
    };

    const validatedResponse = FormConfigResponseSchema.parse(response);

    return NextResponse.json(validatedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });

  } catch (error) {
    console.error('[GET /api/config/form] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
