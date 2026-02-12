/**
 * useImageValidation Hook
 * Validaciones básicas client-side (sin ML)
 * 
 * Estrategia de seguridad en capas:
 * 1. Client-side: Validaciones básicas (este hook)
 * 2. Backend: Cloudinary Moderation AI (configurar en backend)
 * 3. Post-moderación: Sistema de reportes + confianza de usuario
 * 
 * Fecha: 12 Febrero 2026
 */

import { useState, useCallback } from 'react';

// Configuración de validaciones (RELAJADA para maximizar conversión)
const VALIDATION_CONFIG = {
  // Formatos permitidos
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const,
  
  // Tamaños máximos (permisivo - compresión automática)
  maxSizeBytes: 15 * 1024 * 1024, // 15MB (cubre 99% smartphones)
  maxSizeMB: 15,
  
  // Umbral para compresión automática
  compressionThresholdBytes: 2 * 1024 * 1024, // >2MB se comprime
  
  // Dimensiones máximas (8K para futureproofing)
  maxWidth: 8192,
  maxHeight: 8192,
  
  // Dimensiones mínimas (evitar píxeles/spam)
  minWidth: 200,
  minHeight: 200,
  
  // Sin restricción de aspect ratio (cualquier proporción)
} as const;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  needsCompression: boolean; // Nueva flag
  metadata?: {
    width: number;
    height: number;
    sizeKB: number;
    format: string;
    aspectRatio: number;
  };
}

/**
 * Hook para validaciones básicas de imágenes
 * Ultra ligero, sin dependencias externas, <1ms de ejecución
 */
export function useImageValidation() {
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validar archivo de imagen
   */
  const validateImage = useCallback(async (file: File): Promise<ValidationResult> => {
    setIsValidating(true);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 1. Validar formato
      if (!VALIDATION_CONFIG.allowedFormats.includes(file.type as any)) {
        errors.push(
          `Formato no permitido. Solo: JPEG, PNG, WebP (recibido: ${file.type})`
        );
      }

      // 2. Validar tamaño
      if (file.size > VALIDATION_CONFIG.maxSizeBytes) {
        errors.push(
          `Imagen muy pesada. Máximo: ${VALIDATION_CONFIG.maxSizeMB}MB ` +
          `(tu imagen: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
        );
      }

      // 3. Validar dimensiones (requiere cargar imagen)
      const dimensions = await getImageDimensions(file);
      
      // Calcular aspect ratio
      const aspectRatio = dimensions.width / dimensions.height;
      
      if (dimensions.width > VALIDATION_CONFIG.maxWidth || 
          dimensions.height > VALIDATION_CONFIG.maxHeight) {
        errors.push(
          `Dimensiones excesivas. Máximo: ${VALIDATION_CONFIG.maxWidth}x${VALIDATION_CONFIG.maxHeight}px ` +
          `(tu imagen: ${dimensions.width}x${dimensions.height}px)`
        );
      }

      if (dimensions.width < VALIDATION_CONFIG.minWidth || 
          dimensions.height < VALIDATION_CONFIG.minHeight) {
        errors.push(
          `Imagen muy pequeña. Mínimo: ${VALIDATION_CONFIG.minWidth}x${VALIDATION_CONFIG.minHeight}px ` +
          `(tu imagen: ${dimensions.width}x${dimensions.height}px)`
        );
      }

      // 4. Determinar si necesita compresión
      const needsCompression = file.size > VALIDATION_CONFIG.compressionThresholdBytes;
      
      // 5. Advertencias informativas (no bloquean)
      if (needsCompression) {
        warnings.push('Optimizaremos tu imagen automáticamente para carga más rápida');
      }

      if (dimensions.width > 4096 || dimensions.height > 4096) {
        warnings.push('Imagen de alta resolución, se optimizará para web');
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        needsCompression: file.size > VALIDATION_CONFIG.compressionThresholdBytes,
        metadata: {
          width: dimensions.width,
          height: dimensions.height,
          sizeKB: Math.round(file.size / 1024),
          format: file.type,
          aspectRatio: aspectRatio,
        },
      };

      return result;
      
    } catch (error) {
      console.error('[ImageValidation] Error validando imagen:', error);
      return {
        isValid: false,
        errors: ['Error al validar la imagen. Intenta con otra.'],
        warnings: [],
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validateImage,
    isValidating,
    config: VALIDATION_CONFIG,
  };
}

/**
 * Helper: Obtener dimensiones de imagen sin cargarla completamente
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
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
 * Helper: Formatear bytes a texto legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}
