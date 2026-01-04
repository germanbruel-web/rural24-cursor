import { SupabaseClient } from '@supabase/supabase-js';
import { Brand, Model, DynamicAttribute } from './types';
import { Result } from '../shared/result';
import { DatabaseError, NotFoundError } from '../shared/errors';

export class CatalogRepository {
  constructor(private supabase: SupabaseClient) {}

  // ========== BRANDS ==========
  
  async getBrandsBySubcategory(subcategoryId: string): Promise<Result<Brand[], DatabaseError>> {
    try {
      const { data, error } = await this.supabase
        .from('subcategory_brands')
        .select(`
          brands:brand_id(
            id,
            name,
            slug,
            logo_url,
            country,
            description,
            is_active,
            sort_order
          )
        `)
        .eq('subcategory_id', subcategoryId)
        .order('sort_order', { ascending: true });

      if (error) {
        return Result.fail(new DatabaseError('Failed to fetch brands', error));
      }

      const brands = (data || [])
        .map((item: any) => item.brands)
        .filter((brand: any) => brand && brand.is_active);

      return Result.ok(brands);
    } catch (error) {
      return Result.fail(new DatabaseError('Unexpected error fetching brands', error));
    }
  }

  async getAllBrands(): Promise<Result<Brand[], DatabaseError>> {
    try {
      const { data, error } = await this.supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        return Result.fail(new DatabaseError('Failed to fetch brands', error));
      }

      return Result.ok(data || []);
    } catch (error) {
      return Result.fail(new DatabaseError('Unexpected error fetching brands', error));
    }
  }

  // ========== MODELS ==========
  
  async getModelsByBrand(brandId: string): Promise<Result<Model[], DatabaseError>> {
    try {
      const { data, error } = await this.supabase
        .from('models')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .order('year_from', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError('Failed to fetch models', error));
      }

      return Result.ok(data || []);
    } catch (error) {
      return Result.fail(new DatabaseError('Unexpected error fetching models', error));
    }
  }

  async getModelById(modelId: string): Promise<Result<Model | null, DatabaseError>> {
    try {
      const { data, error } = await this.supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError('Failed to fetch model', error));
      }

      return Result.ok(data);
    } catch (error) {
      return Result.fail(new DatabaseError('Unexpected error fetching model', error));
    }
  }

  // ========== DYNAMIC ATTRIBUTES ==========
  
  async getDynamicAttributesBySubcategory(subcategoryId: string): Promise<Result<DynamicAttribute[], DatabaseError>> {
    try {
      const { data, error } = await this.supabase
        .from('dynamic_attributes')
        .select(`
          id,
          field_name,
          field_label,
          field_type,
          field_group,
          field_options,
          is_required,
          min_value,
          max_value,
          validation_regex,
          placeholder,
          help_text,
          prefix,
          suffix,
          sort_order
        `)
        .eq('subcategory_id', subcategoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        return Result.fail(new DatabaseError('Failed to fetch dynamic attributes', error));
      }

      return Result.ok(data || []);
    } catch (error) {
      return Result.fail(new DatabaseError('Unexpected error fetching attributes', error));
    }
  }
}
