/**
 * Fastify Server - Rural24 API
 * 
 * ARQUITECTURA CRÍTICA:
 * - Bootstrap determinístico
 * - Proceso garantiza mantenerse vivo
 * - Sin dependencias de tooling externo (Turbo)
 * - Working directory: backend-api/
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Garantizar working directory correcto (backend-api/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

// Cargar .env.local desde ROOT_DIR (backend-api/)
config({ path: resolve(ROOT_DIR, '.env.local') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { configRoutes } from './routes/config.js';
import { adsRoutes } from './routes/ads.js';
import { uploadsRoutes } from './routes/uploads.js';
import { adminRoutes } from './routes/admin.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

async function startServer() {
  // 1. CREAR INSTANCIA (config pura, no I/O)
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  // 2. REGISTRAR PLUGINS (no inicializan recursos externos)
  await fastify.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 5,
    },
  });

  // 3. HEALTH CHECK (sin DB, sin Supabase, sin FS)
  fastify.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
  }));

  // 4. REGISTRAR ROUTES (lazy loading dentro de handlers)
  await fastify.register(configRoutes, { prefix: '/api/config' });
  await fastify.register(adsRoutes, { prefix: '/api/ads' });
  await fastify.register(uploadsRoutes, { prefix: '/api/uploads' });
  await fastify.register(adminRoutes, { prefix: '/api/admin' });

  // 5. ERROR HANDLER GLOBAL
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode || 500).send({
      error: error.name || 'Internal Server Error',
      message: error.message,
    });
  });

  // 6. LISTEN (el único punto que puede fallar es puerto ocupado)
  try {
    await fastify.listen({ port: PORT, host: HOST });
  } catch (err) {
    fastify.log.error(err);
    throw new Error(`Failed to bind to port ${PORT}: ${err.message}`);
  }

  // 7. POST-LISTEN (proceso garantizado vivo por TCP server)
  console.log('\n🚀 Rural24 Backend API');
  console.log(`   ✓ Listening: http://localhost:${PORT}`);
  console.log(`   ✓ CORS: ${CORS_ORIGIN}`);
  console.log(`   ✓ Working dir: ${ROOT_DIR}`);
  console.log(`   ✓ Process ID: ${process.pid}\n`);

  // 8. GRACEFUL SHUTDOWN (handlers de señales OS)
  const shutdown = async (signal: string) => {
    console.log(`\n⚠️  ${signal} received - closing gracefully...`);
    try {
      await fastify.close();
      console.log('✓ Server closed');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // 9. ERROR HANDLERS GLOBALES (última red de seguridad)
  process.on('unhandledRejection', (reason, promise) => {
    fastify.log.error({ reason, promise }, 'Unhandled Rejection');
  });

  process.on('uncaughtException', (error) => {
    fastify.log.fatal({ error }, 'Uncaught Exception');
    process.exit(1);
  });

  return fastify;
}

// ENTRY POINT
startServer().catch((err) => {
  console.error('❌ FATAL - Cannot start server:', err);
  process.exit(1);
});
