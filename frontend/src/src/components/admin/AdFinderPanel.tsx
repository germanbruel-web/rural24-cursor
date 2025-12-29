import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Product } from '../../../types';
import { ALL_CATEGORIES, SUBCATEGORIES } from '../../constants/categories';

// Tipo para avisos de la base de datos (tabla ads)
interface AdDB {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  location?: string;
  province?: string;
  category?: string;
  subcategory?: string;
  images?: string[];
  tags?: string[];
  contact_phone?: string;
  contact_email?: string;
  status: 'active' | 'paused' | 'expired' | 'deleted';
  created_at: string;
  updated_at: string;
  expires_at?: string;
  views_count: number;
}

interface AdvancedSearchFilters {
  query: string;
  category?: string;
  subcategory?: string;
  province?: string;
  adType?: 'free' | 'premium' | 'all';
}

const PROVINCES = [
  'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán',
  'Entre Ríos', 'Salta', 'Misiones', 'Chaco', 'Corrientes',
  'Santiago del Estero', 'San Juan', 'Jujuy', 'Río Negro', 'Neuquén',
  'Formosa', 'Chubut', 'San Luis', 'Catamarca', 'La Rioja',
  'La Pampa', 'Santa Cruz', 'Tierra del Fuego'
];

export const AdFinderPanel: React.FC = () => {
  const [products, setProducts] = useState<AdDB[]>([]);
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: '',
    adType: 'all'
  });
  const [results, setResults] = useState<AdDB[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAd, setEditingAd] = useState<AdDB | null>(null);
  const [viewingAd, setViewingAd] = useState<AdDB | null>(null);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(true);

  // Buscar avisos con filtros avanzados
  const handleSearch = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔍 Buscando con filtros:', filters);
      
      let query = supabase
        .from('ads')
        .select('*', { count: 'exact' })
        .neq('status', 'deleted'); // No mostrar eliminados

      // Filtro de búsqueda por texto
      if (filters.query && filters.query.trim()) {
        const searchTerm = `%${filters.query.trim()}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      // Filtro por categoría
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Filtro por subcategoría
      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }

      // Filtro por provincia
      if (filters.province) {
        query = query.eq('province', filters.province);
      }

      // Filtro por tipo (premium/free) - ads no tiene is_premium directamente
      // Se determina por el role del usuario, pero para filtrar necesitaríamos un JOIN
      // Por ahora lo omitimos o agregamos un campo calculado
      if (filters.adType && filters.adType !== 'all') {
        // TODO: Implementar filtro premium con JOIN a users si es necesario
        console.warn('Filtro premium requiere JOIN con tabla users');
      }

      // Ordenamiento por defecto: más recientes primero
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }
      
      setProducts(data || []);
      setResults(data || []);
      console.log(`✅ Encontrados ${data?.length || 0} avisos de ${count || '?'} totales`);
      
    } catch (error: any) {
      console.error('❌ Error buscando avisos:', error);
      alert(`Error en búsqueda: ${error.message}\n\nRevisa la consola para más detalles.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      query: '',
      adType: 'all'
    });
    setResults([]);
    setProducts([]);
  };

  // Obtener subcategorías de la categoría seleccionada
  const availableSubcategories = filters.category 
    ? SUBCATEGORIES[filters.category] || []
    : [];

  // Selección múltiple
  const toggleSelectAd = (adId: string) => {
    const newSelected = new Set(selectedAds);
    if (newSelected.has(adId)) {
      newSelected.delete(adId);
    } else {
      newSelected.add(adId);
    }
    setSelectedAds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAds.size === results.length) {
      setSelectedAds(new Set());
    } else {
      setSelectedAds(new Set(results.map(ad => ad.id)));
    }
  };

  // Actualizar aviso
  const handleUpdate = async (ad: AdDB) => {
    try {
      const { error } = await supabase.from('ads').update({
        title: ad.title,
        description: ad.description,
        price: ad.price,
        category: ad.category,
        subcategory: ad.subcategory,
        location: ad.location,
        province: ad.province,
        status: ad.status
      }).eq('id', ad.id);

      if (error) throw error;
      
      alert('✅ Aviso actualizado correctamente');
      setEditingAd(null);
      handleSearch(); // Recargar datos
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error al actualizar: ${error.message}`);
    }
  };

  // Eliminar aviso (soft delete - cambiar status a 'deleted')
  const handleDelete = async (adId: string) => {
    if (!confirm('¿Mover este aviso a la papelera? Podrás restaurarlo desde "Avisos Eliminados".')) return;
    
    try {
      console.log(`🗑️ Moviendo aviso a papelera ID: ${adId}`);
      
      const { error, data } = await supabase
        .from('ads')
        .update({ status: 'deleted' })
        .eq('id', adId)
        .select();
      
      if (error) {
        console.error('❌ Error de Supabase al eliminar:', error);
        console.error('Detalles:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ Aviso movido a papelera:', data);
      alert('✅ Aviso movido a la papelera. Puedes restaurarlo desde "Avisos Eliminados".');
      setViewingAd(null);
      handleSearch(); // Recargar datos
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      alert(`❌ Error al eliminar: ${error.message}\n\nRevisa la consola para más detalles.`);
    }
  };

  // Eliminar múltiples (soft delete)
  const handleBulkDelete = async () => {
    if (selectedAds.size === 0) {
      alert('⚠️ Selecciona al menos un aviso');
      return;
    }

    if (!confirm(`¿Mover ${selectedAds.size} aviso(s) a la papelera? Podrás restaurarlos desde "Avisos Eliminados".`)) return;

    try {
      const adIds = Array.from(selectedAds);
      console.log(`🗑️ Moviendo ${adIds.length} avisos a papelera:`, adIds);
      
      const { error, data } = await supabase
        .from('ads')
        .update({ status: 'deleted' })
        .in('id', adIds)
        .select();
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }
      
      console.log(`✅ ${data?.length || 0} avisos movidos a papelera`);
      alert(`✅ ${data?.length || 0} avisos movidos a la papelera`);
      setSelectedAds(new Set());
      handleSearch();
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      alert(`❌ Error al eliminar: ${error.message}\n\nRevisa la consola para más detalles.`);
    }
  };

  // Eliminar imagen del aviso
  const handleDeleteImage = async (ad: AdDB, imageIndex: number) => {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      const newImages = ad.images?.filter((_, i) => i !== imageIndex) || [];
      const { error } = await supabase
        .from('ads')
        .update({ images: newImages })
        .eq('id', ad.id);

      if (error) throw error;
      
      alert('✅ Imagen eliminada');
      if (viewingAd) {
        setViewingAd({ ...viewingAd, images: newImages });
      }
      handleSearch();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Formatear fecha
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🔍 Buscador Avanzado de Avisos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Busca, filtra y administra todos los avisos del sitio
            </p>
          </div>
          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm px-4 py-2">
              <div className="text-2xl font-bold text-green-600">{results.length}</div>
              <div className="text-xs text-gray-500">resultados</div>
            </div>
          )}
        </div>
      </div>

      {/* Buscador Avanzado */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        {/* Barra de búsqueda principal */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="🔍 Buscar por título, descripción o palabra clave..."
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Buscando...' : '🔍 Buscar'}
          </button>
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-all"
          >
            {showAdvancedSearch ? '▲ Ocultar filtros' : '▼ Más filtros'}
          </button>
        </div>

        {/* Filtros Avanzados */}
        {showAdvancedSearch && (
          <div className="grid grid-cols-4 gap-3 p-4 bg-white rounded-lg border border-gray-200">
            {/* Fila 1: Categoría, Subcategoría, Provincia, Tipo */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined, subcategory: undefined })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas</option>
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subcategoría</label>
              <select
                value={filters.subcategory || ''}
                onChange={(e) => setFilters({ ...filters, subcategory: e.target.value || undefined })}
                disabled={!filters.category}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Todas</option>
                {availableSubcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Provincia</label>
              <select
                value={filters.province || ''}
                onChange={(e) => setFilters({ ...filters, province: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas</option>
                {PROVINCES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Aviso</label>
              <select
                value={filters.adType}
                onChange={(e) => setFilters({ ...filters, adType: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">💎 Todos</option>
                <option value="free">🆓 Gratuitos</option>
                <option value="premium">⭐ Premium</option>
              </select>
            </div>

            {/* Botón limpiar filtros */}
            <div className="col-span-4 flex justify-end mt-2">
              <button
                onClick={handleClearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                🗑️ Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Acciones masivas */}
      {selectedAds.size > 0 && (
        <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            {selectedAds.size} aviso(s) seleccionado(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              🗑️ Eliminar
            </button>
            <button
              onClick={() => setSelectedAds(new Set())}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              ✖️ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 border-y border-gray-300 sticky top-0">
              <tr>
                <th className="p-2 border-r">
                  <input type="checkbox" checked={selectedAds.size === results.length} onChange={toggleSelectAll} />
                </th>
                <th className="p-2 border-r text-left">ID</th>
                <th className="p-2 border-r text-left">Título</th>
                <th className="p-2 border-r text-left">Categoría</th>
                <th className="p-2 border-r text-center">Estado</th>
                <th className="p-2 border-r text-right">Precio</th>
                <th className="p-2 border-r text-left">Ubicación</th>
                <th className="p-2 border-r text-center">Fecha</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="p-2 border-r">
                    <input type="checkbox" checked={selectedAds.has(ad.id)} onChange={() => toggleSelectAd(ad.id)} />
                  </td>
                  <td className="p-2 border-r">
                    <code className="text-[10px] text-gray-600">{ad.id.slice(0, 8)}</code>
                  </td>
                  <td className="p-2 border-r max-w-xs truncate" title={ad.title}>{ad.title}</td>
                  <td className="p-2 border-r">{ad.category}</td>
                  <td className="p-2 border-r text-center">
                    {ad.status === 'active' ? '✅' : ad.status === 'paused' ? '⏸️' : ad.status === 'expired' ? '⏰' : '🗑️'}
                  </td>
                  <td className="p-2 border-r text-right font-mono">
                    {ad.price ? `$${ad.price.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-2 border-r text-gray-600">{ad.location || '-'}</td>
                  <td className="p-2 border-r text-gray-600">{formatDate(ad.created_at)}</td>
                  <td className="p-2">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => setViewingAd(ad)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px]"
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => setEditingAd(ad)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px]"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px]"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Estado inicial */}
      {products.length === 0 && !isLoading && (
        <div className="p-12 text-center text-gray-500">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-lg font-medium mb-2">Usa el buscador para encontrar avisos</p>
          <p className="text-sm">Puedes buscar por palabra clave, categoría, ubicación, precio y más</p>
          <button
            onClick={handleSearch}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            🔍 Buscar todos los avisos
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="p-12 text-center text-gray-500">
          <div className="text-4xl mb-2">⏳</div>
          <p>Buscando avisos...</p>
        </div>
      )}

      {/* Estado vacío después de búsqueda */}
      {!isLoading && products.length > 0 && results.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-medium">No se encontraron avisos con esos filtros</p>
          <p className="text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            🗑️ Limpiar filtros
          </button>
        </div>
      )}

      {/* Modal Vista Completa */}
      {viewingAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold">👁️ Vista Completa del Aviso</h3>
              <button
                onClick={() => setViewingAd(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ID</label>
                  <p className="font-mono text-xs">{viewingAd.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Categoría</label>
                  <p>{viewingAd.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Precio</label>
                  <p className="text-lg font-bold text-green-600">
                    ${viewingAd.price?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <p>
                    {viewingAd.status === 'active' ? '✅ Activo' : 
                     viewingAd.status === 'paused' ? '⏸️ Pausado' : 
                     viewingAd.status === 'expired' ? '⏰ Expirado' : '🗑️ Eliminado'}
                  </p>
                </div>
              </div>

              {/* Título y descripción */}
              <div>
                <label className="text-sm font-medium text-gray-600">Título</label>
                <p className="text-lg font-semibold">{viewingAd.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Descripción</label>
                <p className="text-sm whitespace-pre-wrap">{viewingAd.description}</p>
              </div>

              {/* Imágenes */}
              {viewingAd.images && viewingAd.images.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Imágenes ({viewingAd.images.length})
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingAd.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Imagen ${idx + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDeleteImage(viewingAd, idx)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar imagen"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setEditingAd(viewingAd);
                    setViewingAd(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(viewingAd.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  🗑️ Eliminar
                </button>
                <button
                  onClick={() => setViewingAd(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editingAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">✏️ Editar Aviso</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={editingAd.title}
                  onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={editingAd.description}
                  onChange={(e) => setEditingAd({ ...editingAd, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select
                    value={editingAd.category}
                    onChange={(e) => setEditingAd({ ...editingAd, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {ALL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Precio</label>
                  <input
                    type="number"
                    value={editingAd.price || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select
                    value={editingAd.status}
                    onChange={(e) => setEditingAd({ ...editingAd, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="active">✅ Activo</option>
                    <option value="paused">⏸️ Pausado</option>
                    <option value="expired">⏰ Expirado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleUpdate(editingAd)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  💾 Guardar Cambios
                </button>
                <button
                  onClick={() => setEditingAd(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
