// src/services/imageOptimizer.ts

/**
 * Servicio de optimización de imágenes para mobile-first
 * - Comprime imágenes a máximo 1MB
 * - Genera thumbnails optimizados
 * - Mantiene calidad visual aceptable
 */

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  quality: number;
  thumbnailSize?: number;
}

interface OptimizedImage {
  file: File;
  thumbnail?: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export class ImageOptimizer {
  // Configuración por defecto - Mobile First
  private static readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxSizeMB: 1, // 1MB máximo por imagen
    maxWidthOrHeight: 1920, // Full HD máximo
    quality: 0.85, // 85% de calidad
    thumbnailSize: 400, // 400px para thumbnails
  };

  /**
   * Comprime una imagen a máximo 1MB manteniendo calidad visual
   */
  static async compressImage(
    file: File,
    options: Partial<CompressionOptions> = {}
  ): Promise<OptimizedImage> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const originalSize = file.size;

    try {
      // Si ya es menor a 1MB y es una imagen pequeña, no comprimir
      if (originalSize <= opts.maxSizeMB * 1024 * 1024) {
        const dimensions = await this.getImageDimensions(file);
        if (dimensions.width <= opts.maxWidthOrHeight && dimensions.height <= opts.maxWidthOrHeight) {
          return {
            file,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 1,
          };
        }
      }

      // Comprimir imagen
      const compressedFile = await this.compress(file, opts);
      const thumbnail = opts.thumbnailSize 
        ? await this.createThumbnail(file, opts.thumbnailSize)
        : undefined;

      return {
        file: compressedFile,
        thumbnail,
        originalSize,
        compressedSize: compressedFile.size,
        compressionRatio: compressedFile.size / originalSize,
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('No se pudo comprimir la imagen');
    }
  }

  /**
   * Comprime múltiples imágenes en paralelo
   * Límite total: 8MB para 8 imágenes
   */
  static async compressMultipleImages(
    files: File[],
    options: Partial<CompressionOptions> = {}
  ): Promise<OptimizedImage[]> {
    const maxImages = 8;
    const maxTotalSize = 8 * 1024 * 1024; // 8MB total

    if (files.length > maxImages) {
      throw new Error(`Máximo ${maxImages} imágenes permitidas`);
    }

    // Comprimir todas en paralelo
    const results = await Promise.all(
      files.map(file => this.compressImage(file, options))
    );

    // Verificar tamaño total
    const totalSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    
    if (totalSize > maxTotalSize) {
      // Si supera 8MB, comprimir más agresivamente
      console.warn(`Tamaño total ${(totalSize / 1024 / 1024).toFixed(2)}MB supera 8MB. Comprimiendo más...`);
      
      return await Promise.all(
        files.map(file => this.compressImage(file, {
          ...options,
          maxSizeMB: 0.8, // Reducir a 800KB por imagen
          quality: 0.75, // Reducir calidad al 75%
        }))
      );
    }

    return results;
  }

  /**
   * Comprime la imagen usando Canvas
   */
  private static async compress(
    file: File,
    options: CompressionOptions
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calcular nuevas dimensiones manteniendo aspect ratio
          let { width, height } = img;
          const maxDimension = options.maxWidthOrHeight;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          // Crear canvas y comprimir
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('No se pudo crear contexto de canvas'));
            return;
          }

          // Dibujar imagen optimizada
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a Blob con compresión
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('No se pudo generar imagen comprimida'));
                return;
              }

              // Si aún es muy grande, reducir calidad iterativamente
              if (blob.size > options.maxSizeMB * 1024 * 1024 && options.quality > 0.5) {
                this.compress(file, {
                  ...options,
                  quality: options.quality - 0.1,
                }).then(resolve).catch(reject);
                return;
              }

              // Crear nuevo File con el blob comprimido
              const compressedFile = new File(
                [blob],
                file.name,
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              );

              resolve(compressedFile);
            },
            'image/jpeg',
            options.quality
          );
        };

        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Crea un thumbnail pequeño para previews rápidos
   */
  private static async createThumbnail(
    file: File,
    size: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calcular dimensiones del thumbnail (cuadrado)
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('No se pudo crear contexto de canvas'));
            return;
          }

          // Calcular crop centrado
          const scale = Math.max(size / img.width, size / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (size - scaledWidth) / 2;
          const y = (size - scaledHeight) / 2;

          // Dibujar thumbnail
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          // Convertir a Blob con alta compresión
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('No se pudo generar thumbnail'));
                return;
              }

              const thumbnailFile = new File(
                [blob],
                `thumb_${file.name}`,
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              );

              resolve(thumbnailFile);
            },
            'image/jpeg',
            0.7 // 70% calidad para thumbnails
          );
        };

        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Obtiene dimensiones de una imagen
   */
  private static async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Valida que un archivo sea una imagen válida
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'El archivo debe ser una imagen' };
    }

    // Validar extensión
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !validExtensions.includes(extension)) {
      return { 
        valid: false, 
        error: 'Solo se aceptan imágenes JPG, PNG o WebP' 
      };
    }

    // Validar tamaño máximo antes de comprimir (50MB)
    const maxOriginalSize = 50 * 1024 * 1024;
    if (file.size > maxOriginalSize) {
      return { 
        valid: false, 
        error: 'La imagen original es demasiado grande (máx 50MB)' 
      };
    }

    return { valid: true };
  }

  /**
   * Formatea tamaño de archivo para mostrar
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default ImageOptimizer;
