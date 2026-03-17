/**
 * CategoryBadge — Átomo
 * Pill de categoría para cards de avisos.
 * Paleta rural: verdes, marrones, amarillos — solo tokens Tailwind.
 */

import React from 'react';
import { cn } from '../../../design-system/utils';

// Mapa slug → clases Tailwind (paleta rural earthy)
export const CATEGORY_BADGE_STYLES: Record<string, string> = {
  'hacienda':            'bg-amber-800 text-white',
  'maquinaria-agricola': 'bg-stone-700 text-white',
  'insumos':             'bg-brand-700 text-white',
  'repuestos':           'bg-yellow-700 text-white',
  'equipamiento':        'bg-emerald-700 text-white',
  'inmobiliaria-rural':  'bg-green-800 text-white',
  'empleos':             'bg-stone-500 text-white',
  'servicios':           'bg-stone-600 text-white',
};

// Mapa slug → etiqueta visible en español
export const CATEGORY_BADGE_LABELS: Record<string, string> = {
  'hacienda':            'Hacienda',
  'maquinaria-agricola': 'Maquinaria',
  'insumos':             'Insumos',
  'repuestos':           'Repuestos',
  'equipamiento':        'Equipamiento',
  'inmobiliaria-rural':  'Inmobiliaria',
  'empleos':             'Empleos',
  'servicios':           'Servicios',
};

// Slugs de todas las categorías activas
export type CategorySlug = keyof typeof CATEGORY_BADGE_STYLES;

export interface CategoryBadgeProps {
  /** Slug canónico de la categoría (ej: 'hacienda', 'maquinaria-agricola') */
  slug: string;
  /** Clases adicionales */
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ slug, className }) => {
  const key = slug?.toLowerCase();
  const styles = CATEGORY_BADGE_STYLES[key] ?? 'bg-brand-700 text-white';
  const label  = CATEGORY_BADGE_LABELS[key] ?? slug;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full shadow-md',
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
};

CategoryBadge.displayName = 'CategoryBadge';

export default CategoryBadge;
