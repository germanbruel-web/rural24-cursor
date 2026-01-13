// ====================================================================
// URL FILTER UTILS - Manejo de filtros via query params GET
// ====================================================================

export interface FilterParams {
  q?: string;           // Búsqueda por texto
  cat?: string;         // Categoría (slug)
  sub?: string;         // Subcategoría (slug)
  prov?: string;        // Provincia
  cond?: string;        // Condición (nuevo/usado)
  [key: string]: string | undefined; // Atributos dinámicos
}

/**
 * Parsea los query params de la URL actual
 */
export function parseFilterParams(): FilterParams {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  
  if (queryIndex === -1) return {};
  
  const queryString = hash.substring(queryIndex + 1);
  const params = new URLSearchParams(queryString);
  const result: FilterParams = {};
  
  params.forEach((value, key) => {
    result[key] = decodeURIComponent(value);
  });
  
  return result;
}

/**
 * Genera una URL con los filtros especificados
 */
export function buildFilterUrl(
  basePath: string,
  filters: FilterParams,
  updates: Partial<FilterParams> = {}
): string {
  const merged = { ...filters, ...updates };
  
  // Eliminar valores vacíos
  Object.keys(merged).forEach(key => {
    if (!merged[key]) delete merged[key];
  });
  
  const params = new URLSearchParams();
  Object.entries(merged).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Navega a una URL con filtros (actualiza el hash)
 */
export function navigateWithFilters(
  basePath: string,
  filters: FilterParams,
  updates: Partial<FilterParams> = {}
): void {
  const url = buildFilterUrl(basePath, filters, updates);
  window.location.hash = url;
}

/**
 * Genera slug desde texto
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
