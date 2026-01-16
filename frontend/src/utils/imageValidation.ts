/**
 * Image Validation Utilities
 * Validación preventiva de imágenes ANTES de subirlas al servidor
 * Fecha: 5 Enero 2026
 */

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  canProceed: boolean;
  dimensions?: ImageDimensions;
}

/**
 * Obtener dimensiones de una imagen desde un File
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen'));
    };
    
    img.src = url;
  });
}

/**
 * Validar imagen ANTES de subir al servidor
 * Detecta problemas comunes y da feedback inmediato
 */
export async function validateImageBeforeUpload(file: File): Promise<ValidationResult> {
  try {
    // 1. Validar tipo de archivo
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/avif'];
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        message: `Formato ${file.type} no permitido. Usá JPG, PNG, WebP, AVIF o HEIC`,
        canProceed: false
      };
    }

    // 2. Validar tamaño (máx 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      return {
        valid: false,
        message: `📁 Archivo muy grande (${sizeMB}MB). Máximo: 10MB`,
        canProceed: false
      };
    }

    // 3. Validar dimensiones y aspect ratio
    const dimensions = await getImageDimensions(file);
    const { aspectRatio } = dimensions;

    // Detectar fotos verticales (portrait)
    if (aspectRatio < 1) {
      return {
        valid: false,
        message: 'FOTO VERTICAL: Girá tu celular HORIZONTALMENTE y volvé a tomar la foto',
        canProceed: false,
        dimensions
      };
    }

    // Validar rango horizontal (1.2 a 2.5)
    if (aspectRatio < 1.2) {
      return {
        valid: false,
        message: `Foto muy cuadrada (${aspectRatio.toFixed(2)}:1). Tomá la foto mostrando más del producto en horizontal`,
        canProceed: false,
        dimensions
      };
    }

    if (aspectRatio > 2.5) {
      return {
        valid: false,
        message: `Foto muy panorámica (${aspectRatio.toFixed(2)}:1). Usá formato 16:9 o 4:3`,
        canProceed: false,
        dimensions
      };
    }

    // ✅ Todo OK
    return {
      valid: true,
      canProceed: true,
      dimensions
    };

  } catch (error: any) {
    return {
      valid: false,
      message: `Error al validar imagen: ${error.message}`,
      canProceed: false
    };
  }
}

/**
 * Validar múltiples imágenes
 */
export async function validateMultipleImages(files: File[]): Promise<Map<string, ValidationResult>> {
  const results = new Map<string, ValidationResult>();
  
  for (const file of files) {
    const result = await validateImageBeforeUpload(file);
    results.set(file.name, result);
  }
  
  return results;
}
