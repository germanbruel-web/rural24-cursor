/**
 * Utilidades del Design System
 * Helper functions para combinar clases de Tailwind
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind CSS evitando conflictos
 * @param inputs - Clases a combinar
 * @returns String con clases combinadas y optimizadas
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
