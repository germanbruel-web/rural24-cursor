/**
 * Logger condicional backend.
 * log/warn/debug solo en desarrollo. error siempre.
 *
 * Uso: import { logger } from '@/lib/logger'
 */

const isDev = process.env.NODE_ENV !== 'production';

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
