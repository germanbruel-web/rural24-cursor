/**
 * =====================================================
 * CATEGORY ICONS CMS - Gestión de Iconos de Categorías
 * =====================================================
 * CRUD para iconos que aparecen en el Hero de Homepage
 * Los iconos se almacenan en Supabase Storage (bucket: cms)
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  Loader, 
  Image as ImageIcon,
  Check,
  X,
  Save,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useToastHelpers } from '../../contexts/ToastContext';
import { getCategories } from '../../services/v2/formsService';

interface CategoryIcon {
  id: string;
  name: string;
  title: string | null;
  paragraph: string | null;
  url_light: string;
  url_dark: string | null;
  storage_path: string | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  display_name: string;
  icon: string | null;
}

export const CategoryIconsCMS: React.FC = () => {
  const [icons, setIcons] = useState<CategoryIcon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIcon, setEditingIcon] = useState<CategoryIcon | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    paragraph: '',
    file: null as File | null,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToastHelpers();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar iconos desde category_icons (si existe la tabla)
      // Por ahora, simular con los iconos estáticos existentes
      const { data: iconsData, error: iconsError } = await supabase
        .from('category_icons')
        .select('*')
        .order('name');

      if (iconsError) {
        // Si la tabla no existe, mostrar mensaje para crearla
        if (iconsError.code === '42P01') {
          toast.info(
            'Tabla no encontrada',
            'Ejecuta la migración para crear category_icons',
            5000
          );
          // Cargar iconos actuales de categories como fallback
          await loadLegacyIcons();
        } else {
          console.error('Error loading icons:', iconsError);
        }
      } else {
        setIcons(iconsData || []);
      }

      // Cargar categorías para mostrar asignaciones
      const cats = await getCategories();
      setCategories(cats);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar iconos legacy desde /public/images/icons/
  const loadLegacyIcons = async () => {
    const legacyIcons: CategoryIcon[] = [
      { id: 'legacy-1', name: 'Maquinarias', url_light: '/images/icons/icon-1.png', url_dark: null, storage_path: null, created_at: '', updated_at: '' },
      { id: 'legacy-2', name: 'Ganadería', url_light: '/images/icons/icon-2.png', url_dark: null, storage_path: null, created_at: '', updated_at: '' },
      { id: 'legacy-3', name: 'Insumos', url_light: '/images/icons/icon-3.png', url_dark: null, storage_path: null, created_at: '', updated_at: '' },
      { id: 'legacy-4', name: 'Inmuebles', url_light: '/images/icons/icon-4.png', url_dark: null, storage_path: null, created_at: '', updated_at: '' },
      { id: 'legacy-5', name: 'Servicios', url_light: '/images/icons/icon-6.png', url_dark: null, storage_path: null, created_at: '', updated_at: '' },
    ];
    setIcons(legacyIcons);
  };

  const handleNew = () => {
    setEditingIcon(null);
    setFormData({ name: '', title: '', paragraph: '', file: null });
    setPreviewUrl(null);
    setShowModal(true);
  };

  const handleEdit = (icon: CategoryIcon) => {
    setEditingIcon(icon);
    setFormData({ 
      name: icon.name, 
      title: icon.title || '', 
      paragraph: icon.paragraph || '', 
      file: null 
    });
    setPreviewUrl(icon.url_light);
    setShowModal(true);
  };

  const handleDelete = async (icon: CategoryIcon) => {
    if (!confirm(`¿Eliminar el icono "${icon.name}"?`)) return;

    try {
      // Si tiene storage_path, eliminar de Supabase Storage
      if (icon.storage_path) {
        await supabase.storage.from('cms-images').remove([icon.storage_path]);
      }

      // Eliminar de la tabla
      const { error } = await supabase
        .from('category_icons')
        .delete()
        .eq('id', icon.id);

      if (error) throw error;

      toast.success('Eliminado', 'El icono se eliminó correctamente');
      loadData();
    } catch (error) {
      console.error('Error deleting icon:', error);
      toast.error('Error', 'No se pudo eliminar el icono');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!['image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido', 'Solo se permiten PNG, SVG o WebP');
      return;
    }

    // Validar tamaño (max 500KB para iconos)
    if (file.size > 500 * 1024) {
      toast.error('Archivo muy grande', 'El icono debe ser menor a 500KB');
      return;
    }

    setFormData({ ...formData, file });
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Error', 'El nombre es requerido');
      return;
    }

    if (!editingIcon && !formData.file) {
      toast.error('Error', 'Debes seleccionar un archivo');
      return;
    }

    try {
      setUploading(true);
      let iconUrl = editingIcon?.url_light || '';
      let storagePath = editingIcon?.storage_path || null;

      // Subir nueva imagen si hay archivo
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `icons/${Date.now()}-${formData.name.toLowerCase().replace(/\s+/g, '-')}.${fileExt}`;

        // Eliminar anterior si existe
        if (editingIcon?.storage_path) {
          await supabase.storage.from('cms-images').remove([editingIcon.storage_path]);
        }

        // Subir nueva
        const { error: uploadError } = await supabase.storage
          .from('cms-images')
          .upload(fileName, formData.file, {
            cacheControl: '31536000', // 1 año
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(fileName);
        iconUrl = urlData.publicUrl;
        storagePath = fileName;
      }

      // Guardar en BD
      if (editingIcon) {
        const { error } = await supabase
          .from('category_icons')
          .update({
            name: formData.name,
            title: formData.title || null,
            paragraph: formData.paragraph || null,
            url_light: iconUrl,
            storage_path: storagePath,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingIcon.id);

        if (error) throw error;
        toast.success('Actualizado', 'El icono se actualizó correctamente');
      } else {
        const { error } = await supabase
          .from('category_icons')
          .insert({
            name: formData.name,
            title: formData.title || null,
            paragraph: formData.paragraph || null,
            url_light: iconUrl,
            storage_path: storagePath
          });

        if (error) throw error;
        toast.success('Creado', 'El icono se creó correctamente');
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving icon:', error);
      toast.error('Error', error.message || 'No se pudo guardar el icono');
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIcon(null);
    setFormData({ name: '', title: '', paragraph: '', file: null });
    if (previewUrl && !previewUrl.startsWith('/images')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-600">Cargando iconos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-gray-600" />
            Iconos de Categorías
          </h1>
          <p className="mt-1 text-gray-500">
            Iconos para los botones del Hero
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="px-3 py-1 bg-gray-100 rounded-full">
            {icons.length} iconos
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#16a135] hover:bg-[#138a2c] text-white rounded-lg font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Icono
        </button>
      </div>

      {/* Icons Grid */}
      {icons.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No hay iconos configurados</p>
          <p className="text-gray-500 text-sm mt-2">Crea el primer icono para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {icons.map((icon) => (
            <div
              key={icon.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all group"
            >
              {/* Preview con fondo negro (simula Hero) */}
              <div className="bg-gray-900 rounded-lg p-4 mb-3 flex items-center justify-center h-24">
                <img
                  src={icon.url_light}
                  alt={icon.name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/images/icons/icon-1.png';
                  }}
                />
              </div>

              {/* Nombre */}
              <p className="font-semibold text-gray-900 text-center truncate">
                {icon.name}
              </p>

              {/* Tipo */}
              <p className="text-xs text-gray-500 text-center mt-1">
                {icon.storage_path ? 'Supabase' : 'Estático'}
              </p>

              {/* Actions */}
              <div className="flex justify-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(icon)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(icon)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar"
                  disabled={icon.id.startsWith('legacy')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingIcon ? 'Editar Icono' : 'Nuevo Icono'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del icono *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej: Maquinarias, Ganadería..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ej: Maquinaria agrícola de calidad"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Párrafo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Párrafo (opcional)
                </label>
                <textarea
                  value={formData.paragraph}
                  onChange={(e) => setFormData({ ...formData, paragraph: e.target.value })}
                  placeholder="Descripción breve de la categoría..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Archivo de icono {!editingIcon && '*'}
                </label>
                
                {/* Preview */}
                {previewUrl && (
                  <div className="mb-3 bg-gray-900 rounded-lg p-6 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click para subir o arrastra un archivo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, SVG o WebP • Máx 500KB • Fondo transparente
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.svg,.webp,image/png,image/svg+xml,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingIcon ? 'Guardar cambios' : 'Crear icono'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
