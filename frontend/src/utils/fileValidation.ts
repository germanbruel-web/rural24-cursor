/**
 * =====================================================
 * FILE VALIDATION UTILITIES - Validación de Archivos
 * =====================================================
 * Utilidades para validar archivos de imagen antes de subirlos
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  recommendedFormats?: string[];
}

const DEFAULT_OPTIONS: FileValidationOptions = {
  maxSizeMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif'],
  maxWidth: 4096,
  maxHeight: 4096,
  recommendedFormats: ['image/webp', 'image/avif']
};

/**
 * Validar archivo de imagen
 */
export async function validateImageFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  // 1. Validar tipo de archivo
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no permitido. Formatos válidos: ${opts.allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
    };
  }

  // 2. Validar tamaño del archivo
  const sizeMB = file.size / (1024 * 1024);
  if (opts.maxSizeMB && sizeMB > opts.maxSizeMB) {
    return {
      valid: false,
      error: `El archivo es demasiado grande (${sizeMB.toFixed(2)}MB). Máximo permitido: ${opts.maxSizeMB}MB`
    };
  }

  // 3. Advertencia si no es formato recomendado
  if (opts.recommendedFormats && !opts.recommendedFormats.includes(file.type)) {
    warnings.push(
      `Se recomienda usar ${opts.recommendedFormats.map(t => t.split('/')[1].toUpperCase()).join(' o ')} para mejor rendimiento`
    );
  }

  // 4. Validar dimensiones (solo para imágenes raster, no SVG)
  if (file.type !== 'image/svg+xml') {
    try {
      const dimensions = await getImageDimensions(file);
      
      if (opts.minWidth && dimensions.width < opts.minWidth) {
        return {
          valid: false,
          error: `La imagen es muy pequeña. Ancho mínimo: ${opts.minWidth}px (actual: ${dimensions.width}px)`
        };
      }

      if (opts.maxWidth && dimensions.width > opts.maxWidth) {
        return {
          valid: false,
          error: `La imagen es muy grande. Ancho máximo: ${opts.maxWidth}px (actual: ${dimensions.width}px)`
        };
      }

      if (opts.minHeight && dimensions.height < opts.minHeight) {
        return {
          valid: false,
          error: `La imagen es muy pequeña. Alto mínimo: ${opts.minHeight}px (actual: ${dimensions.height}px)`
        };
      }

      if (opts.maxHeight && dimensions.height > opts.maxHeight) {
        return {
          valid: false,
          error: `La imagen es muy grande. Alto máximo: ${opts.maxHeight}px (actual: ${dimensions.height}px)`
        };
      }

      // Advertencia si la imagen es muy grande para web
      if (dimensions.width > 2000 || dimensions.height > 2000) {
        warnings.push('La imagen es grande. Considera optimizarla para mejor rendimiento web');
      }
    } catch (error) {
      return {
        valid: false,
        error: 'No se pudo leer las dimensiones de la imagen'
      };
    }
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Obtener dimensiones de una imagen
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error cargando imagen'));
    };

    img.src = url;
  });
}

/**
 * Formatear tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Generar nombre de archivo único y limpio
 */
export function generateUniqueFileName(originalName: string, prefix?: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const prefixPart = prefix ? `${prefix}-` : '';
  
  return `${prefixPart}${timestamp}-${random}.${ext}`;
}
