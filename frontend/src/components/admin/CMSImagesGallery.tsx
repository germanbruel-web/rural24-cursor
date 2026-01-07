/**
 * =====================================================
 * CMS IMAGES GALLERY - Galería de Imágenes del CMS
 * =====================================================
 * Módulo para ver todas las imágenes del CMS y poder eliminarlas
 */

import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Loader, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { listCMSImages, deleteCMSImage } from '../../services/siteSettingsService';
import { useToastHelpers } from '../../contexts/ToastContext';
import { formatFileSize } from '../../utils/fileValidation';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../../constants/defaultImages';

interface CMSImage {
  name: string;
  url: string;
  size: number;
  created_at: string;
}

export const CMSImagesGallery: React.FC = () => {
  const [images, setImages] = useState<CMSImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const toast = useToastHelpers();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const imageList = await listCMSImages();
      setImages(imageList);
      
      if (imageList.length > 0) {
        toast.success('Imágenes cargadas', `Se encontraron ${imageList.length} imágenes`);
      }
    } catch (error) {
      toast.error('Error', 'No se pudieron cargar las imágenes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (image: CMSImage) => {
    if (!confirm(`¿Eliminar "${image.name}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    const loadingToast = toast.loading('Eliminando...', image.name);

    try {
      setDeleting(image.name);
      const success = await deleteCMSImage(image.url);
      
      toast.hide(loadingToast);
      
      if (success) {
        toast.success('¡Eliminada!', 'La imagen se eliminó correctamente');
        // Recargar lista
        await loadImages();
      } else {
        toast.error('Error', 'No se pudo eliminar la imagen');
      }
    } catch (error) {
      toast.hide(loadingToast);
      toast.error('Error', 'Ocurrió un problema al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-600">Cargando galería de imágenes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ImageIcon className="w-8 h-8" />
          Galería de Imágenes CMS
        </h1>
        <p className="mt-2 opacity-90">
          Todas las imágenes almacenadas en el bucket CMS
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">
            📊 {images.length} imágenes totales
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full">
            💾 {formatFileSize(images.reduce((sum, img) => sum + img.size, 0))}
          </span>
        </div>
      </div>

      {/* Botón recargar */}
      <div className="flex justify-between items-center">
        <button
          onClick={loadImages}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-gray-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recargar galería
        </button>
      </div>

      {/* Galería Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.name}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Imagen */}
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE;
                  }}
                />
                
                {/* Overlay con botón eliminar */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(image)}
                    disabled={deleting === image.name}
                    className="opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg disabled:opacity-50"
                    title="Eliminar imagen"
                  >
                    {deleting === image.name ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-mono text-gray-900 truncate" title={image.name}>
                  {image.name}
                </p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{formatFileSize(image.size)}</span>
                  <span>{new Date(image.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No hay imágenes en el CMS</p>
          <p className="text-gray-500 text-sm mt-2">Las imágenes subidas aparecerán aquí</p>
        </div>
      )}

      {/* Advertencia */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-900">
          <p className="font-semibold mb-1">⚠️ Precaución al eliminar</p>
          <p>
            Si una imagen está siendo usada en el sitio (header, footer, etc.), 
            eliminarla causará que no se muestre correctamente. 
            Solo elimina imágenes que ya no estés usando.
          </p>
        </div>
      </div>
    </div>
  );
};
