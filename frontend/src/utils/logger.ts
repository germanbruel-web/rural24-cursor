/**
 * Logger condicional — solo activo en desarrollo.
 * En producción: log/warn/debug son no-ops. error siempre se emite.
 *
 * Uso: import { logger } from '@/utils/logger'
 *      logger.log('mensaje', data)
 *      logger.warn('advertencia')
 *      logger.error('error crítico')  // siempre visible
 */

const isDev = import.meta.env.DEV;

export const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: (...args: any[]): void => { if (isDev) console.log(...args); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (...args: any[]): void => { if (isDev) console.warn(...args); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]): void => { console.error(...args); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (...args: any[]): void => { if (isDev) console.debug(...args); },
};
