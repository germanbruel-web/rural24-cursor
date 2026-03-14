import { SupabaseClient } from '@supabase/supabase-js';
import { Category, Subcategory, SubcategoryLeaf } from './types';
import { Result } from '../shared/result';
import { DatabaseError } from '../shared/errors';

const generateSlug = (name: string | null): string => {
  if (!name) return 'sin-nombre';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

export class CategoryRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAllCategories(): Promise<Result<Category[], DatabaseError>> {
    try {
      // Query 1: todas las categorías activas
      const { data: cats, error: catError } = await this.supabase
        .from('categories')
        .select('id, name, display_name, slug, icon, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (catError) {
        return Result.fail(new DatabaseError('Failed to fetch categories', catError));
      }

      if (!cats || cats.length === 0) {
        return Result.ok([]);
      }

      // Query 2: todas las subcategorías activas (todos los niveles, flat)
      const { data: allSubs, error: subError } = await this.supabase
        .from('subcategories')
        .select('id, name, display_name, slug, category_id, parent_id, sort_order, is_active, has_brands, has_models, has_year, has_condition')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (subError) {
        return Result.fail(new DatabaseError('Failed to fetch subcategories', subError));
      }

      const subs: any[] = allSubs || [];

      // Separar nivel 2 (parent_id IS NULL) y nivel 3 (parent_id IS NOT NULL)
      const level2 = subs.filter((s) => s.parent_id === null);
      const level3 = subs.filter((s) => s.parent_id !== null);

      // Construir set de IDs que tienen hijos
      const parentIds = new Set(level3.map((s) => s.parent_id));

      // Agrupar level3 por parent_id
      const childrenByParent: Record<string, SubcategoryLeaf[]> = {};
      for (const s of level3) {
        if (!childrenByParent[s.parent_id]) childrenByParent[s.parent_id] = [];
        childrenByParent[s.parent_id].push({
          id: s.id,
          name: s.name,
          display_name: s.display_name,
          slug: s.slug || generateSlug(s.name),
          category_id: s.category_id,
          parent_id: s.parent_id,
          sort_order: s.sort_order,
          is_active: s.is_active,
          form_config: {
            requires_brand: s.has_brands || false,
            requires_model: s.has_models || false,
            requires_year: s.has_year || false,
            requires_condition: s.has_condition || false,
          },
        });
      }

      // Construir categorías con el árbol completo
      const categories: Category[] = cats.map((cat: any) => {
        const catSubs: Subcategory[] = level2
          .filter((s) => s.category_id === cat.id)
          .map((s) => {
            const hasChildren = parentIds.has(s.id);
            return {
              id: s.id,
              name: s.name,
              display_name: s.display_name,
              slug: s.slug || generateSlug(s.name),
              category_id: s.category_id,
              parent_id: null,
              sort_order: s.sort_order,
              is_active: s.is_active,
              is_leaf: !hasChildren,
              has_children: hasChildren,
              form_config: {
                requires_brand: s.has_brands || false,
                requires_model: s.has_models || false,
                requires_year: s.has_year || false,
                requires_condition: s.has_condition || false,
              },
              children: (childrenByParent[s.id] || []).sort((a, b) => a.sort_order - b.sort_order),
            };
          });

        return {
          id: cat.id,
          name: cat.name,
          display_name: cat.display_name,
          slug: cat.slug || generateSlug(cat.name),
          icon: cat.icon,
          sort_order: cat.sort_order,
          is_active: cat.is_active,
          subcategories: catSubs,
        };
      });

      return Result.ok(categories);
    } catch (error) {
      return Result.fail(new DatabaseError('Unexpected error fetching categories', error));
    }
  }

  async getCategoryById(id: string): Promise<Result<Category | null, DatabaseError>> {
    const result = await this.getAllCategories();
    if (result.isFailure) return Result.fail(result.error);
    const category = result.value.find((c) => c.id === id) || null;
    return Result.ok(category);
  }
}
