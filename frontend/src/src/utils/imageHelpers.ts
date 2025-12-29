// =====================================================
// IMAGE HELPERS - Sistema Unificado de Imágenes
// =====================================================
// Maneja la inconsistencia entre:
// - images (array de strings legacy)
// - ad_images (tabla relacional)
// - Objetos {url, sort_order}

export interface NormalizedImage {
  url: string;
  sort_order: number;
}

/**
 * Normaliza cualquier formato de imagen a un array consistente
 * Maneja: strings, objetos {url}, objetos {url, sort_order}, arrays mixtos
 */
export function normalizeImages(images: any): NormalizedImage[] {
  if (!images) return [];

  // Si es un array
  if (Array.isArray(images)) {
    return images
      .map((img, index) => {
        // Si es string (formato legacy)
        if (typeof img === 'string') {
          return { url: img, sort_order: index };
        }
        
        // Si es objeto con url
        if (typeof img === 'object' && img !== null) {
          return {
            url: img.url || '',
            sort_order: img.sort_order ?? index,
          };
        }
        
        return null;
      })
      .filter((img): img is NormalizedImage => 
        img !== null && typeof img.url === 'string' && img.url.length > 0
      )
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  // Si es un solo objeto
  if (typeof images === 'object' && images.url) {
    return [{ url: images.url, sort_order: 0 }];
  }

  // Si es un string
  if (typeof images === 'string') {
    return [{ url: images, sort_order: 0 }];
  }

  return [];
}

/**
 * Obtiene la primera imagen de cualquier formato
 */
export function getFirstImage(images: any): string {
  const normalized = normalizeImages(images);
  return normalized[0]?.url || '/images/preview-image.webp';
}

/**
 * Obtiene todas las URLs como array simple de strings
 */
export function getImageUrls(images: any): string[] {
  return normalizeImages(images).map(img => img.url);
}

/**
 * Valida que una URL de imagen sea válida
 */
export function isValidImageUrl(url: any): boolean {
  if (typeof url !== 'string') return false;
  if (url.length === 0) return false;
  if (url === '/images/preview-image.webp') return false;
  
  // Validar que sea una URL válida
  try {
    new URL(url);
    return true;
  } catch {
    // Si no es URL absoluta, verificar que sea path relativo válido
    return url.startsWith('/') || url.startsWith('http');
  }
}
