import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { CatalogRepository } from '@/domain/catalog/repository';
import { CatalogService } from '@/domain/catalog/service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subcategoryId = searchParams.get('subcategory_id');

    if (!subcategoryId) {
      return NextResponse.json(
        { error: 'subcategory_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const repository = new CatalogRepository(supabase);
    const service = new CatalogService(repository);

    const result = await service.getBrandsBySubcategory(subcategoryId);

    if (result.isFailure) {
      console.error('[Brands API] Error:', result.error);
      return NextResponse.json(
        {
          error: 'Failed to fetch brands',
          message: result.error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        brands: result.value,
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
    console.error('[Brands API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
