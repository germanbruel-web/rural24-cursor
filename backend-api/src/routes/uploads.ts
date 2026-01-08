/**
 * Uploads Routes - Manejo de imágenes con Cloudinary
 */

import { FastifyPluginAsync } from 'fastify';
import { UploadService } from '../domain/uploads/service.js';
import { z } from 'zod';

const SignedUrlRequestSchema = z.object({
  folder: z.string().optional().default('rural24'),
  public_id: z.string().optional(),
});

export const uploadsRoutes: FastifyPluginAsync = async (fastify) => {
  const uploadService = new UploadService();

  // POST /api/uploads - Upload directo de imagen
  fastify.post('/', async (request, reply) => {
    try {
      // Verificar que sea multipart/form-data
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({
          error: 'No file uploaded',
          message: 'Please provide a file in the request',
        });
      }

      // Obtener folder desde fields
      const folder = data.fields?.folder?.value || 'rural24';
      
      // Verificar honeypot anti-bot
      const websiteField = data.fields?.website?.value;
      if (websiteField && websiteField !== '') {
        fastify.log.warn('Bot detected - honeypot filled');
        return reply.status(400).send({
          error: 'Validation failed',
          message: 'Invalid request',
        });
      }

      // Convertir stream a buffer
      const buffer = await data.toBuffer();
      
      // Upload a Cloudinary
      const result = await uploadService.uploadImageBuffer(buffer, {
        folder: String(folder),
        filename: data.filename,
      });

      if (result.isFailure) {
        return reply.status(500).send({
          error: 'Upload failed',
          message: result.error.message,
        });
      }

      return reply.send({
        success: true,
        data: {
          url: result.value.url,
          path: result.value.public_id,
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

  // POST /api/uploads/signed-url - Obtener URL firmada para upload
  fastify.post('/signed-url', async (request, reply) => {
    try {
      const validation = SignedUrlRequestSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          message: validation.error.errors[0].message,
        });
      }

      const { folder, public_id } = validation.data;

      const result = await uploadService.generateSignedUploadUrl({
        folder,
        public_id,
      });

      if (result.isFailure) {
        return reply.status(500).send({
          error: 'Failed to generate signed URL',
          message: result.error.message,
        });
      }

      return reply.send({
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

  // DELETE /api/uploads - Eliminar imagen de Cloudinary
  fastify.delete('/', async (request, reply) => {
    try {
      const { public_id } = request.body as { public_id?: string };

      if (!public_id) {
        return reply.status(400).send({
          error: 'Missing required parameter: public_id',
        });
      }

      const result = await uploadService.deleteImage(public_id);

      if (result.isFailure) {
        return reply.status(500).send({
          error: 'Failed to delete image',
          message: result.error.message,
        });
      }

      return reply.send({
        success: true,
        message: 'Image deleted successfully',
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
