/**
 * FeaturedAdsPanel - Panel de superadmin para gestionar avisos destacados
 * Funcionalidades:
 * - Ver todos los avisos publicados
 * - Marcar/desmarcar como destacado
 * - Reordenar con drag & drop
 * - Vista agrupada por categoría
 */

import React, { useEffect, useState } from 'react';
import { Star, GripVertical, Trash2, Eye } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAllFeaturedAds, toggleFeaturedAd, reorderFeaturedAds } from '../../services/featuredAdsService';
import { getActiveAds } from '../../services/adsService';
import type { Ad } from '../../../types';

interface SortableAdItemProps {
  ad: Ad;
  onToggleFeatured: (adId: string, featured: boolean) => void;
  onView: (adId: string) => void;
}

const SortableAdItem: React.FC<SortableAdItemProps> = ({ ad, onToggleFeatured, onView }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ad.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>

      {/* Imagen */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {ad.images?.[0] ? (
          <img 
            src={typeof ad.images[0] === 'string' ? ad.images[0] : ad.images[0].url} 
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sin img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">{ad.title}</h4>
        <p className="text-sm text-gray-500">
          {ad.category} • ${ad.price?.toLocaleString() || '0'}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(ad.id)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Ver aviso"
        >
          <Eye className="w-5 h-5 text-gray-600" />
        </button>
        
        <button
          onClick={() => onToggleFeatured(ad.id, false)}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          title="Quitar de destacados"
        >
          <Trash2 className="w-5 h-5 text-red-600" />
        </button>
      </div>
    </div>
  );
};

export const FeaturedAdsPanel: React.FC = () => {
  const [featuredAds, setFeaturedAds] = useState<Ad[]>([]);
  const [availableAds, setAvailableAds] = useState<Ad[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [featured, available] = await Promise.all([
      getAllFeaturedAds(),
      getActiveAds()
    ]);
    setFeaturedAds(featured);
    setAvailableAds(available.filter(ad => !ad.featured));
    setLoading(false);
  };

  const handleToggleFeatured = async (adId: string, featured: boolean) => {
    const result = await toggleFeaturedAd(adId, featured);
    if (result.success) {
      await loadData(); // Recargar
    } else {
      alert(result.error || 'Error al actualizar');
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = featuredAds.findIndex(ad => ad.id === active.id);
    const newIndex = featuredAds.findIndex(ad => ad.id === over.id);

    const reordered = arrayMove(featuredAds, oldIndex, newIndex);
    setFeaturedAds(reordered);

    // Guardar nuevo orden en BD
    const categoryId = featuredAds[oldIndex].category_id;
    const orderedIds = reordered
      .filter(ad => ad.category_id === categoryId)
      .map(ad => ad.id);
    
    await reorderFeaturedAds(categoryId, orderedIds);
  };

  const groupedByCategory = featuredAds.reduce((acc, ad) => {
    const cat = ad.category || 'Sin categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ad);
    return acc;
  }, {} as Record<string, Ad[]>);

  const filteredAvailable = availableAds.filter(ad =>
    ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ad.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Gestión de Avisos Destacados
        </h2>
        <p className="text-gray-600">
          Seleccioná y ordená los avisos que aparecerán en la homepage
        </p>
      </div>

      {/* Avisos Destacados (agrupados por categoría) */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Avisos Destacados Actuales ({featuredAds.length})
          </h3>
        </div>

        {Object.entries(groupedByCategory).map(([category, ads]) => (
          <div key={category} className="mb-8 last:mb-0">
            <h4 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-green-600 rounded-full"></span>
              {category} ({ads.length})
            </h4>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={ads.map(ad => ad.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {ads.map(ad => (
                    <SortableAdItem
                      key={ad.id}
                      ad={ad}
                      onToggleFeatured={handleToggleFeatured}
                      onView={(id) => console.log('Ver aviso:', id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ))}

        {featuredAds.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay avisos destacados. Seleccioná algunos abajo.
          </div>
        )}
      </div>

      {/* Avisos Disponibles */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Agregar Avisos
        </h3>

        <input
          type="text"
          placeholder="Buscar por título o categoría..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredAvailable.map(ad => (
            <div key={ad.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded bg-gray-100 flex-shrink-0">
                {ad.images?.[0] && (
                  <img 
                    src={typeof ad.images[0] === 'string' ? ad.images[0] : ad.images[0].url} 
                    alt={ad.title}
                    className="w-full h-full object-cover rounded"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{ad.title}</p>
                <p className="text-xs text-gray-500">{ad.category}</p>
              </div>
              <button
                onClick={() => handleToggleFeatured(ad.id, true)}
                className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                title="Destacar"
              >
                <Star className="w-5 h-5 text-yellow-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
