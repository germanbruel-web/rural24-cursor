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
  deleteCategoryType
} from '../../services/v2/formsService';
import type { Category, Subcategory, CategoryType } from '../../types/v2';
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, FolderTree, Folder, FileText } from 'lucide-react';

type ItemType = 'category' | 'subcategory' | 'type';

export const CategoriasAdmin: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [types, setTypes] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<ItemType>('category');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    icon: '',
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
      icon: '',
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
      icon: item.icon || '',
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
            icon: formData.icon,
          });
        } else {
          await createCategory({
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
            icon: formData.icon,
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
      alert(`✅ ${editingItem ? 'Actualizado' : 'Creado'} exitosamente`);
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleDelete = async (item: any, type: ItemType) => {
    const warningText = type === 'category' 
      ? '⚠️ Esto eliminará TODAS las subcategorías, tipos y marcas relacionadas.'
      : type === 'subcategory'
      ? '⚠️ Esto eliminará TODOS los tipos y marcas relacionadas.'
      : '⚠️ Esto eliminará TODAS las marcas relacionadas.';
    
    if (!confirm(`¿Eliminar "${item.display_name}"?\n\n${warningText}`)) {
      return;
    }

    try {
      if (type === 'category') {
        await deleteCategory(item.id);
      } else if (type === 'subcategory') {
        await deleteSubcategory(item.id);
      } else if (type === 'type') {
        await deleteCategoryType(item.id);
      }
      
      loadData();
      alert('✅ Eliminado exitosamente');
    } catch (error: any) {
      alert('❌ Error al eliminar: ' + error.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      icon: '',
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
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
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
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
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
                          onClick={() => handleDelete(category, 'category')}
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
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
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
                                    onClick={() => handleDelete(sub, 'subcategory')}
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
                                      <FileText className="w-4 h-4 text-green-600" />
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
                                          onClick={() => handleDelete(type, 'type')}
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
              {editingItem ? '✏️ Editar' : '➕ Nueva'} {
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

              {formType === 'category' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icono (emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🚜"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

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
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold"
                >
                  {editingItem ? '💾 Guardar Cambios' : '✅ Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
