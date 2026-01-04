import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { CatalogRepository } from '@/domain/catalog/repository';
import { CatalogService } from '@/domain/catalog/service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brand_id');

    if (!brandId) {
      return NextResponse.json(
        { error: 'brand_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const repository = new CatalogRepository(supabase);
    const service = new CatalogService(repository);

    const result = await service.getModelsByBrand(brandId);

    if (result.isFailure) {
      console.error('[Models API] Error:', result.error);
      return NextResponse.json(
        {
          error: 'Failed to fetch models',
          message: result.error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        models: result.value,
        count: result.value.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[Models API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
