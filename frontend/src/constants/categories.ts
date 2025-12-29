/**
 * Categorías de productos/avisos agrícolas
 * ⚠️ NOTA: Estos datos están hardcodeados y deben ser reemplazados por datos de la BD
 */
export const CATEGORIES = [
  'Maquinarias',
  'Ganadería',
  'Insumos Agropecuarios',
  'Inmuebles Rurales',
  'Guía del Campo',
] as const;

export type Category = typeof CATEGORIES[number];

/**
 * Subcategorías por categoría
 * ⚠️ NOTA: Estos datos están hardcodeados y deben ser reemplazados por datos de la BD
 */
export const SUBCATEGORIES: Record<string, readonly string[]> = {
  'Maquinarias': [
    'Tractores',
    'Cosechadoras',
    'Sembradoras',
    'Pulverizadoras',
    'Implementos',
    'Tolvas y Acoplados',
    'Otros',
  ] as const,
  'Ganadería': [
    'Bovinos',
    'Ovinos',
    'Porcinos',
    'Equinos',
    'Caprinos',
    'Aves',
    'Otros',
  ] as const,
  'Insumos Agropecuarios': [
    'Semillas',
    'Fertilizantes',
    'Agroquímicos',
    'Alimentos Balanceados',
    'Inoculantes',
    'Otros',
  ] as const,
  'Inmuebles Rurales': [
    'Campos',
    'Quintas',
    'Lotes',
  ] as const,
  'Guía del Campo': [
    'Herramientas Manuales',
    'Equipos de Riego',
    'Generadores',
    'Bombas',
    'Otros',
  ] as const,
} as const;

/**
 * Listado plano de todas las categorías para búsquedas
 */
export const ALL_CATEGORIES = Object.keys(SUBCATEGORIES);

/**
 * Listado plano de todas las subcategorías para búsquedas
 */
export const ALL_SUBCATEGORIES = Object.values(SUBCATEGORIES).flat();
