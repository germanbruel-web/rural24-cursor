/**
 * SimpleImageUploader - Upload simple con input file nativo
 * Reemplaza DragDropUploader por feedback UX claro y código mantenible
 * Incluye moderación automática de contenido (NSFW.js)
 * 
 * CONFIGURACIÓN IMAGEN PREDETERMINADA:
 * 1. Subir imagen al CMS Backend (Dashboard Superadmin)
 * 2. Obtener URL de Cloudinary
 * 3. Actualizar constante DEFAULT_IMAGE con la URL y path correctos
 * 4. Los usuarios pueden usar esta imagen con el checkbox "Usar imagen predeterminada"
 */

import React, { useState, useEffect } from 'react';
import { Upload, X, AlertCircle, Loader, Star } from 'lucide-react';
import { uploadsApi } from '../../services/api';
import { notify } from '../../utils/notifications';
import { useImageValidation } from '../../hooks/useImageValidation';
import { useImageCompression } from '../../hooks/useImageCompression';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Imagen predeterminada del sistema - Cloudinary oficial
const DEFAULT_IMAGE = {
  url: 'https://res.cloudinary.com/ruralcloudinary/image/upload/v1767898923/htimuq3ijur4jjtapf1w.jpg',
  path: 'htimuq3ijur4jjtapf1w',
  fallback: 'https://via.placeholder.com/800x600/10b981/ffffff?text=Imagen+Predeterminada'
};

export interface UploadedImage {
  url?: string;
  path?: string;
  file?: File;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  sortOrder: number;      // ✅ Orden de visualización
  isPrimary: boolean;     // ✅ Es la foto principal
}

interface Props {
  maxFiles?: number;
  folder?: 'ads' | 'profiles' | 'banners';
  onImagesChange: (images: UploadedImage[]) => void;
  existingImages?: UploadedImage[];
}

export const SimpleImageUploader: React.FC<Props> = ({
  maxFiles = 8,
  folder = 'ads',
  onImagesChange,
  existingImages = []
}) => {
  const [images, setImages] = useState<UploadedImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);

  // Validación básica de imágenes (sin ML)
  const { validateImage, isValidating } = useImageValidation();
  
  // Compresión automática de imágenes grandes
  const { compressImage, isCompressing, progress } = useImageCompression();

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimiento antes de activar drag
      },
    })
  );

  // Sincronizar con existingImages cuando cambie externamente
  useEffect(() => {
    const needsSync = existingImages.length !== images.length || 
      existingImages.some((ext, idx) => {
        const curr = images[idx];
        return !curr || ext.url !== curr.url || ext.path !== curr.path || ext.status !== curr.status;
      });
    
    if (needsSync) {
      console.log('[SimpleUploader] 🔄 Syncing with existingImages:', existingImages.length);
      // Asegurar sortOrder e isPrimary en sync
      const synced = existingImages.map((img, idx) => ({
        ...img,
        sortOrder: img.sortOrder ?? idx,
        isPrimary: img.isPrimary ?? (idx === 0)
      }));
      setImages(synced);
    }
  }, [existingImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validar cantidad
    if (images.length + files.length > maxFiles) {
      notify.warning(`Máximo ${maxFiles} fotos`);
      return;
    }

    // Validación básica client-side (formato, tamaño, dimensiones)
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = await validateImage(file);
      
      if (!validation.isValid) {
        // Mostrar primer error
        notify.error(validation.errors[0], 5000);
        console.log(`[SimpleUploader] ❌ Validación falló:`, {
          file: file.name,
          errors: validation.errors
        });
        continue;
      }

      // Mostrar warnings (no bloquean)
      if (validation.warnings.length > 0) {
        notify.warning(validation.warnings[0], 3000);
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    setUploading(true);

    // Crear previews locales inmediatamente
    const startIndex = images.length;
    const newImages: UploadedImage[] = validFiles.map((file, idx) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading' as const,
      progress: 0,
      sortOrder: startIndex + idx,
      isPrimary: startIndex === 0 && idx === 0  // Primera imagen es principal
    }));

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // Upload secuencial con feedback
    for (let i = 0; i < validFiles.length; i++) {
      let file = validFiles[i]; // let (no const) para reasignar si se comprime
      const imageIndex = images.length + i;

      try {
        // 🗜️ COMPRIMIR si es necesaria
        const originalSize = file.size;
        if (originalSize > 2 * 1024 * 1024) { // >2MB
          console.log(`[SimpleUploader] 🗜️ Comprimiendo imagen ${i + 1}...`);
          notify.info('Optimizando imagen...', 2000);
          
          const compressionResult = await compressImage(file);
          
          if (compressionResult.success && compressionResult.compressedFile) {
            file = compressionResult.compressedFile;
            console.log(`[SimpleUploader] ✅ Compresión: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(file.size / 1024 / 1024).toFixed(2)}MB (-${compressionResult.reductionPercent}%)`);
          }
        }
        
        console.log(`[SimpleUploader] 📤 Uploading ${i + 1}/${validFiles.length}: ${file.name}`);
        
        const result = await uploadsApi.uploadImage(file, folder);
        
        console.log(`[SimpleUploader] 🔍 RAW result from API:`, result);
        console.log(`[SimpleUploader] ✅ Success:`, {
          url: result.url,
          path: result.path
        });
        console.log(`[SimpleUploader] 🔍 result.url type:`, typeof result.url);
        console.log(`[SimpleUploader] 🔍 result.path type:`, typeof result.path);

        // Actualizar imagen con éxito
        updatedImages[imageIndex] = {
          ...updatedImages[imageIndex],
          url: result.url,
          path: result.path,
          status: 'success',
          progress: 100
        };

        console.log(`[SimpleUploader] 🖼️ updatedImages[${imageIndex}] AFTER update:`, updatedImages[imageIndex]);

        const finalImages = [...updatedImages];
        setImages(finalImages);
        
        // ✅ NOTIFICAR AL PADRE INMEDIATAMENTE con TODO el array actualizado
        console.log(`[SimpleUploader] 📢 Notificando ${finalImages.length} imágenes totales al padre`);
        console.log(`[SimpleUploader] 🔍 All images:`, finalImages.map(img => ({
          status: img.status,
          url: img.url?.substring(0, 50) || 'NO_URL',
          path: img.path || 'NO_PATH'
        })));
        onImagesChange(finalImages);

      } catch (error: any) {
        console.error(`[SimpleUploader] ❌ Error:`, error);

        updatedImages[imageIndex] = {
          ...updatedImages[imageIndex],
          status: 'error',
          error: error.message || 'Error al subir imagen'
        };

        const finalImages = [...updatedImages];
        setImages(finalImages);
        
        // Notificar también en error para mantener sincronización
        onImagesChange(finalImages);
      }
    }

    setUploading(false);
    
    // Reset input para permitir re-seleccionar mismo archivo
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    
    // Reordenar y actualizar isPrimary
    const reindexed = updated.map((img, idx) => ({
      ...img,
      sortOrder: idx,
      isPrimary: idx === 0
    }));
    
    setImages(reindexed);
    onImagesChange(reindexed);
  };

  // ✅ DRAG & DROP: Reordenar imágenes
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setImages((items) => {
      const oldIndex = items.findIndex(img => 
        (img.path || img.preview) === active.id
      );
      const newIndex = items.findIndex(img => 
        (img.path || img.preview) === over.id
      );
      
      if (oldIndex === -1 || newIndex === -1) return items;

      const reordered = arrayMove(items, oldIndex, newIndex);
      
      // Actualizar sortOrder e isPrimary
      const updated = reordered.map((img, idx) => ({
        ...img,
        sortOrder: idx,
        isPrimary: idx === 0
      }));
      
      onImagesChange(updated);
      return updated;
    });
  };

  // ✅ Marcar imagen como principal
  const setAsPrimary = (index: number) => {
    const reordered = [...images];
    const [selected] = reordered.splice(index, 1);
    reordered.unshift(selected);
    
    const updated = reordered.map((img, idx) => ({
      ...img,
      sortOrder: idx,
      isPrimary: idx === 0
    }));
    
    setImages(updated);
    onImagesChange(updated);
  };

  const addDefaultImage = () => {
    console.log('[SimpleUploader] 🔵 Agregando imagen predeterminada...');
    console.log('[SimpleUploader] 📍 URL:', DEFAULT_IMAGE.url);
    console.log('[SimpleUploader] 📂 Path:', DEFAULT_IMAGE.path);
    
    // Verificar que la imagen carga antes de agregarla
    const img = new Image();
    img.onload = () => {
      console.log('[SimpleUploader] ✅ Imagen predeterminada cargada correctamente');
      
      // Imagen predeterminada del sistema (del CMS Backend)
      const defaultImage: UploadedImage = {
        url: DEFAULT_IMAGE.url,
        path: DEFAULT_IMAGE.path,
        status: 'success',
        progress: 100,
        sortOrder: images.length,
        isPrimary: images.length === 0
      };

      const updated = [...images, defaultImage];
      console.log('[SimpleUploader] ✅ Array actualizado con', updated.length, 'imágenes');
      console.log('[SimpleUploader] 🖼️ Imagen agregada:', defaultImage);
      
      setImages(updated);
      onImagesChange(updated);
    };
    
    img.onerror = () => {
      console.error('[SimpleUploader] ❌ Error cargando imagen predeterminada, usando fallback');
      
      // Usar fallback si la imagen principal falla
      const defaultImage: UploadedImage = {
        url: DEFAULT_IMAGE.fallback,
        path: 'fallback/placeholder',
        status: 'success',
        progress: 100,
        sortOrder: images.length,
        isPrimary: images.length === 0
      };

      const updated = [...images, defaultImage];
      setImages(updated);
      onImagesChange(updated);
    };
    
    img.src = DEFAULT_IMAGE.url;
  };

  return (
    <div className="space-y-4">
      {/* Botón de Upload - Compacto mobile */}
      <label className="block">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/avif"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || images.length >= maxFiles}
          className="hidden"
        />
        
        <div className={`
          border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-all
          ${uploading || images.length >= maxFiles
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
            : 'border-green-400 bg-green-50 hover:bg-green-100 hover:border-green-500'
          }
        `}>
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin text-green-600" />
              <span className="text-sm font-medium text-gray-700">Subiendo...</span>
            </div>
          ) : images.length >= maxFiles ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Máximo alcanzado</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Upload className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Subir fotos</span>
              <span className="text-xs text-gray-400 hidden sm:inline">• máx 5MB</span>
            </div>
          )}
        </div>
      </label>

      {/* Botón: Imagen predeterminada - Compacto */}
      {images.length < maxFiles && !uploading && (
        <button
          type="button"
          onClick={addDefaultImage}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <img 
            src={DEFAULT_IMAGE.url} 
            alt=""
            className="w-8 h-8 rounded object-cover"
            onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE.fallback; }}
          />
          <span>Usar imagen de ejemplo</span>
        </button>
      )}

      {/* Grid de imágenes subidas CON DRAG & DROP */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map(img => img.path || img.preview || '')}>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {images.map((image, index) => (
                <SortableImage
                  key={image.path || image.preview || index}
                  image={image}
                  index={index}
                  onRemove={() => removeImage(index)}
                  onSetPrimary={() => setAsPrimary(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

// ✅ COMPONENTE SORTABLE PARA CADA IMAGEN
interface SortableImageProps {
  image: UploadedImage;
  index: number;
  onRemove: () => void;
  onSetPrimary: () => void;
}

const SortableImage: React.FC<SortableImageProps> = ({ image, index, onRemove, onSetPrimary }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.path || image.preview || '' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative aspect-square rounded overflow-hidden bg-gray-100 ${
        isDragging ? 'shadow-xl z-50 scale-105' : ''
      } ${image.isPrimary ? 'ring-2 ring-green-500' : ''}`}
      style={style}
      {...attributes}
      {...listeners}
    >
      {/* Preview de imagen */}
      <img
        src={image.preview || image.url}
        alt={`Foto ${index + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Badge PORTADA - solo icono */}
      {image.isPrimary && image.status === 'success' && (
        <div className="absolute top-1 left-1 bg-green-500 text-white p-1 rounded" title="Portada">
          <Star className="w-3 h-3 fill-current" />
        </div>
      )}

      {/* Número de orden - solo para no-primarias */}
      {!image.isPrimary && image.status === 'success' && (
        <button
          onClick={onSetPrimary}
          className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
          title="Hacer portada"
        >
          {index + 1}
        </button>
      )}

      {/* Overlay estado uploading/error */}
      {image.status !== 'success' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          {image.status === 'uploading' && (
            <Loader className="w-5 h-5 animate-spin text-white" />
          )}
          {image.status === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
        </div>
      )}

      {/* Botón eliminar */}
      {image.status !== 'uploading' && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
          aria-label="Eliminar"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
