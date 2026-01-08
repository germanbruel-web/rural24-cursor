/**
 * Ads Repository
 * Capa de acceso a datos para avisos clasificados
 */

import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { Result } from '@/domain/shared/result';
import { DatabaseError, NotFoundError } from '@/domain/shared/errors';
import type { Ad, AdCreate, AdUpdate, AdFilters, AdListResponse } from './types';

export class AdsRepository {
  private supabase = getSupabaseClient();

  /**
   * Crear nuevo anuncio
   */
  async createAd(data: AdCreate): Promise<Result<Ad, DatabaseError>> {
    try {
      // Validar que el título no esté vacío
      if (!data.title || data.title.trim().length === 0) {
        return Result.fail(new DatabaseError('Title is required for creating an ad'));
      }

      // Generar slug y short_id
      const slug = this.generateSlug(data.title);
      const short_id = this.generateShortId();

      // Validar que el slug se generó correctamente
      if (!slug || slug.length === 0) {
        return Result.fail(new DatabaseError(`Failed to generate slug from title: "${data.title}"`));
      }

      console.log('Creating ad with:', { title: data.title, slug, short_id });

      const adData = {
        user_id: data.user_id,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
        brand_id: data.brand_id || null,
        model_id: data.model_id || null,
        title: data.title,
        description: data.description,
        slug,
        short_id,
        price: data.price,
        currency: data.currency,
        province: data.province,
        city: data.city || null,
        location: data.location || null,
        attributes: data.attributes || {},
        dynamic_fields: {},
        images: data.images || [],
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
        status: data.status || 'active',
        approval_status: data.approval_status || 'pending',
        is_premium: false,
        featured: false,
        views: 0,
      };

      const { data: ad, error } = await this.supabase
        .from('ads')
        .insert(adData as any)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating ad:', error);
        return Result.fail(new DatabaseError(`Error creating ad: ${error.message}`));
      }

      return Result.ok(ad as Ad);
    } catch (error) {
      console.error('Unexpected error creating ad:', error);
      return Result.fail(new DatabaseError(`Unexpected error creating ad: ${error}`));
    }
  }

  /**
   * Obtener anuncio por ID
   */
  async getAdById(id: string): Promise<Result<Ad, DatabaseError | NotFoundError>> {
    try {
      const { data, error } = await this.supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError(`Ad with id ${id} not found`));
        }
        return Result.fail(new DatabaseError(`Error fetching ad: ${error.message}`));
      }

      return Result.ok(data as Ad);
    } catch (error) {
      return Result.fail(new DatabaseError(`Unexpected error fetching ad: ${error}`));
    }
  }

  /**
   * Obtener lista de anuncios con filtros
   */
  async getAds(filters: AdFilters = {}): Promise<Result<AdListResponse, DatabaseError>> {
    try {
      const {
        category_id,
        subcategory_id,
        brand_id,
        model_id,
        province,
        city,
        min_price,
        max_price,
        currency,
        status = 'active',
        approval_status = 'approved',
        featured,
        search,
        limit = 20,
        offset = 0,
        order_by = 'created_at',
        order_dir = 'desc',
      } = filters;

      let query = this.supabase.from('ads').select('*', { count: 'exact' });

      // Filtros básicos
      if (category_id) query = query.eq('category_id', category_id);
      if (subcategory_id) query = query.eq('subcategory_id', subcategory_id);
      if (brand_id) query = query.eq('brand_id', brand_id);
      if (model_id) query = query.eq('model_id', model_id);
      if (province) query = query.eq('province', province);
      if (city) query = query.eq('city', city);
      if (status) query = query.eq('status', status);
      if (approval_status) query = query.eq('approval_status', approval_status);
      if (featured !== undefined) query = query.eq('featured', featured);
      if (currency) query = query.eq('currency', currency);

      // Filtros de precio
      if (min_price !== undefined) query = query.gte('price', min_price);
      if (max_price !== undefined) query = query.lte('price', max_price);

      // Búsqueda full-text (si se implementa)
      if (search) {
        query = query.textSearch('search_vector', search);
      }

      // Ordenamiento
      const ascending = order_dir === 'asc';
      query = query.order(order_by, { ascending });

      // Si hay featured, priorizar
      if (featured) {
        query = query.order('featured_order', { ascending: true });
      }

      // Paginación
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return Result.fail(new DatabaseError(`Error fetching ads: ${error.message}`));
      }

      const response: AdListResponse = {
        ads: (data || []) as Ad[],
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      };

      return Result.ok(response);
    } catch (error) {
      return Result.fail(new DatabaseError(`Unexpected error fetching ads: ${error}`));
    }
  }

  /**
   * Actualizar anuncio
   */
  async updateAd(id: string, data: AdUpdate): Promise<Result<Ad, DatabaseError | NotFoundError>> {
    try {
      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      // Si se actualiza el título, regenerar slug
      if (data.title) {
        updateData.slug = this.generateSlug(data.title);
      }

      const { data: ad, error } = await this.supabase
        .from('ads')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError(`Ad with id ${id} not found (update)`));
        }
        return Result.fail(new DatabaseError(`Error updating ad: ${error.message}`));
      }

      return Result.ok(ad as Ad);
    } catch (error) {
      return Result.fail(new DatabaseError(`Unexpected error updating ad: ${error}`));
    }
  }

  /**
   * Eliminar anuncio (soft delete)
   */
  async deleteAd(id: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    try {
      const { error } = await this.supabase
        .from('ads')
        .update({ status: 'deleted', updated_at: new Date().toISOString() } as never)
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError(`Ad with id ${id} not found (delete)`));
        }
        return Result.fail(new DatabaseError(`Error deleting ad: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new DatabaseError(`Unexpected error deleting ad: ${error}`));
    }
  }

  /**
   * Incrementar contador de vistas
   */
  async incrementViews(id: string): Promise<Result<void, DatabaseError>> {
    try {
      const { error } = await (this.supabase.rpc as any)('increment_ad_views', { ad_id: id });

      if (error) {
        return Result.fail(new DatabaseError(`Error incrementing views: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new DatabaseError(`Unexpected error incrementing views: ${error}`));
    }
  }

  /**
   * Helpers privados
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales
      .replace(/^-+|-+$/g, '') // Remover guiones al inicio/fin
      .slice(0, 100); // Limitar longitud
  }

  private generateShortId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }
}
