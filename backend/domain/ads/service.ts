/**
 * Ads Service
 * Lógica de negocio para avisos clasificados
 */

import { AdsRepository } from './repository';
import { CatalogRepository } from '@/domain/catalog/repository';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { Result } from '@/domain/shared/result';
import { ValidationError, DatabaseError, NotFoundError } from '@/domain/shared/errors';
import type { Ad, AdCreate, AdUpdate, AdFilters, AdListResponse } from './types';

export class AdsService {
  private adsRepo: AdsRepository;
  private catalogRepo: CatalogRepository;

  constructor() {
    this.adsRepo = new AdsRepository();
    this.catalogRepo = new CatalogRepository(getSupabaseClient());
  }

  /**
   * Crear nuevo anuncio con validación de atributos dinámicos
   */
  async createAd(data: AdCreate): Promise<Result<Ad, ValidationError | DatabaseError>> {
    // Validar atributos dinámicos contra la configuración de la subcategoría
    const attributesValidation = await this.validateDynamicAttributes(
      data.subcategory_id,
      data.attributes
    );

    if (attributesValidation.isFailure) {
      return Result.fail(attributesValidation.error);
    }

    // Validar que el título no esté vacío y tenga longitud mínima
    if (!data.title || data.title.trim().length < 10) {
      return Result.fail(
        new ValidationError('El título debe tener al menos 10 caracteres', {
          title: ['Título muy corto'],
        })
      );
    }

    // Validar descripción
    if (!data.description || data.description.trim().length < 50) {
      return Result.fail(
        new ValidationError('La descripción debe tener al menos 50 caracteres', {
          description: ['Descripción muy corta'],
        })
      );
    }

    // Validar precio
    if (data.price && data.price <= 0) {
      return Result.fail(
        new ValidationError('El precio debe ser mayor a 0', {
          price: ['Precio inválido'],
        })
      );
    }

    // Crear anuncio
    return this.adsRepo.createAd(data);
  }

  /**
   * Validar atributos dinámicos contra dynamic_attributes de la subcategoría
   * @param isUpdate - Si es true, no valida atributos requeridos faltantes (permite updates parciales)
   */
  private async validateDynamicAttributes(
    subcategoryId: string,
    attributes: Record<string, any>,
    isUpdate: boolean = false
  ): Promise<Result<void, ValidationError>> {
    // Obtener configuración de atributos dinámicos
    const attributesResult = await this.catalogRepo.getDynamicAttributesBySubcategory(subcategoryId);

    if (attributesResult.isFailure) {
      return Result.fail(
        new ValidationError('No se pudo obtener configuración de atributos', {
          subcategory_id: ['Subcategoría inválida'],
        })
      );
    }

    const dynamicAttributes = attributesResult.value;
    const errors: Record<string, string[]> = {};

    // Validar cada atributo requerido (solo en CREATE, no en UPDATE)
    for (const attr of dynamicAttributes) {
      if (!isUpdate && attr.is_required && !attributes[attr.field_name]) {
        errors[attr.field_name] = [`${attr.field_label} es obligatorio`];
      }

      const value = attributes[attr.field_name];
      if (!value) continue; // Si no está presente y no es requerido, skip

      // Validar según tipo de campo
      switch (attr.field_type) {
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors[attr.field_name] = [`${attr.field_label} debe ser un número`];
          } else {
            if (attr.min_value !== null && value < attr.min_value) {
              errors[attr.field_name] = [`${attr.field_label} debe ser mayor o igual a ${attr.min_value}`];
            }
            if (attr.max_value !== null && value > attr.max_value) {
              errors[attr.field_name] = [`${attr.field_label} debe ser menor o igual a ${attr.max_value}`];
            }
          }
          break;

        case 'select':
          if (attr.field_options && attr.field_options.length > 0) {
            if (!attr.field_options.includes(value)) {
              errors[attr.field_name] = [`${attr.field_label} debe ser una opción válida`];
            }
          }
          break;

        case 'text':
          if (typeof value !== 'string') {
            errors[attr.field_name] = [`${attr.field_label} debe ser texto`];
          }
          break;
      }

      // Validar regex si existe
      if (attr.validation_regex && typeof value === 'string') {
        const regex = new RegExp(attr.validation_regex);
        if (!regex.test(value)) {
          errors[attr.field_name] = [`${attr.field_label} no cumple el formato requerido`];
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return Result.fail(new ValidationError('Errores de validación en atributos', errors));
    }

    return Result.ok(undefined);
  }

  /**
   * Obtener anuncio por ID o slug, con control de visibilidad
   */
  async getAdById(
    idOrSlug: string,
    userId?: string,
    isSuperadmin?: boolean
  ): Promise<Result<Ad, DatabaseError | NotFoundError | ValidationError>> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const result = isUuid
      ? await this.adsRepo.getAdById(idOrSlug)
      : await this.adsRepo.getAdBySlug(idOrSlug);

    if (result.isFailure) {
      return Result.fail(result.error);
    }

    const ad = result.value;

    if (ad.status !== 'active' && ad.user_id !== userId && !isSuperadmin) {
      return Result.fail(new NotFoundError(`Ad not found`));
    }

    return Result.ok(ad);
  }

  /**
   * Obtener lista de anuncios con filtros
   */
  async getAds(filters: AdFilters = {}): Promise<Result<AdListResponse, DatabaseError>> {
    return this.adsRepo.getAds(filters);
  }

  /**
   * Actualizar anuncio con verificación de ownership
   */
  async updateAd(
    id: string,
    data: AdUpdate,
    userId: string,
    isSuperadmin: boolean
  ): Promise<Result<Ad, ValidationError | DatabaseError | NotFoundError>> {
    const adResult = await this.adsRepo.getAdById(id);
    if (adResult.isFailure) {
      return Result.fail(adResult.error);
    }

    const ad = adResult.value;

    if (ad.user_id !== userId && !isSuperadmin) {
      return Result.fail(new NotFoundError(`Ad not found`));
    }

    // Campos protegidos: eliminar si vinieran en el payload
    const { ...cleanData } = data as any;
    delete cleanData.user_id;
    delete cleanData.created_at;
    delete cleanData.short_id;
    delete cleanData.slug;

    // Si se actualizan atributos, validar contra la subcategoría
    const subcategoryIdForValidation = cleanData.subcategory_id || ad.subcategory_id;
    if (cleanData.attributes) {
      const attributesValidation = await this.validateDynamicAttributes(
        subcategoryIdForValidation,
        cleanData.attributes,
        true
      );

      if (attributesValidation.isFailure) {
        return Result.fail(attributesValidation.error);
      }
    }

    if (cleanData.title && cleanData.title.trim().length < 10) {
      return Result.fail(
        new ValidationError('El título debe tener al menos 10 caracteres', {
          title: ['Título muy corto'],
        })
      );
    }

    if (cleanData.description && cleanData.description.trim().length < 50) {
      return Result.fail(
        new ValidationError('La descripción debe tener al menos 50 caracteres', {
          description: ['Descripción muy corta'],
        })
      );
    }

    return this.adsRepo.updateAd(id, cleanData as AdUpdate);
  }

  /**
   * Eliminar anuncio (soft delete) con verificación de ownership
   */
  async deleteAd(
    id: string,
    userId: string,
    isSuperadmin: boolean
  ): Promise<Result<void, DatabaseError | NotFoundError>> {
    const adResult = await this.adsRepo.getAdById(id);
    if (adResult.isFailure) {
      return Result.fail(adResult.error);
    }

    const ad = adResult.value;

    if (ad.user_id !== userId && !isSuperadmin) {
      return Result.fail(new NotFoundError(`Ad not found`));
    }

    return this.adsRepo.deleteAd(id);
  }

  /**
   * Incrementar contador de vistas
   */
  async incrementViews(id: string): Promise<Result<void, DatabaseError>> {
    return this.adsRepo.incrementViews(id);
  }
}
