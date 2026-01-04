import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { CategoryRepository } from '@/domain/categories/repository';
import { CategoryService } from '@/domain/categories/service';
import { CategoriesResponseSchema } from '@/types/schemas';

export async function GET() {
  try {
    // Initialize dependencies
    const supabase = getSupabaseClient();
    const repository = new CategoryRepository(supabase);
    const service = new CategoryService(repository);

    // Get all categories
    const result = await service.getAllCategories();

    if (result.isFailure) {
      console.error('[Categories API] Error:', result.error);
      return NextResponse.json(
        {
          error: 'Failed to fetch categories',
          message: result.error.message,
        },
        { status: 500 }
      );
    }

    // Validate response with Zod
    const response = {
      categories: result.value,
      timestamp: new Date().toISOString(),
    };

    const validatedResponse = CategoriesResponseSchema.parse(response);

    return NextResponse.json(validatedResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[Categories API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
