/**
 * Ads Routes - Crear y listar anuncios clasificados
 */

import { FastifyPluginAsync } from 'fastify';
import { AdsService } from '../domain/ads/service.js';
import { AdCreateSchema, AdFiltersSchema } from '../types/schemas.js';
import { ValidationError } from '../domain/shared/errors.js';

export const adsRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/ads - Crear nuevo anuncio
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body;

      fastify.log.info({ body }, 'Creating new ad');

      // Validar schema básico con Zod
      const validationResult = AdCreateSchema.safeParse(body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.reduce((acc, err) => {
          const field = err.path.join('.');
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>);

        fastify.log.error({ errors }, 'Validation failed');

        return reply.status(400).send({
          error: 'Validation error',
          message: 'Los datos proporcionados son inválidos',
          fields: errors,
        });
      }

      const adData = validationResult.data;

      // Crear anuncio con validación de atributos dinámicos
      const adsService = new AdsService();
      const result = await adsService.createAd(adData);

      if (result.isFailure) {
        const error = result.error;

        if (error instanceof ValidationError) {
          return reply.status(400).send({
            error: 'Validation error',
            message: error.message,
            fields: error.fields,
          });
        }

        return reply.status(500).send({
          error: 'Internal server error',
          message: error.message,
        });
      }

      const ad = result.value;

      return reply.status(201).send({
        success: true,
        message: 'Anuncio creado exitosamente',
        data: ad,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /api/ads - Listar anuncios con filtros
  fastify.get('/', async (request, reply) => {
    try {
      const queryParams = request.query;

      fastify.log.debug({ queryParams }, 'Fetching ads with filters');

      // Validar filtros
      const validationResult = AdFiltersSchema.safeParse(queryParams);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.reduce((acc, err) => {
          const field = err.path.join('.');
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>);

        return reply.status(400).send({
          error: 'Invalid filters',
          message: 'Los filtros proporcionados son inválidos',
          fields: errors,
        });
      }

      const filters = validationResult.data;

      // Obtener anuncios
      const adsService = new AdsService();
      const result = await adsService.getAds(filters);

      if (result.isFailure) {
        return reply.status(500).send({
          error: 'Failed to fetch ads',
          message: result.error.message,
        });
      }

      const { ads, total } = result.value;

      return reply.send({
        success: true,
        data: ads,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 20,
        },
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
