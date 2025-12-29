// src/services/uploadService.ts
import { supabase } from './supabaseClient';
import { ImageOptimizer } from './imageOptimizer';

/**
 * Servicio para subir imágenes a Supabase Storage
 * Optimizado para mobile-first con compresión automática
 */

const BUCKET_NAME = 'ads-images'; // Nombre del bucket en Supabase

export const uploadService = {
  /**
   * Sube una imagen al bucket de Supabase Storage
   * NUEVA VERSIÓN: Comprime automáticamente a máximo 1MB
   */
  async uploadImage(file: File, folder: string = 'ads'): Promise<{ url: string; path: string }> {
    try {
      // Validar archivo
      const validation = ImageOptimizer.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // OPTIMIZACIÓN AUTOMÁTICA - Comprimir a 1MB máximo
      console.log(`📦 Optimizando imagen: ${file.name} (${ImageOptimizer.formatFileSize(file.size)})`);
      
      const optimized = await ImageOptimizer.compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.85,
      });

      console.log(`✅ Imagen optimizada: ${ImageOptimizer.formatFileSize(optimized.compressedSize)} (${Math.round(optimized.compressionRatio * 100)}% del original)`);

      const fileToUpload = optimized.file;

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileName = `${folder}/${timestamp}-${randomStr}.jpg`; // Siempre JPG después de optimizar

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading to Supabase:', error);
        throw new Error(error.message);
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path,
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  /**
   * Sube múltiples imágenes
   * NUEVA VERSIÓN: Optimiza todas juntas con límite de 8MB total
   */
  async uploadMultipleImages(files: File[], folder: string = 'ads'): Promise<string[]> {
    try {
      const maxImages = 8;
      
      if (files.length > maxImages) {
        throw new Error(`Máximo ${maxImages} imágenes permitidas`);
      }

      // OPTIMIZACIÓN EN LOTE
      console.log(`📦 Optimizando ${files.length} imágenes...`);
      const optimizedImages = await ImageOptimizer.compressMultipleImages(files);

      const totalSize = optimizedImages.reduce((sum, img) => sum + img.compressedSize, 0);
      console.log(`✅ Total optimizado: ${ImageOptimizer.formatFileSize(totalSize)} (máx 8MB)`);

      // Subir todas las imágenes optimizadas
      const uploadPromises = optimizedImages.map((optimized, index) => 
        this.uploadImage(optimized.file, folder)
      );
      
      const results = await Promise.all(uploadPromises);
      return results.map(result => result.url);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  },

  /**
   * Elimina una imagen del bucket
   */
  async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('Error deleting image:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  },

  /**
   * Elimina múltiples imágenes
   */
  async deleteMultipleImages(paths: string[]): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(paths);

      if (error) {
        console.error('Error deleting images:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Delete multiple error:', error);
      throw error;
    }
  },
};
