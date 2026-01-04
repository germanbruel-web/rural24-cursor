/**
 * useCategories Hook
 * Hook para obtener categorías desde el BFF
 */

import { useState, useEffect } from 'react';
import { categoriesApi, Category, Subcategory } from '@/services/api';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const data = await categoriesApi.getAll();
        setCategories(data.categories);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useCategory(slug: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategory() {
      try {
        setLoading(true);
        const data = await categoriesApi.getBySlug(slug);
        setCategory(data || null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load category');
      } finally {
        setLoading(false);
      }
    }

    fetchCategory();
  }, [slug]);

  return { category, loading, error };
}

export function useSubcategory(categorySlug: string, subcategorySlug: string) {
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubcategory() {
      try {
        setLoading(true);
        const data = await categoriesApi.getSubcategoryBySlug(
          categorySlug,
          subcategorySlug
        );
        setSubcategory(data || null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subcategory');
      } finally {
        setLoading(false);
      }
    }

    fetchSubcategory();
  }, [categorySlug, subcategorySlug]);

  return { subcategory, loading, error };
}
