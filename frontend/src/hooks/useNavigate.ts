/**
 * Hook centralizado de navegación para Rural24
 * 
 * PROPÓSITO: Eliminar los 45+ `window.location.hash = '#/...'` dispersos
 * y centralizar toda la navegación en un solo punto de control.
 * 
 * USO:
 *   const { navigate, buildUrl } = useNavigate();
 *   navigate('/my-ads');
 *   navigate('/ad/tractor-john-deere-5090');
 *   navigate('/search', { cat: 'maquinarias', prov: 'buenos-aires' });
 * 
 * FUTURO: Cuando se migre a React Router, solo hay que cambiar este archivo.
 */

import { useCallback } from 'react';

type QueryParams = Record<string, string | undefined>;

/**
 * Construye una URL hash a partir de path + query params opcionales.
 * Filtra undefined/null automáticamente.
 */
export function buildHashUrl(path: string, params?: QueryParams): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (!params) return `#${cleanPath}`;
  
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join('&');
  
  return query ? `#${cleanPath}?${query}` : `#${cleanPath}`;
}

/**
 * Navegación imperativa (sin hook, para uso fuera de componentes).
 * Prefiere usar el hook useNavigate() dentro de componentes React.
 */
export function navigateTo(path: string, params?: QueryParams): void {
  window.location.hash = buildHashUrl(path, params).substring(0); // triggers hashchange
}

/**
 * Hook de navegación para componentes React.
 */
export function useNavigate() {
  const navigate = useCallback((path: string, params?: QueryParams) => {
    navigateTo(path, params);
  }, []);

  return { navigate, buildUrl: buildHashUrl };
}
