import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';

interface DeletedAd {
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
  status: string;
  created_at: string;
  updated_at: string;
}

export const DeletedAdsPanel: React.FC = () => {
  const [deletedAds, setDeletedAds] = useState<DeletedAd[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [viewingAd, setViewingAd] = useState<DeletedAd | null>(null);

  // Cargar avisos eliminados
  const loadDeletedAds = async () => {
    setIsLoading(true);
    try {
      console.log('📂 Cargando avisos eliminados...');
      
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'deleted')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setDeletedAds(data || []);
      console.log(`✅ ${data?.length || 0} avisos eliminados encontrados`);
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert(`Error al cargar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Restaurar aviso
  const handleRestore = async (adId: string) => {
    if (!confirm('¿Restaurar este aviso? Volverá al estado "Activo".')) return;

    try {
      console.log(`♻️ Restaurando aviso ID: ${adId}`);
      
      const { error } = await supabase
        .from('ads')
        .update({ status: 'active' })
        .eq('id', adId);

      if (error) throw error;
      
      alert('✅ Aviso restaurado correctamente');
      loadDeletedAds();
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert(`Error al restaurar: ${error.message}`);
    }
  };

  // Restaurar múltiples
  const handleBulkRestore = async () => {
    if (selectedAds.size === 0) {
      alert('⚠️ Selecciona al menos un aviso');
      return;
    }

    if (!confirm(`¿Restaurar ${selectedAds.size} aviso(s)?`)) return;

    try {
      const adIds = Array.from(selectedAds);
      
      const { error } = await supabase
        .from('ads')
        .update({ status: 'active' })
        .in('id', adIds);

      if (error) throw error;
      
      alert(`✅ ${selectedAds.size} avisos restaurados`);
      setSelectedAds(new Set());
      loadDeletedAds();
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Eliminar permanentemente
  const handlePermanentDelete = async (adId: string) => {
    if (!confirm('⚠️ ELIMINAR PERMANENTEMENTE este aviso? Esta acción NO se puede deshacer.')) return;
    if (!confirm('¿Estás COMPLETAMENTE SEGURO? El aviso se eliminará para siempre.')) return;

    try {
      console.log(`🔥 Eliminando permanentemente aviso ID: ${adId}`);
      
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;
      
      alert('✅ Aviso eliminado permanentemente');
      setViewingAd(null);
      loadDeletedAds();
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Vaciar papelera completa
  const handleEmptyTrash = async () => {
    if (deletedAds.length === 0) {
      alert('La papelera ya está vacía');
      return;
    }

    if (!confirm(`⚠️ ELIMINAR PERMANENTEMENTE ${deletedAds.length} avisos? Esta acción NO se puede deshacer.`)) return;
    if (!confirm('¿Estás COMPLETAMENTE SEGURO? Todos los avisos se eliminarán para siempre.')) return;

    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('status', 'deleted');

      if (error) throw error;
      
      alert('✅ Papelera vaciada');
      loadDeletedAds();
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Selección
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
    if (selectedAds.size === deletedAds.length) {
      setSelectedAds(new Set());
    } else {
      setSelectedAds(new Set(deletedAds.map(ad => ad.id)));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  React.useEffect(() => {
    loadDeletedAds();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🗑️ Papelera de Avisos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Avisos eliminados • Restaurar o eliminar permanentemente
            </p>
          </div>
          <div className="flex items-center gap-3">
            {deletedAds.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm px-4 py-2">
                <div className="text-2xl font-bold text-red-600">{deletedAds.length}</div>
                <div className="text-xs text-gray-500">eliminados</div>
              </div>
            )}
            <button
              onClick={loadDeletedAds}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all disabled:opacity-50"
            >
              {isLoading ? '⏳ Cargando...' : '🔄 Recargar'}
            </button>
            {deletedAds.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all"
              >
                🔥 Vaciar Papelera
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Acciones masivas */}
      {selectedAds.size > 0 && (
        <div className="p-3 bg-green-50 border-b border-green-200 flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">
            {selectedAds.size} aviso(s) seleccionado(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkRestore}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              ♻️ Restaurar
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
      {deletedAds.length > 0 && !isLoading && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 border-y border-gray-300 sticky top-0">
              <tr>
                <th className="p-2 border-r">
                  <input type="checkbox" checked={selectedAds.size === deletedAds.length} onChange={toggleSelectAll} />
                </th>
                <th className="p-2 border-r text-left">Título</th>
                <th className="p-2 border-r text-left">Categoría</th>
                <th className="p-2 border-r text-right">Precio</th>
                <th className="p-2 border-r text-left">Ubicación</th>
                <th className="p-2 border-r text-center">Eliminado</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deletedAds.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="p-2 border-r">
                    <input type="checkbox" checked={selectedAds.has(ad.id)} onChange={() => toggleSelectAd(ad.id)} />
                  </td>
                  <td className="p-2 border-r max-w-xs truncate" title={ad.title}>{ad.title}</td>
                  <td className="p-2 border-r">{ad.category}</td>
                  <td className="p-2 border-r text-right font-mono">
                    {ad.price ? `$${ad.price.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-2 border-r text-gray-600">{ad.location || '-'}</td>
                  <td className="p-2 border-r text-gray-600">{formatDate(ad.updated_at)}</td>
                  <td className="p-2">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => setViewingAd(ad)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px]"
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleRestore(ad.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px]"
                        title="Restaurar"
                      >
                        ♻️
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(ad.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[10px]"
                        title="Eliminar permanentemente"
                      >
                        🔥
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="p-12 text-center text-gray-500">
          <div className="text-4xl mb-2">⏳</div>
          <p>Cargando avisos eliminados...</p>
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && deletedAds.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-lg font-medium mb-2">La papelera está vacía</p>
          <p className="text-sm">No hay avisos eliminados</p>
        </div>
      )}

      {/* Modal Vista Completa */}
      {viewingAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold">👁️ Vista del Aviso Eliminado</h3>
              <button
                onClick={() => setViewingAd(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  🗑️ Este aviso está en la papelera. Fue eliminado el {formatDate(viewingAd.updated_at)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-4">
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
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Título</label>
                <p className="text-lg font-semibold">{viewingAd.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Descripción</label>
                <p className="text-sm whitespace-pre-wrap">{viewingAd.description}</p>
              </div>

              {viewingAd.images && viewingAd.images.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Imágenes ({viewingAd.images.length})
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingAd.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Imagen ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleRestore(viewingAd.id);
                    setViewingAd(null);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  ♻️ Restaurar Aviso
                </button>
                <button
                  onClick={() => handlePermanentDelete(viewingAd.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  🔥 Eliminar Permanentemente
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
    </div>
  );
};
