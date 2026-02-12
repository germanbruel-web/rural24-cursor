/**
 * useImageCompression Hook
 * Compresión automática de imágenes client-side
 * 
 * Estrategia:
 * - Imágenes >2MB se comprimen automáticamente
 * - Target: ~1MB final (balance calidad/peso)
 * - Mantiene metadata (EXIF, orientación)
 * - Feedback visual durante proceso
 * 
 * Fecha: 12 Febrero 2026
 */

import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

// Configuración de compresión
const COMPRESSION_CONFIG = {
  // Target size en MB (objetivo final)
  maxSizeMB: 1,
  
  // Ancho máximo (mantiene aspect ratio)
  maxWidthOrHeight: 2048,
  
  // Calidad (0-1)
  initialQuality: 0.85,
  
  // Usar WebWorker para no bloquear UI
  useWebWorker: true,
  
  // Mantener orientación EXIF
  preserveExif: true,
} as const;

export interface CompressionResult {
  success: boolean;
  compressedFile?: File;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  error?: string;
}

/**
 * Hook para comprimir imágenes grandes
 */
export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Comprimir imagen si es necesaria
   */
  const compressImage = useCallback(async (
    file: File
  ): Promise<CompressionResult> => {
    const originalSize = file.size;
    
    // Si ya es pequeña, skip compresión
    if (originalSize < 2 * 1024 * 1024) { // <2MB
      return {
        success: true,
        compressedFile: file,
        originalSize,
        compressedSize: originalSize,
        reductionPercent: 0,
      };
    }

    setIsCompressing(true);
    setProgress(0);

    try {
      console.log(`[ImageCompression] 🗜️ Comprimiendo: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);
      
      // Configuración adaptativa según tamaño original
      const options = {
        ...COMPRESSION_CONFIG,
        maxSizeMB: originalSize > 8 * 1024 * 1024 ? 1.5 : 1, // Más agresivo para >8MB
        onProgress: (percent: number) => {
          setProgress(percent);
        },
      };

      const compressedFile = await imageCompression(file, options);
      const compressedSize = compressedFile.size;
      const reductionPercent = Math.round(((originalSize - compressedSize) / originalSize) * 100);

      console.log(`[ImageCompression] ✅ Compresión exitosa:`, {
        original: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
        compressed: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
        reduction: `${reductionPercent}%`,
      });

      return {
        success: true,
        compressedFile,
        originalSize,
        compressedSize,
        reductionPercent,
      };

    } catch (error: any) {
      console.error('[ImageCompression] ❌ Error:', error);
      
      // Fallback: usar archivo original si falla compresión
      return {
        success: false,
        compressedFile: file,
        originalSize,
        compressedSize: originalSize,
        reductionPercent: 0,
        error: error.message || 'Error al comprimir imagen',
      };

    } finally {
      setIsCompressing(false);
      setProgress(0);
    }
  }, []);

  /**
   * Comprimir múltiples imágenes en lote
   */
  const compressMultiple = useCallback(async (
    files: File[]
  ): Promise<CompressionResult[]> => {
    const results: CompressionResult[] = [];
    
    for (const file of files) {
      const result = await compressImage(file);
      results.push(result);
    }
    
    return results;
  }, [compressImage]);

  return {
    compressImage,
    compressMultiple,
    isCompressing,
    progress,
  };
}

/**
 * Helper: Formatear bytes a texto legible
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
