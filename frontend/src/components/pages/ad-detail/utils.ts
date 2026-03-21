import React from 'react';
import {
  Info, Home, Ruler, Settings, Hash, DollarSign, List, MapPin, Tag, CheckCircle2,
} from 'lucide-react';
import type { FormFieldV2 } from '../../../types/v2';

export function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 30)
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  if (days >= 1) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  if (hours >= 1) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (mins >= 1) return `hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  return 'hace un momento';
}

export function formatPrice(price: number): string {
  return price.toLocaleString('es-AR');
}

export const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  info: Info, home: Home, ruler: Ruler, settings: Settings,
  hash: Hash, 'dollar-sign': DollarSign, list: List,
  'map-pin': MapPin, tag: Tag, check: CheckCircle2,
};

export function getSectionCols(fields: FormFieldV2[]): number {
  if (fields.some(f => f.field_width === 'third')) return 3;
  if (fields.some(f => f.field_width === 'half')) return 2;
  return 1;
}

export function gridColsClass(cols: number): string {
  if (cols === 3) return 'grid-cols-1 sm:grid-cols-3';
  if (cols === 2) return 'grid-cols-1 sm:grid-cols-2';
  return 'grid-cols-1';
}

export function fieldSpanClass(field: FormFieldV2): string {
  return field.field_width === 'full' ? 'col-span-full' : '';
}
