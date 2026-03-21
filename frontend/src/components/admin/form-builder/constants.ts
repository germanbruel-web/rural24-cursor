import React from 'react';
import {
  Hash,
  AlignLeft,
  List,
  CheckSquare,
  ListChecks,
  CircleDot,
  Zap,
  Type,
  Handshake,
  Tractor,
  Leaf,
  Warehouse,
  Briefcase,
  Building2,
  Package,
  Wrench,
  Home,
  Fish,
  Wheat,
  Beef,
  Sprout,
} from 'lucide-react';
import type { TipoCampo } from './types';

export const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  handshake: React.createElement(Handshake, { className: 'w-4 h-4' }),
  tractor: React.createElement(Tractor, { className: 'w-4 h-4' }),
  leaf: React.createElement(Leaf, { className: 'w-4 h-4' }),
  seedling: React.createElement(Sprout, { className: 'w-4 h-4' }),
  sprout: React.createElement(Sprout, { className: 'w-4 h-4' }),
  warehouse: React.createElement(Warehouse, { className: 'w-4 h-4' }),
  briefcase: React.createElement(Briefcase, { className: 'w-4 h-4' }),
  building: React.createElement(Building2, { className: 'w-4 h-4' }),
  building2: React.createElement(Building2, { className: 'w-4 h-4' }),
  package: React.createElement(Package, { className: 'w-4 h-4' }),
  wrench: React.createElement(Wrench, { className: 'w-4 h-4' }),
  home: React.createElement(Home, { className: 'w-4 h-4' }),
  fish: React.createElement(Fish, { className: 'w-4 h-4' }),
  wheat: React.createElement(Wheat, { className: 'w-4 h-4' }),
  cow: React.createElement(Beef, { className: 'w-4 h-4' }),
  beef: React.createElement(Beef, { className: 'w-4 h-4' }),
};

export const TIPOS_CAMPO: { valor: TipoCampo; etiqueta: string; icono: React.ReactNode }[] = [
  { valor: 'text',           etiqueta: 'Texto corto',    icono: React.createElement(Type,        { className: 'w-3.5 h-3.5' }) },
  { valor: 'number',         etiqueta: 'Número',         icono: React.createElement(Hash,        { className: 'w-3.5 h-3.5' }) },
  { valor: 'textarea',       etiqueta: 'Texto largo',    icono: React.createElement(AlignLeft,   { className: 'w-3.5 h-3.5' }) },
  { valor: 'select',         etiqueta: 'Selector',       icono: React.createElement(List,        { className: 'w-3.5 h-3.5' }) },
  { valor: 'autocomplete',   etiqueta: 'Autocompletar',  icono: React.createElement(Zap,         { className: 'w-3.5 h-3.5' }) },
  { valor: 'checkbox',       etiqueta: 'Sí / No',        icono: React.createElement(CheckSquare, { className: 'w-3.5 h-3.5' }) },
  { valor: 'radio',          etiqueta: 'Radio',          icono: React.createElement(CircleDot,   { className: 'w-3.5 h-3.5' }) },
  { valor: 'checkbox_group', etiqueta: 'Múltiple',       icono: React.createElement(ListChecks,  { className: 'w-3.5 h-3.5' }) },
];

export const ETIQUETA_TIPO = Object.fromEntries(TIPOS_CAMPO.map((f) => [f.valor, f.etiqueta])) as Record<TipoCampo, string>;
export const ICONO_TIPO    = Object.fromEntries(TIPOS_CAMPO.map((f) => [f.valor, f.icono]))    as Record<TipoCampo, React.ReactNode>;
export const TIPOS_CON_OPCIONES = new Set<TipoCampo>(['select', 'autocomplete', 'radio', 'checkbox_group']);

export function etiquetaTipo(t: TipoCampo): string {
  return ETIQUETA_TIPO[t] ?? t;
}

export function iconoTipo(t: TipoCampo): React.ReactNode {
  return ICONO_TIPO[t] ?? React.createElement(Type, { className: 'w-3.5 h-3.5' });
}
