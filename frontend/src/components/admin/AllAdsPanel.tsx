import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import { Edit, Trash2, Star, StarOff, Search, RefreshCw, X } from 'lucide-react';

interface Category {
  id: string;
  display_name: string;
}
interface Subcategory {
  id: string;
  display_name: string;
  category_id: string;
}
interface Ad {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  status: string;
  featured: boolean;
  featured_until: string | null;
  created_at: string;
  user_id: string;
  seller_name?: string;
  seller_email?: string;
}

// Modal simple reutilizable
function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        {children}
      </div>
    </div>
  );
}

// Formulario profesional para edición de aviso (FUERA del componente principal)
function EditAdForm({ ad, saving, onCancel, onSave }: { ad: Ad, saving: boolean, onCancel: () => void, onSave: (data: Partial<Ad>) => void }) {
  const [title, setTitle] = useState(ad.title);
  const [price, setPrice] = useState<string>(ad.price?.toString() ?? '');
  const [featured, setFeatured] = useState(ad.featured);
  const [featuredType, setFeaturedType] = useState(ad.featured_until ? 'fecha' : 'Permanente');
  const [featuredUntil, setFeaturedUntil] = useState(ad.featured_until ? ad.featured_until.split('T')[0] : '');
  const [sellerName] = useState(ad.seller_name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let featured_until: string | null = null;
    if (featured && featuredType === 'fecha' && featuredUntil) {
      featured_until = featuredUntil;
    }
    onSave({
      title,
      price: price ? parseFloat(price) : null,
      featured,
      featured_until,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Título</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Precio</label>
        <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Destacado</label>
        <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
      </div>
      {featured && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Destacado hasta</label>
          <select value={featuredType} onChange={e => setFeaturedType(e.target.value)} className="w-full border rounded px-2 py-1 mb-1">
            <option value="Permanente">Permanente</option>
            <option value="fecha">Elegir fecha...</option>
          </select>
          {featuredType === 'fecha' && (
            <input type="date" value={featuredUntil} onChange={e => setFeaturedUntil(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />
          )}
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Vendedor (solo lectura)</label>
        <input value={sellerName} disabled className="w-full border rounded px-2 py-1 bg-gray-50 text-gray-500" />
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Guardar</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
      </div>
    </form>
  );
}

export default function AllAdsPanel() {
  // Filtros
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not_featured'>('all');
  // Resultados y CRUD
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [editAd, setEditAd] = useState<Ad | null>(null);
  const [deleteAd, setDeleteAd] = useState<Ad | null>(null);
  const [saving, setSaving] = useState(false);

  // Cargar categorías al inicio
  useEffect(() => {
    supabase.from('categories').select('id, display_name').eq('is_active', true).order('display_name')
      .then(({ data }) => setCategories(data || []));
  }, []);

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory('');
      return;
    }
    supabase.from('subcategories').select('id, display_name, category_id').eq('category_id', selectedCategory).eq('is_active', true).order('display_name')
      .then(({ data }) => setSubcategories(data || []));
  }, [selectedCategory]);

  // Buscar avisos solo cuando se hace click en BUSCAR
  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      let query = supabase.from('ads').select('id, title, price, currency, status, featured, featured_until, created_at, user_id').neq('status', 'deleted');
      if (selectedCategory) query = query.eq('category_id', selectedCategory);
      if (selectedSubcategory) query = query.eq('subcategory_id', selectedSubcategory);
      if (featuredFilter === 'featured') query = query.eq('featured', true);
      if (featuredFilter === 'not_featured') query = query.eq('featured', false);
      // No filtro por título ni vendedor en SQL para no sobrecargar
      const { data, error } = await query;
      if (error) throw error;
      // Cargar nombres de vendedores
      const userIds = [...new Set((data || []).map(d => d.user_id).filter(Boolean))];
      let usersMap: Record<string, { name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', userIds);
        (users || []).forEach((u: any) => {
          usersMap[u.id] = {
            name: u.full_name || u.email?.split('@')[0] || 'Sin nombre',
            email: u.email || ''
          };
        });
      }
      const adsWithSellers = (data || []).map(ad => ({
        ...ad,
        seller_name: usersMap[ad.user_id]?.name || 'Sin nombre',
        seller_email: usersMap[ad.user_id]?.email || ''
      }));
      setAds(adsWithSellers);
    } catch (err) {
      notify.error('Error al cargar avisos');
    }
    setLoading(false);
  };

  // Filtros locales (título, vendedor)
  const filteredAds = ads.filter(ad =>
    (!titleFilter || ad.title.toLowerCase().includes(titleFilter.toLowerCase())) &&
    (!sellerFilter || ad.seller_name?.toLowerCase().includes(sellerFilter.toLowerCase()))
  );

  // Guardar edición
  const handleSaveEdit = async (updated: Partial<Ad>) => {
    if (!editAd) return;
    setSaving(true);
    console.log('🔧 Guardando aviso:', editAd.id, updated);
    try {
      const { data, error } = await supabase.from('ads').update(updated).eq('id', editAd.id).select();
      console.log('🔧 Resultado update:', { data, error });
      if (error) throw error;
      notify.success('Aviso actualizado');
      setEditAd(null);
      handleSearch();
    } catch (err) {
      console.error('🔧 Error al guardar:', err);
      notify.error('Error al guardar: ' + (err as Error).message);
    }
    setSaving(false);
  };

  // Eliminar aviso
  const handleDelete = async () => {
    if (!deleteAd) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('ads').delete().eq('id', deleteAd.id);
      if (error) throw error;
      notify.success('Aviso eliminado');
      setDeleteAd(null);
      handleSearch();
    } catch (err) {
      notify.error('Error al eliminar');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestión Global de Avisos</h1>
          <p className="text-sm text-gray-500 mt-1">Superadmin: control total de todos los avisos</p>
        </div>
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">-- Seleccionar --</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.display_name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Subcategoría</label>
            <select value={selectedSubcategory} onChange={e => setSelectedSubcategory(e.target.value)} disabled={!selectedCategory} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">-- Todas --</option>
              {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.display_name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Título</label>
            <input type="text" value={titleFilter} onChange={e => setTitleFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Filtrar por título..." />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Vendedor</label>
            <input type="text" value={sellerFilter} onChange={e => setSellerFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Filtrar por vendedor..." />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Destacado</label>
            <select value={featuredFilter} onChange={e => setFeaturedFilter(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="all">Todos</option>
              <option value="featured">Solo destacados</option>
              <option value="not_featured">No destacados</option>
            </select>
          </div>
          <button onClick={handleSearch} disabled={loading} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} BUSCAR
          </button>
        </div>
        {/* Resultados */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">TÍTULO</th>
                  <th className="px-4 py-3 font-medium text-gray-600">PRECIO</th>
                  <th className="px-4 py-3 font-medium text-gray-600">ESTADO</th>
                  <th className="px-4 py-3 font-medium text-gray-600">VENDEDOR</th>
                  <th className="px-4 py-3 font-medium text-gray-600">DESTACADO</th>
                  <th className="px-4 py-3 font-medium text-gray-600">DESTACADO HASTA</th>
                  <th className="px-4 py-3 font-medium text-gray-600">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAds.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No se encontraron avisos</td></tr>
                ) : filteredAds.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 line-clamp-1">{ad.title}</td>
                    <td className="px-4 py-3 text-gray-600">{ad.price ? `${ad.currency || '$'} ${ad.price.toLocaleString()}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ad.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{ad.status === 'active' ? 'Activo' : ad.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[160px]">{ad.seller_name}</td>
                    <td className="px-4 py-3 text-center">{ad.featured ? <Star className="w-4 h-4 text-yellow-500 inline" /> : <StarOff className="w-4 h-4 text-gray-300 inline" />}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{
                      ad.featured
                        ? (ad.featured_until ? new Date(ad.featured_until).toLocaleDateString('es-AR') : 'Permanente')
                        : '-'
                    }</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar" onClick={() => setEditAd(ad)}><Edit className="w-4 h-4" /></button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Eliminar" onClick={() => setDeleteAd(ad)}><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de edición - FUERA de la tabla */}
      <Modal open={!!editAd} onClose={() => setEditAd(null)}>
        <h2 className="text-lg font-bold mb-2">Editar aviso</h2>
        {editAd && (
          <EditAdForm ad={editAd} saving={saving} onCancel={() => setEditAd(null)} onSave={handleSaveEdit} />
        )}
      </Modal>

      {/* Modal de borrado - FUERA de la tabla */}
      <Modal open={!!deleteAd} onClose={() => setDeleteAd(null)}>
        <h2 className="text-lg font-bold mb-4">¿Eliminar aviso?</h2>
        <p className="mb-4">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
          <button onClick={() => setDeleteAd(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
        </div>
      </Modal>
    </div>
  );
}
