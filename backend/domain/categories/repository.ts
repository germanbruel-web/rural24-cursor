import { SupabaseClient } from '@supabase/supabase-js';
import { Category, Subcategory } from './types';
import { Result } from '../shared/result';
import { DatabaseError } from '../shared/errors';

export class CategoryRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAllCategories(): Promise<Result<Category[], DatabaseError>> {
    try {
      // Fetch categories with subcategories
      const { data: categories, error: catError } = await this.supabase
        .from('categories')
        .select(`
          id,
          name,
          display_name,
          slug,
          icon,
          sort_order,
          is_active,
          subcategories:subcategories(
            id,
            name,
            display_name,
            slug,
            category_id,
            sort_order,
            is_active,
            has_brands,
            has_models,
            has_year,
            has_condition
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (catError) {
        return Result.fail(
          new DatabaseError('Failed to fetch categories', catError)
        );
      }

      if (!categories) {
        return Result.ok([]);
      }

      // Transform database response to domain model
      const transformedCategories: Category[] = categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        display_name: cat.display_name,
        slug: cat.slug,
        icon: cat.icon,
        sort_order: cat.sort_order,
        is_active: cat.is_active,
        subcategories: (cat.subcategories || [])
          .filter((sub: any) => sub.is_active)
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            display_name: sub.display_name,
            slug: sub.slug,
            category_id: sub.category_id,
            sort_order: sub.sort_order,
            is_active: sub.is_active,
            form_config: {
              requires_brand: sub.has_brands || false,
              requires_model: sub.has_models || false,
              requires_year: sub.has_year || false,
              requires_condition: sub.has_condition || false,
            },
          })),
      }));

      return Result.ok(transformedCategories);
    } catch (error) {
      return Result.fail(
        new DatabaseError('Unexpected error fetching categories', error)
      );
    }
  }

  async getCategoryById(id: string): Promise<Result<Category | null, DatabaseError>> {
    try {
      const { data: category, error } = await this.supabase
        .from('categories')
        .select(`
          id,
          name,
          display_name,
          slug,
          icon,
          sort_order,
          is_active,
          subcategories:subcategories(
            id,
            name,
            display_name,
            slug,
            category_id,
            sort_order,
            is_active,
            has_brands,
            has_models,
            has_year,
            has_condition
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(
          new DatabaseError('Failed to fetch category', error)
        );
      }

      if (!category) {
        return Result.ok(null);
      }

      const transformedCategory: Category = {
        id: category.id,
        name: category.name,
        display_name: category.display_name,
        slug: category.slug,
        icon: category.icon,
        sort_order: category.sort_order,
        is_active: category.is_active,
        subcategories: (category.subcategories || [])
          .filter((sub: any) => sub.is_active)
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            display_name: sub.display_name,
            slug: sub.slug,
            category_id: sub.category_id,
            sort_order: sub.sort_order,
            is_active: sub.is_active,
            form_config: {
              requires_brand: sub.has_brands || false,
              requires_model: sub.has_models || false,
              requires_year: sub.has_year || false,
              requires_condition: sub.has_condition || false,
            },
          })),
      };

      return Result.ok(transformedCategory);
    } catch (error) {
      return Result.fail(
        new DatabaseError('Unexpected error fetching category', error)
      );
    }
  }
}
