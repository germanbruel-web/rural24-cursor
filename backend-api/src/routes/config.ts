/**
 * Config Routes - Catálogo de categorías, marcas, modelos y formularios dinámicos
 * Endpoints públicos sin autenticación
 */

import { FastifyPluginAsync } from 'fastify';
import { getSupabaseClient } from '../infrastructure/supabase/client.js';
import { CategoryRepository } from '../domain/categories/repository.js';
import { CategoryService } from '../domain/categories/service.js';
import { CatalogRepository } from '../domain/catalog/repository.js';
import { CatalogService } from '../domain/catalog/service.js';
import { z } from 'zod';

export const configRoutes: FastifyPluginAsync = async (fastify) => {
  const supabase = getSupabaseClient();

  // GET /api/config/categories
  fastify.get('/categories', async (request, reply) => {
    try {
      const repository = new CategoryRepository(supabase);
      const service = new CategoryService(repository);
      const result = await service.getAllCategories();

      if (result.isFailure) {
        return reply.status(500).send({
          error: 'Failed to fetch categories',
          message: result.error.message,
        });
      }

      return reply
        .header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
        .send({
          categories: result.value,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /api/config/brands?subcategoryId=<uuid>
  fastify.get('/brands', async (request, reply) => {
    try {
      const { subcategoryId } = request.query as { subcategoryId?: string };

      if (!subcategoryId) {
        return reply.status(400).send({
          error: 'Missing required parameter: subcategoryId',
        });
      }

      // Validar UUID
      const uuidSchema = z.string().uuid();
      const validation = uuidSchema.safeParse(subcategoryId);
      
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Invalid subcategoryId format',
          message: 'subcategoryId must be a valid UUID',
        });
      }

      const catalogRepository = new CatalogRepository(supabase);
      const catalogService = new CatalogService(catalogRepository);
      const result = await catalogService.getBrandsBySubcategory(subcategoryId);

      if (result.isFailure) {
        return reply.status(500).send({
          error: 'Failed to fetch brands',
          message: result.error.message,
        });
      }

      return reply
        .header('Cache-Control', 'public, max-age=3600')
        .send({
          brands: result.value,
          subcategoryId,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /api/config/models?brandId=<uuid>
  fastify.get('/models', async (request, reply) => {
    try {
      const { brandId } = request.query as { brandId?: string };

      if (!brandId) {
        return reply.status(400).send({
          error: 'Missing required parameter: brandId',
        });
      }

      // Validar UUID
      const uuidSchema = z.string().uuid();
      const validation = uuidSchema.safeParse(brandId);
      
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Invalid brandId format',
          message: 'brandId must be a valid UUID',
        });
      }

      const catalogRepository = new CatalogRepository(supabase);
      const catalogService = new CatalogService(catalogRepository);
      const result = await catalogService.getModelsByBrand(brandId);

      if (result.isFailure) {
        return reply.status(500).send({
          error: 'Failed to fetch models',
          message: result.error.message,
        });
      }

      return reply
        .header('Cache-Control', 'public, max-age=3600')
        .send({
          models: result.value,
          brandId,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /api/config/form/:subcategoryId
  fastify.get('/form/:subcategoryId', async (request, reply) => {
    try {
      const { subcategoryId } = request.params as { subcategoryId: string };

      // Validar UUID
      const uuidSchema = z.string().uuid();
      const validation = uuidSchema.safeParse(subcategoryId);
      
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Invalid subcategoryId format',
          message: 'subcategoryId must be a valid UUID',
        });
      }

      const catalogRepository = new CatalogRepository(supabase);
      const catalogService = new CatalogService(catalogRepository);
      const result = await catalogService.getFormConfigForSubcategory(subcategoryId);

      if (result.isFailure) {
        return reply.status(404).send({
          error: 'Subcategory not found',
          message: result.error.message,
        });
      }

      return reply
        .header('Cache-Control', 'public, max-age=3600')
        .send({
          success: true,
          data: result.value,
        });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
