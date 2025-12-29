/**
 * Configuración centralizada de la API Backend
 */

export const API_CONFIG = {
  // URL base de la API Backend v2.0
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  
  // Endpoints disponibles
  ENDPOINTS: {
    // Health & Status
    HEALTH: '/api/health',
    
    // Search
    SEARCH: '/api/search',
    
    // Categories
    CATEGORIES: '/api/categories',
    
    // Banners
    BANNERS: '/api/banners',
    
    // Jobs (Manual execution)
    JOBS: {
      IMAGE_OPTIMIZATION: '/api/jobs/image-optimization',
      DUPLICATE_DETECTION: '/api/jobs/duplicate-detection',
      CLEANUP: '/api/jobs/cleanup',
    },
  },
  
  // Timeouts
  TIMEOUT: {
    DEFAULT: 30000, // 30 segundos
    IMAGE_OPTIMIZATION: 120000, // 2 minutos para optimización de imágenes
  },
};

/**
 * Helper para construir URLs completas
 */
export function buildApiUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(endpoint, API_CONFIG.BASE_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

/**
 * Helper para hacer fetch con configuración por defecto
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, any>; timeout?: number }
): Promise<T> {
  const { params, timeout = API_CONFIG.TIMEOUT.DEFAULT, ...fetchOptions } = options || {};
  
  const url = buildApiUrl(endpoint, params);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}

/**
 * Check if the API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiFetch(API_CONFIG.ENDPOINTS.HEALTH, { timeout: 5000 });
    return response.status === 'ok';
  } catch {
    return false;
  }
}
