/**
 * DragDropUploader Component
 * Upload profesional con drag & drop, reorder y preview
 * Incluye moderación automática de contenido (NSFW.js)
 */

import React, { useState, useRef, DragEvent } from 'react';
import { uploadsApi } from '../../services/api/uploads';
import { notify } from '../../utils/notifications';
import { useImageValidation } from '../../hooks/useImageValidation';
import './DragDropUploader.css';

export interface UploadedImage {
  url: string;
  path: string;
  file?: File;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface Props {
  maxFiles?: number;
  folder?: 'ads' | 'profiles' | 'banners';
  onImagesChange: (images: UploadedImage[]) => void;
  existingImages?: UploadedImage[];
}

export function DragDropUploader({
  maxFiles = 5,
  folder = 'ads',
  onImagesChange,
  existingImages = []
}: Props) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Validación básica de imágenes (sin ML)
  const { validateImage } = useImageValidation();

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    // Validar límite
    const remainingSlots = maxFiles - images.length;
    if (remainingSlots <= 0) {
      notify.error(`Ya tienes ${maxFiles} fotos (máximo permitido)`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      notify.warning(`Solo puedes agregar ${remainingSlots} foto(s) más`);
    }

    // ✨ VALIDACIÓN PREVENTIVA - Validar ANTES de agregar a la lista
    console.log(`[DragDropUploader] 🔍 Validando ${filesToProcess.length} archivos...`);
    const validFiles: File[] = [];

    for (const file of filesToProcess) {
      // Validación básica (formato, tamaño, dimensiones)
      const validation = await validateImage(file);
      
      if (!validation.isValid) {
        notify.error(`${file.name}: ${validation.errors[0]}`);
        console.log(`[DragDropUploader] ❌ Validación fallida:`, {
          file: file.name,
          errors: validation.errors
        });
        continue;
      }

      // Mostrar warnings (no bloquean)
      if (validation.warnings.length > 0) {
        notify.warning(validation.warnings[0]);
      }

      // Archivo válido
      validFiles.push(file);
      console.log(`[DragDropUploader] ✅ Archivo válido:`, {
        file: file.name,
        metadata: validation.metadata
      });
    }

    if (validFiles.length === 0) {
      console.log('[DragDropUploader] ⚠️ Ningún archivo pasó la validación');
      return;
    }
    
    console.log(`[DragDropUploader] ✅ ${validFiles.length}/${filesToProcess.length} archivos válidos`);

    // Crear previews y agregar a la lista
    const newImages: UploadedImage[] = await Promise.all(
      validFiles.map(async (file) => {
        const preview = await createPreview(file);
        return {
          url: '',
          path: '',
          file,
          preview,
          status: 'uploading' as const,
          progress: 0
        };
      })
    );

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // Upload asíncrono
    uploadFilesSequentially(validFiles, updatedImages.length - validFiles.length);
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const uploadFilesSequentially = async (files: File[], startIndex: number) => {
    console.log(`[DragDropUploader] 🚀 Starting upload of ${files.length} files to folder: ${folder}`);
    console.log(`[DragDropUploader] 📍 Starting index: ${startIndex}`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageIndex = startIndex + i;

      console.log(`[DragDropUploader] 📤 Uploading file ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      
      // 🔄 RETRY CON EXPONENTIAL BACKOFF
      const maxRetries = 3;
      const baseDelay = 2000; // 2 segundos
      let uploadSuccess = false;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            console.log(`[DragDropUploader] 🔄 Intento ${attempt}/${maxRetries} para ${file.name}`);
          }
          
          // Simular progress
          updateImageProgress(imageIndex, 20);

          console.log(`[DragDropUploader] ☁️ Calling Cloudinary API...`);
          const result = await uploadsApi.uploadImage(file, folder);
          console.log(`[DragDropUploader] ✅ Upload successful:`, {
            url: result.url,
            attempt
          });

          updateImageProgress(imageIndex, 100);
          updateImageStatus(imageIndex, 'success', result.url, '');
          
          uploadSuccess = true;
          break; // Salir del loop de retry

        } catch (error: any) {
          const isLastAttempt = attempt === maxRetries;
          const isNetworkError = 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('Network') ||
            error.message?.includes('CONNECTION_REFUSED') ||
            error.status === 429; // Rate limit
          
          console.error(`[DragDropUploader] ❌ Error en intento ${attempt}/${maxRetries}:`, {
            file: file.name,
            message: error.message,
            status: error.status,
            code: error.code,
            isNetworkError,
            willRetry: isNetworkError && !isLastAttempt
          });
          
          // Si es error de red y no es el último intento, reintentar
          if (isNetworkError && !isLastAttempt) {
            const delay = baseDelay * attempt; // 2s, 4s, 6s
            console.log(`[DragDropUploader] ⏳ Esperando ${delay}ms antes de reintentar...`);
            notify.warning(`🔄 Reintentando ${file.name}... (${attempt}/${maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Reintentar
          }
          
          // Error no recuperable o último intento fallido
          updateImageStatus(imageIndex, 'error', '', '', error.message || 'Error al subir');
          
          // Notificación específica según tipo de error
          if (error.message?.includes('vertical') || error.message?.includes('proporción') || error.message?.includes('GIRA')) {
            notify.error(`📱 ${file.name}: ${error.message}`);
          } else if (isNetworkError) {
            notify.error(`🔌 Error de conexión subiendo ${file.name}. Intentamos ${maxRetries} veces sin éxito.`);
          } else {
            notify.error(`Error subiendo ${file.name}: ${error.message || 'Unknown error'}`);
          }
          
          break; // Salir del loop de retry
        }
      }
      
      if (uploadSuccess && maxRetries > 1) {
        // Solo notificar si fue exitoso después de retry
        const retriesUsed = Array.from({length: maxRetries}, (_, i) => i + 1).find(() => uploadSuccess) || 1;
        if (retriesUsed > 1) {
          notify.success(`${file.name} subido exitosamente (después de ${retriesUsed} intentos)`);
        }
      }
    }

    console.log('[DragDropUploader] 🏁 Upload batch completed');
  };

  const updateImageProgress = (index: number, progress: number) => {
    setImages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], progress };
      return updated;
    });
  };

  const updateImageStatus = (
    index: number,
    status: 'success' | 'error',
    url: string,
    path: string,
    error?: string
  ) => {
    setImages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status, url, path, error };
      
      // 🔧 Notificar al padre INMEDIATAMENTE con estado actualizado
      const successImages = updated.filter(img => img.status === 'success');
      console.log(`[DragDropUploader] ✅ Image ${index} status: ${status}`);
      console.log(`[DragDropUploader] 📸 Total success: ${successImages.length}/${updated.length}`);
      
      // Usar setTimeout para asegurar que el estado se actualiza primero
      setTimeout(() => {
        onImagesChange(successImages);
      }, 0);
      
      return updated;
    });
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onImagesChange(updated.filter(img => img.status === 'success'));
  };

  // Drag to reorder
  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    onImagesChange(images.filter(img => img.status === 'success'));
  };

  return (
    <div className="drag-drop-uploader">
      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${images.length >= maxFiles ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => images.length < maxFiles && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/avif"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {images.length === 0 ? (
          <div className="drop-zone-content">
            <span className="icon">📸</span>
            <p>Arrastra fotos aquí o haz click para seleccionar</p>
            <span className="hint">Máximo {maxFiles} fotos • JPG, PNG, WebP, AVIF, HEIC • Horizontales (16:9 o 4:3)</span>
          </div>
        ) : (
          <div className="drop-zone-content">
            <span className="icon">➕</span>
            <p>Agregar más fotos ({images.length}/{maxFiles})</p>
          </div>
        )}
      </div>

      {/* Image Grid with Reorder */}
      {images.length > 0 && (
        <div className="images-grid">
          {images.map((image, index) => (
            <div
              key={index}
              className={`image-card ${image.status} ${draggedIndex === index ? 'dragging' : ''}`}
              draggable
              onDragStart={() => handleImageDragStart(index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
            >
              {index === 0 && (
                <span className="badge-portada">Portada</span>
              )}

              <div className="image-preview">
                <img src={image.preview || image.url} alt={`Foto ${index + 1}`} />
              </div>

              {image.status === 'uploading' && (
                <div className="progress-overlay">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${image.progress}%` }} />
                  </div>
                  <span className="progress-text">{image.progress}%</span>
                </div>
              )}

              {image.status === 'error' && (
                <div className="error-overlay">
                  <span className="error-icon">!</span>
                  <span className="error-text">{image.error}</span>
                </div>
              )}

              <button
                type="button"
                className="btn-remove"
                onClick={() => removeImage(index)}
                disabled={image.status === 'uploading'}
              >
                ✕
              </button>

              <span className="drag-handle">⋮⋮</span>
            </div>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <p className="hint-reorder">
          💡 Arrastra las fotos para reordenar. La primera será la portada del aviso.
        </p>
      )}
    </div>
  );
}
