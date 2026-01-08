import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User as UserIcon, Eye, Edit, Pause, Play, Trash2, Star, X, ExternalLink } from 'lucide-react';
import { notify } from '../../utils/notifications';
import { useAuth } from '../../contexts/AuthContext';
import type { Ad } from '../../../types';
import { supabase } from '../../services/supabaseClient';

interface AllAdsPanelProps {
  onNavigate?: (page: string) => void;
}

interface Filters {
  category: string;
  subcategory: string;
  userId: string;
  status: 'all' | 'active' | 'paused' | 'deleted' | 'featured';
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface Category {
  id: string;
  display_name: string;
}

interface Subcategory {
  id: string;
  display_name: string;
}

export default function AllAdsPanel({ onNavigate }: AllAdsPanelProps = {}) {
  const { profile } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false); // Cambio: false porque usa query button pattern
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedAdForView, setSelectedAdForView] = useState<Ad | null>(null);
  const [selectedAdForEdit, setSelectedAdForEdit] = useState<Ad | null>(null);
  const [featureDuration, setFeatureDuration] = useState<string>('');
  const [hasQueried, setHasQueried] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 20;
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    featured: 0
  });

  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    subcategory: 'all',
    userId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
  });

  useEffect(() => {
    loadInitialData();
    loadGlobalStats();
  }, []);

  const loadGlobalStats = async () => {
    try {
      // Stats totales del proyecto (sin filtros)
      const { data: allAds } = await supabase
        .from('ads')
        .select('status, featured');
      
      if (allAds) {
        setGlobalStats({
          total: allAds.length,
          active: allAds.filter(a => a.status === 'active').length,
          paused: allAds.filter(a => a.status === 'paused').length,
          featured: allAds.filter(a => a.featured).length
        });
      }
    } catch (error) {
      console.error('Error loading global stats:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      // Cargar categorías desde la tabla categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, display_name')
        .eq('is_active', true)
        .order('display_name');
      
      setCategories(categoriesData || []);

      // Cargar usuarios con avisos
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, full_name')
        .order('email');
      
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadAds = async (page: number = 1) => {
    setLoading(true);
    setHasQueried(true);
    
    console.log('🔍 [AllAdsPanel] loadAds iniciado con filtros:', filters);
    
    try {
      // TEST: Query directo SIN filtros para verificar RLS
      const { data: testData, error: testError } = await supabase
        .from('ads')
        .select('id, title, status')
        .limit(5);
      
      console.log('🧪 [AllAdsPanel] TEST Query SIN filtros:', {
        count: testData?.length,
        data: testData,
        error: testError
      });
      
      // Primero obtener el total de registros que cumplen los filtros
      let countQuery = supabase
        .from('ads')
        .select('*', { count: 'exact', head: true });

      // Aplicar los mismos filtros para el conteo
      if (filters.category !== 'all') {
        countQuery = countQuery.eq('category_id', filters.category);
      }
      if (filters.subcategory !== 'all') {
        countQuery = countQuery.eq('subcategory_id', filters.subcategory);
      }
      if (filters.userId !== 'all') {
        countQuery = countQuery.eq('user_id', filters.userId);
      }
      if (filters.status !== 'all') {
        countQuery = countQuery.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        countQuery = countQuery.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        countQuery = countQuery.lte('created_at', filters.dateTo);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('❌ [AllAdsPanel] Error en COUNT query:', countError);
      }
      
      setTotalRecords(count || 0);
      
      console.log('📊 [AllAdsPanel] Total de registros encontrados:', count);
      console.log('📊 [AllAdsPanel] Filtros aplicados:', {
        category: filters.category,
        subcategory: filters.subcategory,
        userId: filters.userId,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        searchTerm: filters.searchTerm
      });

      // Ahora obtener los datos paginados
      const from = (page - 1) * recordsPerPage;
      const to = from + recordsPerPage - 1;

      let query = supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      // Filtro por categoría
      if (filters.category !== 'all') {
        query = query.eq('category_id', filters.category);
      }

      // Filtro por subcategoría
      if (filters.subcategory !== 'all') {
        query = query.eq('subcategory_id', filters.subcategory);
      }

      // Filtro por usuario
      if (filters.userId !== 'all') {
        query = query.eq('user_id', filters.userId);
      }

      // Filtro por estado
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Filtro por rango de fechas
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      console.log('🔎 [AllAdsPanel] Query construido - ejecutando...');
      
      const { data, error } = await query;

      if (error) {
        console.error('❌ [AllAdsPanel] Error en query principal:', error);
        console.error('❌ [AllAdsPanel] Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('✅ [AllAdsPanel] Datos recibidos:', data?.length, data);

      // Cargar categorías y subcategorías para hacer el mapping manual
      const categoryIds = [...new Set(data?.map((ad: any) => ad.category_id).filter(Boolean))];
      const subcategoryIds = [...new Set(data?.map((ad: any) => ad.subcategory_id).filter(Boolean))];

      let categoriesMap: Record<string, string> = {};
      let subcategoriesMap: Record<string, string> = {};

      if (categoryIds.length > 0) {
        const { data: catsData } = await supabase
          .from('categories')
          .select('id, display_name')
          .in('id', categoryIds);
        
        if (catsData) {
          categoriesMap = Object.fromEntries(
            catsData.map((c: any) => [c.id, c.display_name])
          );
        }
      }

      if (subcategoryIds.length > 0) {
        const { data: subsData } = await supabase
          .from('subcategories')
          .select('id, display_name')
          .in('id', subcategoryIds);
        
        if (subsData) {
          subcategoriesMap = Object.fromEntries(
            subsData.map((s: any) => [s.id, s.display_name])
          );
        }
      }

      // Transformar datos para agregar category y subcategory como strings
      const adsWithCategories = (data || []).map((ad: any) => ({
        ...ad,
        category: categoriesMap[ad.category_id] || 'Sin categoría',
        subcategory: subcategoriesMap[ad.subcategory_id] || null,
      }));

      // Filtro por término de búsqueda (client-side)
      let filteredData = adsWithCategories;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter((ad: any) =>
          ad.title?.toLowerCase().includes(term) ||
          ad.description?.toLowerCase().includes(term) ||
          ad.user_id?.toLowerCase().includes(term)
        );
      }

      setAds(filteredData);
      console.log('🎯 [AllAdsPanel] Avisos seteados en estado:', filteredData.length);
    } catch (error) {
      console.error('❌ [AllAdsPanel] Error loading ads:', error);
      notify.error('Error al cargar avisos');
      setAds([]); // Limpiar estado en caso de error
    } finally {
      setLoading(false);
      console.log('✅ [AllAdsPanel] Loading finalizado');
    }
  };

  const loadSubcategories = async (category: string) => {
    if (category === 'all') {
      setSubcategories([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('subcategories')
        .select('id, display_name')
        .eq('category_id', category)
        .eq('is_active', true)
        .order('display_name');

      setSubcategories(data || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    }
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category, subcategory: 'all' }));
    loadSubcategories(category);
  };

  const handleToggleStatus = async (adId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: newStatus })
        .eq('id', adId);

      if (error) throw error;

      notify.success(`Aviso ${newStatus === 'active' ? 'activado' : 'pausado'} correctamente`);
      loadAds();
    } catch (error) {
      console.error('Error toggling status:', error);
      notify.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (adId: string) => {
    if (!confirm('¿Estás seguro de eliminar este aviso? Se marcará como eliminado.')) return;

    try {
      const { error } = await supabase
        .from('ads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', adId);

      if (error) throw error;

      notify.success('Aviso eliminado correctamente');
      loadAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      notify.error('Error al eliminar aviso');
    }
  };

  const handleToggleFeatured = async (adId: string, currentFeatured: boolean) => {
    if (!currentFeatured) {
      // Destacar: pedir duración
      setSelectedAd(ads.find(a => a.id === adId) || null);
      return;
    }

    // Quitar destacado
    try {
      const { error } = await supabase
        .from('ads')
        .update({ featured: false })
        .eq('id', adId);

      if (error) throw error;

      notify.success('Destacado removido');
      loadAds(currentPage);
    } catch (error) {
      console.error('Error removing featured:', error);
      notify.error('Error al remover destacado');
    }
  };

  const confirmFeature = async () => {
    if (!selectedAd || !featureDuration) {
      notify.error('Selecciona una fecha de fin');
      return;
    }

    try {
      const { error } = await supabase
        .from('ads')
        .update({
          featured: true,
          featured_until: featureDuration // Guardar la fecha de fin del destacado
        })
        .eq('id', selectedAd.id);

      if (error) throw error;

      notify.success(`Aviso destacado hasta el ${new Date(featureDuration).toLocaleDateString('es-AR')}`);
      setSelectedAd(null);
      setFeatureDuration('');
      loadAds(currentPage);
    } catch (error) {
      console.error('Error featuring ad:', error);
      notify.error('Error al destacar aviso');
    }
  };

  const handleSaveEdit = async (updatedData: Partial<Ad>) => {
    if (!selectedAdForEdit) return;

    try {
      const { error } = await supabase
        .from('ads')
        .update(updatedData)
        .eq('id', selectedAdForEdit.id);

      if (error) throw error;

      notify.success('Aviso actualizado correctamente');
      setSelectedAdForEdit(null);
      loadAds(currentPage);
      loadGlobalStats(); // Refrescar stats globales
    } catch (error) {
      console.error('Error updating ad:', error);
      notify.error('Error al actualizar aviso');
    }
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      subcategory: 'all',
      userId: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      searchTerm: '',
    });
  };

  // Stats globales se cargan al inicio, no dependen de filtros
  // Las stats locales (ads filtrados) se eliminan - solo usamos globalStats

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando avisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1b2f23]">Gestión de Avisos</h2>
          <p className="text-sm text-gray-600 mt-1">
            Administra todos los avisos del sistema con filtros avanzados
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2c] transition-colors"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {/* Stats Globales del Proyecto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{globalStats.total}</div>
          <div className="text-sm text-gray-600">Total Proyecto</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{globalStats.active}</div>
          <div className="text-sm text-gray-600">Activos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{globalStats.paused}</div>
          <div className="text-sm text-gray-600">Pausados</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-[#f0bf43]">{globalStats.featured}</div>
          <div className="text-sm text-gray-600">Destacados</div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filtros Avanzados</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Limpiar filtros
            </button>
          </div>

          {/* Búsqueda por texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Buscar por título, descripción o email
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="Ej: tractor, semillas, juan@mail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.display_name}</option>
                ))}
              </select>
            </div>

            {/* Subcategoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoría</label>
              <select
                value={filters.subcategory}
                onChange={(e) => setFilters(prev => ({ ...prev, subcategory: e.target.value }))}
                disabled={filters.category === 'all'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent disabled:bg-gray-100"
              >
                <option value="all">Todas las subcategorías</option>
                {subcategories.map(subcat => (
                  <option key={subcat.id} value={subcat.id}>{subcat.display_name}</option>
                ))}
              </select>
            </div>

            {/* Usuario/Vendedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="w-4 h-4 inline mr-1" />
                Usuario/Vendedor
              </label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              >
                <option value="all">Todos los usuarios</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="paused">Pausados</option>
                <option value="deleted">Eliminados</option>
                <option value="featured">Destacados</option>
              </select>
            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha desde
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha hasta
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>
          </div>

          {/* Botón CONSULTAR */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                setCurrentPage(1);
                loadAds(1);
              }}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-[#16a135] text-white font-semibold rounded-lg hover:bg-[#138f2d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Consultando...' : 'CONSULTAR'}
            </button>
          </div>
        </div>
      )}

      {/* Mensaje inicial antes de primera consulta */}
      {!hasQueried && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Configurá los filtros y presioná CONSULTAR</h3>
          <p className="text-gray-600">Seleccioná los criterios de búsqueda y hacé click en el botón para ver los resultados</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#16a135] mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Cargando avisos...</h3>
          <p className="text-gray-600">Consultando base de datos</p>
        </div>
      )}

      {/* No results */}
      {hasQueried && !loading && ads.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron avisos</h3>
          <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}

      {/* Tabla compacta (sin fotos) */}
      {hasQueried && !loading && ads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      #{ad.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ad.featured && <Star className="w-4 h-4 text-[#f0bf43] fill-current" />}
                        <span className="font-medium text-gray-900 line-clamp-1">{ad.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ad.category}
                      {ad.subcategory && <div className="text-xs text-gray-400">{ad.subcategory}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(ad.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ad.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ad.status === 'active' ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Ver Detalle */}
                        <button
                          onClick={() => setSelectedAdForView(ad)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => setSelectedAdForEdit(ad)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Pausar/Activar */}
                        <button
                          onClick={() => handleToggleStatus(ad.id, ad.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            ad.status === 'active'
                              ? 'text-yellow-600 hover:bg-yellow-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={ad.status === 'active' ? 'Pausar' : 'Activar'}
                        >
                          {ad.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        {/* Destacar/Quitar destacado */}
                        <button
                          onClick={() => handleToggleFeatured(ad.id, ad.featured || false)}
                          className={`p-2 rounded-lg transition-colors ${
                            ad.featured
                              ? 'text-[#f0bf43] hover:bg-yellow-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={ad.featured ? 'Quitar destacado' : 'Destacar'}
                        >
                          <Star className={`w-4 h-4 ${ad.featured ? 'fill-current' : ''}`} />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalRecords > recordsPerPage && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * recordsPerPage) + 1} - {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    loadAds(newPage);
                  }}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Página {currentPage} de {Math.ceil(totalRecords / recordsPerPage)}
                </span>
                <button
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    loadAds(newPage);
                  }}
                  disabled={currentPage >= Math.ceil(totalRecords / recordsPerPage) || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal destacar aviso */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Destacar Aviso</h3>
              <button
                onClick={() => setSelectedAd(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              ¿Confirmar destacar el aviso <strong>"{selectedAd.title}"</strong> en la página principal?
            </p>

            {/* Campo de fecha de fin */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha de fin del destacado
              </label>
              <input
                type="date"
                value={featureDuration}
                onChange={(e) => setFeatureDuration(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                placeholder="Selecciona la fecha de fin"
              />
              <p className="mt-2 text-xs text-gray-500">
                El aviso aparecerá destacado en la página principal hasta esta fecha
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedAd(null);
                  setFeatureDuration('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFeature}
                disabled={!featureDuration}
                className="flex-1 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle */}
      {selectedAdForView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Detalle del Aviso</h3>
              <button
                onClick={() => setSelectedAdForView(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Título */}
              <div>
                <label className="text-sm font-medium text-gray-700">Título</label>
                <p className="mt-1 text-gray-900">{selectedAdForView.title}</p>
              </div>

              {/* Descripción */}
              {selectedAdForView.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Descripción</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedAdForView.description}</p>
                </div>
              )}

              {/* Grid de 2 columnas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Categoría</label>
                  <p className="mt-1 text-gray-900">{selectedAdForView.category}</p>
                </div>
                {selectedAdForView.subcategory && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Subcategoría</label>
                    <p className="mt-1 text-gray-900">{selectedAdForView.subcategory}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Precio</label>
                  <p className="mt-1 text-gray-900">
                    {selectedAdForView.price ? `$${selectedAdForView.price.toLocaleString('es-AR')}` : 'A consultar'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedAdForView.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedAdForView.status === 'active' ? 'Activo' : 'Pausado'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Provincia</label>
                  <p className="mt-1 text-gray-900">{selectedAdForView.province || 'No especificada'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha de creación</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedAdForView.created_at).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ID</label>
                  <p className="mt-1 text-gray-500 font-mono text-xs">{selectedAdForView.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Usuario ID</label>
                  <p className="mt-1 text-gray-500 font-mono text-xs">{selectedAdForView.user_id}</p>
                </div>
              </div>

              {/* Destacado */}
              {selectedAdForView.featured && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-medium">Aviso Destacado</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedAdForView(null)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Aviso (Admin) */}
      {selectedAdForEdit && (
        <EditAdModal
          ad={selectedAdForEdit}
          categories={categories}
          onSave={handleSaveEdit}
          onClose={() => setSelectedAdForEdit(null)}
        />
      )}
    </div>
  );
}

// Modal de Edición Admin - Formulario simplificado UX optimizado
interface EditAdModalProps {
  ad: Ad;
  categories: Category[];
  onSave: (data: Partial<Ad>) => void;
  onClose: () => void;
}

function EditAdModal({ ad, categories, onSave, onClose }: EditAdModalProps) {
  const [formData, setFormData] = useState({
    title: ad.title || '',
    description: ad.description || '',
    price: ad.price || 0,
    category: ad.category || '',
    status: ad.status || 'active',
    province: ad.province || '',
    featured: ad.featured || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900">Editar Aviso</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent resize-none"
            />
          </div>

          {/* Grid 2 columnas */}
          <div className="grid grid-cols-2 gap-4">
            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                min="0"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                required
              >
                <option value="">Seleccionar...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.display_name}>{cat.display_name}</option>
                ))}
              </select>
            </div>

            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                required
              >
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
              </select>
            </div>
          </div>

          {/* Destacado */}
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-4 h-4 text-[#16a135] border-gray-300 rounded focus:ring-2 focus:ring-[#16a135]"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              Destacar este aviso
            </label>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2c] transition-colors font-medium"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
