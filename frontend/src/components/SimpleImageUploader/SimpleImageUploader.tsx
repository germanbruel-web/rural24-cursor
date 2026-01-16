/**
 * SimpleImageUploader - Upload simple con input file nativo
 * Reemplaza DragDropUploader por feedback UX claro y código mantenible
 * 
 * CONFIGURACIÓN IMAGEN PREDETERMINADA:
 * 1. Subir imagen al CMS Backend (Dashboard Superadmin)
 * 2. Obtener URL de Cloudinary
 * 3. Actualizar constante DEFAULT_IMAGE con la URL y path correctos
 * 4. Los usuarios pueden usar esta imagen con el checkbox "Usar imagen predeterminada"
 */

import React, { useState, useEffect } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader, GripVertical, Star } from 'lucide-react';
import { uploadsApi } from '../../services/api';
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
      alert(`Máximo ${maxFiles} imágenes permitidas`);
      return;
    }

    // Validar tamaño (5MB por imagen)
    const MAX_SIZE = 5 * 1024 * 1024;
    const oversized = files.filter(f => f.size > MAX_SIZE);
    if (oversized.length > 0) {
      alert(`Imágenes demasiado grandes (máx 5MB): ${oversized.map(f => f.name).join(', ')}`);
      return;
    }

    setUploading(true);

    // Crear previews locales inmediatamente
    const startIndex = images.length;
    const newImages: UploadedImage[] = files.map((file, idx) => ({
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
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageIndex = images.length + i;

      try {
        console.log(`[SimpleUploader] 📤 Uploading ${i + 1}/${files.length}: ${file.name}`);
        
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
      {/* Botón de Upload */}
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
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${uploading || images.length >= maxFiles
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
            : 'border-green-400 bg-green-50 hover:bg-green-100 hover:border-green-500'
          }
        `}>
          <Upload className="w-12 h-12 mx-auto mb-3 text-green-600" />
          
          {uploading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin text-green-600" />
                <p className="text-lg font-semibold text-gray-900">
                  Subiendo imágenes...
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Espera mientras se suben tus fotos
              </p>
            </div>
          ) : images.length >= maxFiles ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">
                Máximo alcanzado
              </p>
              <p className="text-sm text-gray-600">
                Ya subiste {maxFiles} imágenes (máximo permitido)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">
                Haz click para subir fotos
              </p>
              <p className="text-sm text-gray-600">
                O arrastra y suelta aquí (máximo {maxFiles} imágenes)
              </p>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG o WEBP • Máximo 5MB por imagen
              </p>
            </div>
          )}
        </div>
      </label>

      {/* Botón: Imagen predeterminada - Diseño mejorado */}
      {images.length < maxFiles && !uploading && (
        <button
          type="button"
          onClick={addDefaultImage}
          className="group w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 hover:shadow-md transition-all duration-200"
        >
          {/* Preview de la imagen predeterminada */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-300 bg-white shadow-sm">
            <img 
              src={DEFAULT_IMAGE.url} 
              alt="Preview imagen predeterminada"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMAGE.fallback;
              }}
            />
          </div>
          
          {/* Texto */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
                Usar imagen predeterminada
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Imagen placeholder del sistema • Puedes reemplazarla después
            </p>
          </div>
          
          {/* Icono de acción */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 group-hover:bg-blue-700 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Grid de imágenes subidas CON DRAG & DROP */}
      {images.length > 0 && (
        <div className="space-y-4">
          {/* Instrucciones */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <GripVertical className="w-5 h-5 text-blue-600" />
            <span><strong>Arrastrá las fotos</strong> para cambiar el orden. La primera será la portada.</span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map(img => img.path || img.preview || '')}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
        </div>
      )}

      {/* Contador */}
      {images.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          {images.filter(img => img.status === 'success').length} de {maxFiles} imágenes subidas
        </div>
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
      className={`relative aspect-square rounded-lg overflow-hidden border-2 bg-gray-50 ${
        isDragging ? 'shadow-2xl z-50 scale-105' : ''
      }`}
      style={{
        ...style,
        borderColor: 
          image.isPrimary ? '#10b981' :
          image.status === 'error' ? '#ef4444' :
          '#d1d5db',
        borderWidth: image.isPrimary ? '4px' : '2px'
      }}
    >
      {/* Preview de imagen */}
      <img
        src={image.preview || image.url}
        alt={`Imagen ${index + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/400x400/10b981/ffffff?text=Imagen+' + (index + 1);
        }}
      />

      {/* Drag handle - Visible siempre para táctil */}
      {image.status === 'success' && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 cursor-move shadow-lg touch-none"
        >
          <GripVertical className="w-5 h-5 text-gray-700" />
        </div>
      )}

      {/* Badge PORTADA */}
      {image.isPrimary && image.status === 'success' && (
        <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
          <Star className="w-4 h-4 fill-current" />
          PORTADA
        </div>
      )}

      {/* Número de orden */}
      {!image.isPrimary && image.status === 'success' && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
          📸 {index + 1}
        </div>
      )}

      {/* Botón: Marcar como principal */}
      {!image.isPrimary && image.status === 'success' && (
        <button
          onClick={onSetPrimary}
          className="absolute bottom-2 left-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-lg transition-all"
          title="Marcar como portada"
        >
          <Star className="w-3 h-3" />
          Portada
        </button>
      )}

      {/* Overlay estado uploading/error */}
      {image.status !== 'success' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          {image.status === 'uploading' && (
            <div className="text-center text-white">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm font-semibold">Subiendo...</p>
            </div>
          )}

          {image.status === 'error' && (
            <div className="text-center text-white">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-xs">{image.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Botón eliminar */}
      {image.status !== 'uploading' && (
        <button
          onClick={onRemove}
          className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-all shadow-lg"
          aria-label="Eliminar imagen"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
