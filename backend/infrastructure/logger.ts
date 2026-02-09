/**
 * Logger centralizado - Rural24 Backend
 * 
 * En producción: solo error y warn
 * En desarrollo: todos los niveles
 * 
 * USO:
 *   import { logger } from '@/infrastructure/logger';
 *   logger.info('[Health]', 'Database connected');
 *   logger.error('[Uploads]', 'Failed to upload', { error: err.message });
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  /** Debug: solo en desarrollo */
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /** Info: solo en desarrollo */
  info: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /** Warn: siempre visible */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /** Error: siempre visible */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
