/**
 * API Route - /api/config/form/[subcategoryId]
 * Obtener configuración dinámica del formulario según subcategoría
 *
 * Sprint 8A: enriquecido con category_path, is_leaf_node, current_step, total_steps
 * Runtime: Edge ✅
 * Cache: 1 hora por subcategoría
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { CatalogRepository } from '@/domain/catalog/repository';
import { CatalogService } from '@/domain/catalog/service';
import { FormConfigResponseSchema } from '@/types/schemas';
import { z } from 'zod';

export const runtime = 'edge';
export const revalidate = 3600;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subcategoryId: string }> }
) {
  try {
    const { subcategoryId } = await params;

    try {
      z.string().uuid().parse(subcategoryId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid subcategoryId format (must be UUID)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. Obtener subcategoría con parent_id y category_id
    const { data: sub, error: subError } = await supabase
      .from('subcategories')
      .select('id, name, display_name, parent_id, category_id, has_brands, has_models, has_year, has_condition')
      .eq('id', subcategoryId)
      .eq('is_active', true)
      .single<{
        id: string;
        name: string;
        display_name: string;
        parent_id: string | null;
        category_id: string;
        has_brands: boolean;
        has_models: boolean;
        has_year: boolean;
        has_condition: boolean;
      }>();

    if (subError || !sub) {
      return NextResponse.json(
        { error: 'Subcategory not found or inactive' },
        { status: 404 }
      );
    }

    // 2. Verificar si es leaf node:
    //    - Nivel 3: parent_id IS NOT NULL → siempre leaf
    //    - Nivel 2: parent_id IS NULL → leaf solo si no tiene hijos activos
    let isLeafNode = false;
    if (sub.parent_id !== null) {
      isLeafNode = true;
    } else {
      const { count } = await supabase
        .from('subcategories')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', subcategoryId)
        .eq('is_active', true);
      isLeafNode = (count ?? 0) === 0;
    }

    if (!isLeafNode) {
      return NextResponse.json(
        { error: 'Esta subcategoría tiene sub-niveles. Navegá hasta el nivel final para armar el aviso.' },
        { status: 400 }
      );
    }

    // 3. Construir category_path
    //    Nivel 3: Category > Parent > Sub
    //    Nivel 2 leaf: Category > Sub
    let categoryPath = '';
    const { data: category } = await supabase
      .from('categories')
      .select('display_name')
      .eq('id', sub.category_id)
      .single<{ display_name: string }>();

    const catName = category?.display_name ?? '';

    if (sub.parent_id !== null) {
      const { data: parentSub } = await supabase
        .from('subcategories')
        .select('display_name')
        .eq('id', sub.parent_id)
        .single<{ display_name: string }>();
      categoryPath = `${catName} > ${parentSub?.display_name ?? ''} > ${sub.display_name}`;
    } else {
      categoryPath = `${catName} > ${sub.display_name}`;
    }

    // 4. Obtener dynamic_attributes
    const repository = new CatalogRepository(supabase);
    const service = new CatalogService(repository);
    const attributesResult = await service.getDynamicAttributesBySubcategory(subcategoryId);

    if (attributesResult.isFailure) {
      return NextResponse.json(
        { error: 'Failed to fetch form configuration', details: attributesResult.error.message },
        { status: 500 }
      );
    }

    // 5. Respuesta enriquecida
    const response = {
      subcategory_id: sub.id,
      subcategory_name: sub.display_name,
      category_path: categoryPath,
      is_leaf_node: isLeafNode,
      current_step: 2,
      total_steps: 6,
      requires_brand: sub.has_brands || false,
      requires_model: sub.has_models || false,
      requires_year: sub.has_year || false,
      requires_condition: sub.has_condition || false,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
