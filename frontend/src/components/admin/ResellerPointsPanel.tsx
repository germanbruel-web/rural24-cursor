/**
 * ResellerPointsPanel — CRUD de Puntos de Venta
 * 
 * Panel para que el rol "revendedor" gestione sus puntos de venta (sedes).
 * Cada PdV representa una localidad/empresa donde el revendedor opera.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X,
  MapPin,
  Store,
  Phone,
  Mail,
  Package,
  ChevronDown,
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import { PROVINCES } from '../../constants/locations';
import {
  getMyPointsOfSale,
  createPointOfSale,
  updatePointOfSale,
  deletePointOfSale,
  togglePointOfSale,
  getResellerStats,
  type PointOfSale,
  type CreatePointOfSaleData,
} from '../../services/resellerService';

// ============================================================
// TYPES
// ============================================================

interface ResellerStatsData {
  totalPoints: number;
  activePoints: number;
  totalAds: number;
  activeAds: number;
  featuredAds: number;
}

type ViewMode = 'list' | 'form';

// ============================================================
// COMPONENT
// ============================================================

export const ResellerPointsPanel: React.FC = () => {
  // State
  const [points, setPoints] = useState<PointOfSale[]>([]);
  const [stats, setStats] = useState<ResellerStatsData>({ totalPoints: 0, activePoints: 0, totalAds: 0, activeAds: 0, featuredAds: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePointOfSaleData>({
    name: '',
    province: '',
    city: '',
    address: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    category_ids: [],
    notes: '',
  });

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pointsData, statsData] = await Promise.all([
        getMyPointsOfSale(),
        getResellerStats(),
      ]);
      setPoints(pointsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading reseller data:', error);
      notify.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const resetForm = () => {
    setFormData({
      name: '',
      province: '',
      city: '',
      address: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      category_ids: [],
      notes: '',
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setViewMode('form');
  };

  const handleOpenEdit = (pos: PointOfSale) => {
    setFormData({
      name: pos.name,
      province: pos.province || '',
      city: pos.city || '',
      address: pos.address || '',
      contact_name: pos.contact_name || '',
      contact_phone: pos.contact_phone || '',
      contact_email: pos.contact_email || '',
      category_ids: pos.category_ids || [],
      notes: pos.notes || '',
    });
    setEditingId(pos.id);
    setViewMode('form');
  };

  const handleCancel = () => {
    resetForm();
    setViewMode('list');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      notify.error('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await updatePointOfSale(editingId, formData);
        if (error) throw new Error(error);
        notify.success('Punto de venta actualizado');
      } else {
        const { error } = await createPointOfSale(formData);
        if (error) throw new Error(error);
        notify.success('Punto de venta creado');
      }
      handleCancel();
      loadData();
    } catch (error: any) {
      notify.error(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deletePointOfSale(id);
      if (error) throw new Error(error);
      notify.success('Punto de venta eliminado');
      setDeleteConfirm(null);
      loadData();
    } catch (error: any) {
      notify.error(error.message || 'Error al eliminar');
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await togglePointOfSale(id, !currentActive);
      if (error) throw new Error(error);
      notify.success(!currentActive ? 'Punto de venta activado' : 'Punto de venta desactivado');
      loadData();
    } catch (error: any) {
      notify.error(error.message || 'Error al cambiar estado');
    }
  };

  // ============================================================
  // FILTERED DATA
  // ============================================================

  const filteredPoints = points.filter(pos =>
    pos.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.province?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando puntos de venta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Puntos de Venta</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona las sedes y representaciones de tu red comercial</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {viewMode === 'list' && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2c] transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Nuevo Punto de Venta
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <Store className="w-4 h-4 text-blue-500" />
            Puntos de Venta
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalPoints}</div>
          <div className="text-xs text-gray-400">{stats.activePoints} activos</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <Package className="w-4 h-4 text-green-500" />
            Avisos Totales
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.totalAds}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <Package className="w-4 h-4 text-emerald-500" />
            Avisos Activos
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.activeAds}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <Package className="w-4 h-4 text-yellow-500" />
            Destacados
          </div>
          <div className="text-2xl font-bold text-yellow-600">{stats.featuredAds}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-purple-500" />
            Provincias
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {new Set(points.filter(p => p.province).map(p => p.province)).size}
          </div>
        </div>
      </div>

      {/* FORM VIEW */}
      {viewMode === 'form' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? 'Editar Punto de Venta' : 'Nuevo Punto de Venta'}
            </h2>
            <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Punto de Venta *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Sede Córdoba Centro"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>

            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <div className="relative">
                <select
                  value={formData.province || ''}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent appearance-none"
                >
                  <option value="">Seleccionar provincia</option>
                  {PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Localidad</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ej: Dean Funes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej: Av. San Martín 1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>

            {/* Contacto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Contacto</label>
              <input
                type="text"
                value={formData.contact_name || ''}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                value={formData.contact_phone || ''}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="Ej: 351 1234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
              <input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="Ej: sede.cordoba@agromaq.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>

            {/* Notas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas internas sobre este punto de venta..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2c] transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Punto de Venta'}
            </button>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <>
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, provincia, ciudad o contacto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>
          </div>

          {/* Points List */}
          {filteredPoints.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {points.length === 0 ? 'Sin puntos de venta' : 'Sin resultados'}
              </h3>
              <p className="text-gray-500 mb-4">
                {points.length === 0
                  ? 'Creá tu primer punto de venta para comenzar a gestionar tu red comercial.'
                  : 'No se encontraron puntos de venta con esa búsqueda.'}
              </p>
              {points.length === 0 && (
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2c] transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Crear Punto de Venta
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPoints.map((pos) => (
                <div
                  key={pos.id}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-colors ${
                    pos.is_active ? 'border-gray-200 hover:border-[#16a135]' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Store className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{pos.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            pos.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {pos.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    {(pos.province || pos.city) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{[pos.city, pos.province].filter(Boolean).join(', ')}</span>
                      </div>
                    )}

                    {/* Contact */}
                    {pos.contact_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{pos.contact_name}{pos.contact_phone ? ` - ${pos.contact_phone}` : ''}</span>
                      </div>
                    )}
                    {pos.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{pos.contact_email}</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-sm">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{pos.ads_count || 0}</span>
                        <span className="text-gray-500">avisos</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleOpenEdit(pos)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggle(pos.id, pos.is_active)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          pos.is_active
                            ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                        title={pos.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {pos.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {pos.is_active ? 'Pausar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(pos.id)}
                        className="flex items-center justify-center px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {deleteConfirm === pos.id && (
                    <div className="px-5 pb-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800 mb-2">¿Eliminar este punto de venta?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(pos.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResellerPointsPanel;
