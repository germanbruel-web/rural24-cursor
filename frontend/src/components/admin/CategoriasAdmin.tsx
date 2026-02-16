// ============================================================================
// GESTIÓN DE CATEGORÍAS - Panel de Administración
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  getCategories, 
  getSubcategories, 
  getCategoryTypes, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  createCategoryType,
  updateCategoryType,
  deleteCategoryType,
  checkSubcategoryDependencies,
  checkCategoryDependencies
} from '../../services/v2/formsService';
import type { Category, Subcategory, CategoryType } from '../../types/v2';
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, FolderTree, Folder, FileText, AlertTriangle } from 'lucide-react';

type ItemType = 'category' | 'subcategory' | 'type';

// Modal de confirmación de eliminación
interface DeleteModalState {
  isOpen: boolean;
  item: any;
  type: ItemType;
  hasAds: boolean;
  adsCount: number;
  adsTitles: string[];
  subcategoriesCount: number;
  isLoading: boolean;
}

export const CategoriasAdmin: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [types, setTypes] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    item: null,
    type: 'category',
    hasAds: false,
    adsCount: 0,
    adsTitles: [],
    subcategoriesCount: 0,
    isLoading: false,
  });

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<ItemType>('category');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    parent_category_id: '',
    parent_subcategory_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, subs, typs] = await Promise.all([
        getCategories(),
        getSubcategories(),
        getCategoryTypes(),
      ]);
      setCategories(cats);
      setSubcategories(subs);
      setTypes(typs);
      
      // Expandir Maquinaria por defecto
      const maquinariaId = cats.find(c => c.name.toLowerCase() === 'maquinaria')?.id;
      if (maquinariaId) {
        setExpandedCategories(new Set([maquinariaId]));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (id: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubcategories(newExpanded);
  };

  const handleNew = (type: ItemType, parentId?: string) => {
    setFormType(type);
    setEditingItem(null);
    
    // Para tipos, necesitamos obtener el category_id de la subcategoría
    let categoryId = '';
    if (type === 'type' && parentId) {
      const sub = subcategories.find(s => s.id === parentId);
      console.log('🔍 Buscando subcategoría:', { parentId, sub, allSubs: subcategories });
      categoryId = sub?.category_id || '';
      console.log('✅ Category ID encontrado:', categoryId);
    } else if (type === 'subcategory') {
      categoryId = parentId || '';
    }
    
    const newFormData = {
      name: '',
      display_name: '',
      description: '',
      parent_category_id: categoryId,
      parent_subcategory_id: type === 'type' ? (parentId || '') : '',
    };
    
    console.log('📝 Form Data para nuevo tipo:', newFormData);
    setFormData(newFormData);
    setShowForm(true);
  };

  const handleEdit = (item: any, type: ItemType) => {
    setFormType(type);
    setEditingItem(item);
    
    // Si estoy editando una subcategoría, buscar su categoría padre
    let parentCategoryId = '';
    if (type === 'subcategory') {
      parentCategoryId = item.category_id || '';
    } else if (type === 'type') {
      // Si estoy editando un tipo, buscar su subcategoría y categoría
      const parentSub = subcategories.find(s => s.id === item.subcategory_id);
      parentCategoryId = parentSub?.category_id || '';
    }
    
    setFormData({
      name: item.name,
      display_name: item.display_name,
      description: item.description || '',
      parent_category_id: parentCategoryId || item.category_id || '',
      parent_subcategory_id: item.subcategory_id || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (formType === 'category') {
        if (editingItem) {
          await updateCategory(editingItem.id, {
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
          });
        } else {
          await createCategory({
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
          });
        }
      } else if (formType === 'subcategory') {
        if (editingItem) {
          await updateSubcategory(editingItem.id, {
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
          });
        } else {
          await createSubcategory({
            category_id: formData.parent_category_id,
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
          });
        }
      } else if (formType === 'type') {
        if (editingItem) {
          await updateCategoryType(editingItem.id, {
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
          });
        } else {
          const typeData = {
            category_id: formData.parent_category_id, // ✅ Incluir category_id
            subcategory_id: formData.parent_subcategory_id,
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
          };
          console.log('🚀 Creando tipo con datos:', typeData);
          await createCategoryType(typeData);
        }
      }
      
      resetForm();
      loadData();
      alert(`${editingItem ? 'Actualizado' : 'Creado'} exitosamente`);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  // Iniciar proceso de eliminación - verifica dependencias primero
  const handleDeleteClick = async (item: any, type: ItemType) => {
    setDeleteModal({
      isOpen: true,
      item,
      type,
      hasAds: false,
      adsCount: 0,
      adsTitles: [],
      subcategoriesCount: 0,
      isLoading: true,
    });

    // Verificar dependencias según el tipo
    if (type === 'subcategory') {
      const deps = await checkSubcategoryDependencies(item.id);
      setDeleteModal(prev => ({
        ...prev,
        hasAds: deps.hasAds,
        adsCount: deps.adsCount,
        adsTitles: deps.adsTitles,
        isLoading: false,
      }));
    } else if (type === 'category') {
      const deps = await checkCategoryDependencies(item.id);
      setDeleteModal(prev => ({
        ...prev,
        hasAds: deps.hasAds,
        adsCount: deps.adsCount,
        subcategoriesCount: deps.subcategoriesCount,
        isLoading: false,
      }));
    } else {
      // Para tipos, no hay dependencias de avisos
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Ejecutar eliminación
  const confirmDelete = async (force: boolean = false) => {
    const { item, type } = deleteModal;
    
    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));

      if (type === 'category') {
        await deleteCategory(item.id, force);
      } else if (type === 'subcategory') {
        await deleteSubcategory(item.id, force);
      } else if (type === 'type') {
        await deleteCategoryType(item.id);
      }
      
      setDeleteModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
      loadData();
      alert('Eliminado exitosamente');
    } catch (error: any) {
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
      alert('Error al eliminar: ' + error.message);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      item: null,
      type: 'category',
      hasAds: false,
      adsCount: 0,
      adsTitles: [],
      subcategoriesCount: 0,
      isLoading: false,
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      parent_category_id: '',
      parent_subcategory_id: '',
    });
  };

  // Helpers para filtrar
  const getSubcategoriesForCategory = (categoryId: string) => 
    subcategories.filter(s => s.category_id === categoryId);
  
  const getTypesForSubcategory = (subcategoryId: string) =>
    types.filter(t => t.subcategory_id === subcategoryId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h2>
          <p className="text-gray-600 mt-1">
            {categories.length} categorías • {subcategories.length} subcategorías • {types.length} tipos
          </p>
        </div>
        <button
          onClick={() => handleNew('category')}
          className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Categoría
        </button>
      </div>

      {/* Tree View */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay categorías. Crea la primera.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map(category => {
                const isExpanded = expandedCategories.has(category.id);
                const subs = getSubcategoriesForCategory(category.id);
                
                return (
                  <div key={category.id} className="border-l-2 border-gray-200">
                    {/* Categoría */}
                    <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {subs.length > 0 ? (
                          isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                        ) : (
                          <div className="w-4" />
                        )}
                      </button>
                      <FolderTree className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900 flex-1">
                        {category.display_name}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {category.name}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleNew('subcategory', category.id)}
                          className="p-1.5 text-brand-500 hover:bg-brand-50 rounded transition"
                          title="Agregar subcategoría"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(category, 'category')}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category, 'category')}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategorías */}
                    {isExpanded && subs.length > 0 && (
                      <div className="ml-8 space-y-1 mt-1">
                        {subs.map(sub => {
                          const subExpanded = expandedSubcategories.has(sub.id);
                          const subTypes = getTypesForSubcategory(sub.id);
                          
                          return (
                            <div key={sub.id} className="border-l-2 border-gray-200">
                              {/* Subcategoría */}
                              <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded">
                                <button
                                  onClick={() => toggleSubcategory(sub.id)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  {subTypes.length > 0 ? (
                                    subExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                  ) : (
                                    <div className="w-4" />
                                  )}
                                </button>
                                <Folder className="w-4 h-4 text-yellow-600" />
                                <span className="font-medium text-gray-800 flex-1">
                                  {sub.display_name}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {sub.name}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleNew('type', sub.id)}
                                    className="p-1.5 text-brand-500 hover:bg-brand-50 rounded transition"
                                    title="Agregar tipo"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(sub, 'subcategory')}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(sub, 'subcategory')}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Tipos */}
                              {subExpanded && subTypes.length > 0 && (
                                <div className="ml-8 space-y-1 mt-1">
                                  {subTypes.map(type => (
                                    <div key={type.id} className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded">
                                      <div className="w-4" />
                                      <FileText className="w-4 h-4 text-brand-500" />
                                      <span className="text-gray-700 flex-1">
                                        {type.display_name}
                                      </span>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {type.name}
                                      </span>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleEdit(type, 'type')}
                                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                          title="Editar"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteClick(type, 'type')}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                          title="Eliminar"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingItem ? 'Editar' : 'Nueva'} {
                formType === 'category' ? 'Categoría' :
                formType === 'subcategory' ? 'Subcategoría' : 'Tipo'
              }
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre interno (slug) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej: maquinaria, tractores"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Minúsculas, sin espacios</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre visible *
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="ej: Maquinaria, Tractores"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción breve..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition font-semibold"
                >
                  {editingItem ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 ${deleteModal.hasAds ? 'bg-amber-50 border-b border-amber-200' : 'bg-red-50 border-b border-red-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${deleteModal.hasAds ? 'bg-amber-100' : 'bg-red-100'}`}>
                  {deleteModal.hasAds ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <Trash2 className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {deleteModal.hasAds ? 'Advertencia: Hay avisos asociados' : 'Confirmar eliminación'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {deleteModal.type === 'category' ? 'Categoría' : 
                     deleteModal.type === 'subcategory' ? 'Subcategoría' : 'Tipo'}
                    : <span className="font-semibold">{deleteModal.item?.display_name}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              {deleteModal.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Verificando dependencias...</span>
                </div>
              ) : deleteModal.hasAds ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 font-medium">
                      ⚠️ Se encontraron {deleteModal.adsCount} aviso{deleteModal.adsCount !== 1 ? 's' : ''} publicado{deleteModal.adsCount !== 1 ? 's' : ''}
                    </p>
                    {deleteModal.adsTitles.length > 0 && (
                      <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                        {deleteModal.adsTitles.slice(0, 3).map((title, i) => (
                          <li key={i} className="truncate">{title}</li>
                        ))}
                        {deleteModal.adsCount > 3 && (
                          <li className="text-amber-600 italic">...y {deleteModal.adsCount - 3} más</li>
                        )}
                      </ul>
                    )}
                  </div>
                  
                  {deleteModal.type === 'category' && deleteModal.subcategoriesCount > 0 && (
                    <p className="text-gray-600 text-sm">
                      También se eliminarán <span className="font-semibold">{deleteModal.subcategoriesCount} subcategorías</span> y sus tipos.
                    </p>
                  )}
                  
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">Opciones:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Cancelar:</strong> No eliminar nada</li>
                      <li><strong>Forzar eliminación:</strong> Elimina TODO incluyendo avisos</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    ¿Está seguro que desea eliminar{' '}
                    <span className="font-semibold">"{deleteModal.item?.display_name}"</span>?
                  </p>
                  
                  {deleteModal.type === 'category' && (
                    <p className="text-sm text-gray-500">
                      Se eliminarán todas las subcategorías y tipos relacionados.
                    </p>
                  )}
                  {deleteModal.type === 'subcategory' && (
                    <p className="text-sm text-gray-500">
                      Se eliminarán todos los tipos relacionados.
                    </p>
                  )}
                  
                  <p className="text-red-600 text-sm font-medium">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteModal.isLoading}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              
              {deleteModal.hasAds ? (
                <button
                  onClick={() => confirmDelete(true)}
                  disabled={deleteModal.isLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Forzar eliminación
                </button>
              ) : (
                <button
                  onClick={() => confirmDelete(false)}
                  disabled={deleteModal.isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
