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

    const result = await service.getFormConfigForSubcategory(subcategoryId);

    if (result.isFailure) {
      console.error('[Form Config API] Error:', result.error);
      return NextResponse.json(
        {
          error: 'Failed to fetch form configuration',
          message: result.error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ...result.value,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[Form Config API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
