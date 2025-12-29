import { useState, useEffect } from 'react';
import { 
  getCategoryHierarchy,
  createOperationType,
  updateOperationType,
  deleteOperationType,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  createServiceMainCategory,
  updateServiceMainCategory,
  deleteServiceMainCategory,
  createServiceSubcategory,
  updateServiceSubcategory,
  deleteServiceSubcategory,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getModels,
  createModel,
  updateModel,
  deleteModel,
  getSubcategories,
  assignBrandToSubcategory,
  removeBrandFromSubcategory,
  getBrandsBySubcategory
} from '../../../services/categoriesService';
import { supabase } from '../../../services/supabaseClient';
import { notify } from '../../../utils/notifications';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, Search, Link2, Unlink } from 'lucide-react';
import CategoryModal from '../../modals/CategoryModal';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';

interface HierarchyNode {
  id: string;
  name: string;
  display_name: string;
  sort_order: number;
  is_active: boolean;
  children?: HierarchyNode[];
}

type ModalType = 
  | 'operation-type' 
  | 'category' 
  | 'subcategory' 
  | 'service-main' 
  | 'service-sub' 
  | null;

export default function CategoriesAdminPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'categories' | 'brands' | 'models'>('categories');
  
  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    id: string;
    name: string;
  } | null>(null);

  // Brands tab states
  const [brands, setBrands] = useState<any[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBrandForAssign, setSelectedBrandForAssign] = useState<any>(null);
  const [assignedSubcategories, setAssignedSubcategories] = useState<Set<string>>(new Set());

  // Models tab states
  const [models, setModels] = useState<any[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('');
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  useEffect(() => {
    loadHierarchy();
  }, []);

  useEffect(() => {
    if (selectedTab === 'brands') {
      loadBrands();
      loadSubcategories();
    } else if (selectedTab === 'models') {
      loadModels();
      loadBrands(); // Needed for filter dropdown
    }
  }, [selectedTab]);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const data = await getCategoryHierarchy();
      setHierarchy(data);
    } catch (error: any) {
      notify.error('Error al cargar categorías: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (error: any) {
      notify.error('Error al cargar marcas: ' + error.message);
    }
  };

  const loadSubcategories = async () => {
    try {
      const data = await getSubcategories();
      setSubcategories(data);
    } catch (error: any) {
      notify.error('Error al cargar subcategorías: ' + error.message);
    }
  };

  const loadModels = async () => {
    try {
      const data = await getModels(selectedBrandFilter || undefined);
      setModels(data);
    } catch (error: any) {
      notify.error('Error al cargar modelos: ' + error.message);
    }
  };

  // CRUD Handlers
  const handleSave = async (data: any) => {
    try {
      switch (modalType) {
        case 'operation-type':
          if (modalData) {
            await updateOperationType(modalData.id, data);
            notify.success('Tipo de operación actualizado');
          } else {
            await createOperationType(data);
            notify.success('Tipo de operación creado');
          }
          break;
        case 'category':
          if (modalData) {
            await updateCategory(modalData.id, data);
            notify.success('Categoría actualizada');
          } else {
            await createCategory({ ...data, operation_type_id: parentId });
            notify.success('Categoría creada');
          }
          break;
        case 'subcategory':
          if (modalData) {
            await updateSubcategory(modalData.id, data);
            notify.success('Subcategoría actualizada');
          } else {
            await createSubcategory({ ...data, category_id: parentId });
            notify.success('Subcategoría creada');
          }
          break;
        case 'service-main':
          if (modalData) {
            await updateServiceMainCategory(modalData.id, data);
            notify.success('Categoría de servicio actualizada');
          } else {
            await createServiceMainCategory({ ...data, category_id: parentId });
            notify.success('Categoría de servicio creada');
          }
          break;
        case 'service-sub':
          if (modalData) {
            await updateServiceSubcategory(modalData.id, data);
            notify.success('Subcategoría de servicio actualizada');
          } else {
            await createServiceSubcategory({ ...data, service_main_category_id: parentId });
            notify.success('Subcategoría de servicio creada');
          }
          break;
      }
      await loadHierarchy();
      setModalType(null);
      setModalData(null);
      setParentId(null);
    } catch (error: any) {
      notify.error('Error al guardar: ' + error.message);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    
    try {
      switch (deleteModal.type) {
        case 'operation-type':
          await deleteOperationType(deleteModal.id);
          break;
        case 'category':
          await deleteCategory(deleteModal.id);
          break;
        case 'subcategory':
          await deleteSubcategory(deleteModal.id);
          break;
        case 'service-main':
          await deleteServiceMainCategory(deleteModal.id);
          break;
        case 'service-sub':
          await deleteServiceSubcategory(deleteModal.id);
          break;
      }
      notify.success('Eliminado correctamente');
      await loadHierarchy();
      setDeleteModal(null);
    } catch (error: any) {
      notify.error('Error al eliminar: ' + error.message);
      throw error;
    }
  };

  const openEditModal = (type: ModalType, data: any) => {
    setModalType(type);
    setModalData(data);
  };

  const openCreateModal = (type: ModalType, parentIdValue: string) => {
    setModalType(type);
    setModalData(null);
    setParentId(parentIdValue);
  };

  const openDeleteModal = (type: ModalType, id: string, name: string) => {
    setDeleteModal({ isOpen: true, type, id, name });
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Brand handlers
  const handleSaveBrand = async (data: any) => {
    try {
      if (selectedBrand) {
        await updateBrand(selectedBrand.id, data);
        notify.success('Marca actualizada');
      } else {
        await createBrand(data);
        notify.success('Marca creada');
      }
      await loadBrands();
      setBrandModalOpen(false);
      setSelectedBrand(null);
    } catch (error: any) {
      notify.error('Error al guardar marca: ' + error.message);
      throw error;
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta marca?')) return;
    try {
      await deleteBrand(brandId);
      notify.success('Marca eliminada');
      await loadBrands();
    } catch (error: any) {
      notify.error('Error al eliminar marca: ' + error.message);
    }
  };

  const loadAssignedSubcategories = async (brandId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategory_brands')
        .select('subcategory_id')
        .eq('brand_id', brandId);
      
      if (error) throw error;
      const assigned = new Set(data.map(item => item.subcategory_id));
      setAssignedSubcategories(assigned);
    } catch (error: any) {
      console.error('Error loading assigned subcategories:', error);
      setAssignedSubcategories(new Set());
    }
  };

  const handleAssignBrand = async (subcategoryId: string) => {
    if (!selectedBrandForAssign) return;
    try {
      await assignBrandToSubcategory(subcategoryId, selectedBrandForAssign.id);
      notify.success('Marca asignada a subcategoría');
      await loadAssignedSubcategories(selectedBrandForAssign.id);
    } catch (error: any) {
      notify.error('Error al asignar marca: ' + error.message);
    }
  };

  const handleUnassignBrand = async (subcategoryId: string) => {
    if (!selectedBrandForAssign) return;
    try {
      await removeBrandFromSubcategory(subcategoryId, selectedBrandForAssign.id);
      notify.success('Marca desasignada');
      await loadAssignedSubcategories(selectedBrandForAssign.id);
    } catch (error: any) {
      notify.error('Error al desasignar marca: ' + error.message);
    }
  };

  const handleRemoveBrandFromSubcat = async (subcategoryId: string, brandId: string) => {
    if (!confirm('¿Desasignar esta marca de la subcategoría?')) return;
    try {
      await removeBrandFromSubcategory(subcategoryId, brandId);
      notify.success('Marca desasignada');
      await loadBrands();
    } catch (error: any) {
      notify.error('Error al desasignar marca: ' + error.message);
    }
  };

  // Model handlers
  const handleSaveModel = async (data: any) => {
    try {
      if (selectedModel) {
        await updateModel(selectedModel.id, data);
        notify.success('Modelo actualizado');
      } else {
        await createModel(data);
        notify.success('Modelo creado');
      }
      await loadModels();
      setModelModalOpen(false);
      setSelectedModel(null);
    } catch (error: any) {
      notify.error('Error al guardar modelo: ' + error.message);
      throw error;
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('¿Estás seguro de eliminar este modelo?')) return;
    try {
      await deleteModel(modelId);
      notify.success('Modelo eliminado');
      await loadModels();
    } catch (error: any) {
      notify.error('Error al eliminar modelo: ' + error.message);
    }
  };

  const renderOperationType = (operationType: any) => {
    const isExpanded = expandedNodes.has(operationType.id);
    
    return (
      <div key={operationType.id} className="mb-4">
        {/* Tipo de operación */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => toggleNode(operationType.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {operationType.display_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {operationType.categories?.length || 0} categorías
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openEditModal('operation-type', operationType)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => openCreateModal('category', operationType.id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Categorías expandidas */}
          {isExpanded && operationType.categories && (
            <div className="ml-8 mt-4 space-y-3">
              {operationType.categories.map((category: any) => renderCategory(category))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCategory = (category: any) => {
    const isExpanded = expandedNodes.has(category.id);
    const hasSubcategories = category.subcategories?.length > 0;
    const hasServiceCategories = category.service_main_categories?.length > 0;
    
    return (
      <div key={category.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {(hasSubcategories || hasServiceCategories) && (
              <button
                onClick={() => toggleNode(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{category.display_name}</h4>
              <p className="text-xs text-gray-500">
                {hasSubcategories && `${category.subcategories.length} subcategorías`}
                {hasServiceCategories && `${category.service_main_categories.length} categorías de servicio`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => openEditModal('category', category)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => openCreateModal(hasSubcategories ? 'subcategory' : 'service-main', category.id)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => openDeleteModal('category', category.id, category.display_name)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subcategorías */}
        {isExpanded && hasSubcategories && (
          <div className="ml-6 mt-3 space-y-2">
            {category.subcategories.map((sub: any) => (
              <div key={sub.id} className="bg-white border border-gray-200 rounded p-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-700">{sub.display_name}</span>
                    {sub.has_brands && (
                      <span className="ml-2 text-xs text-blue-600">📦 Marcas</span>
                    )}
                    {sub.has_models && (
                      <span className="ml-2 text-xs text-purple-600">🔧 Modelos</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal('subcategory', sub)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => openDeleteModal('subcategory', sub.id, sub.display_name)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categorías de servicio (jerarquía especial para Ganadería) */}
        {isExpanded && hasServiceCategories && (
          <div className="ml-6 mt-3 space-y-2">
            {category.service_main_categories.map((mainCat: any) => (
              <div key={mainCat.id} className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-blue-800">{mainCat.display_name}</span>
                    <span className="ml-2 text-xs text-gray-600">
                      {mainCat.service_subcategories?.length || 0} servicios
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal('service-main', mainCat)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => openCreateModal('service-sub', mainCat.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => openDeleteModal('service-main', mainCat.id, mainCat.display_name)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Subcategorías de servicio */}
                {mainCat.service_subcategories && mainCat.service_subcategories.length > 0 && (
                  <div className="ml-4 mt-2 space-y-1">
                    {mainCat.service_subcategories.map((serviceSub: any) => (
                      <div key={serviceSub.id} className="bg-white border border-gray-200 rounded p-1.5 text-xs flex items-center justify-between">
                        <span className="text-gray-700">{serviceSub.display_name}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openEditModal('service-sub', serviceSub)}
                            className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal('service-sub', serviceSub.id, serviceSub.display_name)}
                            className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
        <p className="text-gray-600 mt-2">
          Administra la estructura de categorías, marcas y modelos del formulario de avisos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab('categories')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            selectedTab === 'categories'
              ? 'border-[#16a135] text-[#16a135]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📁 Categorías
        </button>
        <button
          onClick={() => setSelectedTab('brands')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            selectedTab === 'brands'
              ? 'border-[#16a135] text-[#16a135]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📦 Marcas
        </button>
        <button
          onClick={() => setSelectedTab('models')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            selectedTab === 'models'
              ? 'border-[#16a135] text-[#16a135]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🔧 Modelos
        </button>
      </div>

      {/* Content */}
      {selectedTab === 'categories' && (
        <div>
          {/* Botón para crear nuevo tipo de operación */}
          <div className="mb-4 flex justify-end">
            <button 
              onClick={() => openCreateModal('operation-type', '')}
              className="flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2d] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuevo Tipo de Operación
            </button>
          </div>

          {/* Jerarquía de categorías */}
          <div className="space-y-4">
            {hierarchy.map(operationType => renderOperationType(operationType))}
          </div>
        </div>
      )}

      {selectedTab === 'brands' && (
        <div>
          {/* Header con búsqueda y botón crear */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar marcas..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-[#16a135]"
              />
            </div>
            <button 
              onClick={() => {
                setSelectedBrand(null);
                setBrandModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2d] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Marca
            </button>
          </div>

          {/* Lista de marcas */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre para Mostrar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {brands
                  .filter(brand => 
                    brand.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
                    brand.display_name.toLowerCase().includes(brandSearch.toLowerCase())
                  )
                  .map((brand) => (
                    <tr key={brand.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{brand.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{brand.display_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{brand.sort_order}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={async () => {
                              setSelectedBrandForAssign(brand);
                              await loadAssignedSubcategories(brand.id);
                              setAssignModalOpen(true);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Asignar a subcategorías"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBrand(brand);
                              setBrandModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(brand.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {brands.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay marcas registradas
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'models' && (
        <div>
          {/* Header con filtros y botón crear */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar modelos..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-[#16a135]"
                />
              </div>
              <select
                value={selectedBrandFilter}
                onChange={(e) => {
                  setSelectedBrandFilter(e.target.value);
                  loadModels();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-[#16a135]"
              >
                <option value="">Todas las marcas</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.display_name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => {
                setSelectedModel(null);
                setModelModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2d] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuevo Modelo
            </button>
          </div>

          {/* Lista de modelos */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Año Desde</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Año Hasta</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {models
                  .filter(model => 
                    model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                    model.display_name.toLowerCase().includes(modelSearch.toLowerCase())
                  )
                  .map((model) => (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{model.display_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{model.brand?.display_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{model.year_from || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{model.year_to || 'Actual'}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedModel(model);
                              setModelModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteModel(model.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {models.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay modelos registrados
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear/editar */}
      <CategoryModal
        isOpen={modalType !== null}
        onClose={() => {
          setModalType(null);
          setModalData(null);
          setParentId(null);
        }}
        onSave={handleSave}
        title={
          modalType === 'operation-type' 
            ? (modalData ? 'Editar Tipo de Operación' : 'Nuevo Tipo de Operación')
            : modalType === 'category'
            ? (modalData ? 'Editar Categoría' : 'Nueva Categoría')
            : modalType === 'subcategory'
            ? (modalData ? 'Editar Subcategoría' : 'Nueva Subcategoría')
            : modalType === 'service-main'
            ? (modalData ? 'Editar Categoría de Servicio' : 'Nueva Categoría de Servicio')
            : (modalData ? 'Editar Subcategoría de Servicio' : 'Nueva Subcategoría de Servicio')
        }
        initialData={modalData}
        fields={
          modalType === 'operation-type'
            ? [
                { name: 'name', label: 'Nombre Interno', type: 'text', required: true },
                { name: 'display_name', label: 'Nombre para Mostrar', type: 'text', required: true },
              ]
            : modalType === 'category'
            ? [
                { name: 'name', label: 'Nombre Interno', type: 'text', required: true },
                { name: 'display_name', label: 'Nombre para Mostrar', type: 'text', required: true },
              ]
            : modalType === 'subcategory'
            ? [
                { name: 'name', label: 'Nombre Interno', type: 'text', required: true },
                { name: 'display_name', label: 'Nombre para Mostrar', type: 'text', required: true },
              ]
            : modalType === 'service-main'
            ? [
                { name: 'name', label: 'Nombre Interno', type: 'text', required: true },
                { name: 'display_name', label: 'Nombre para Mostrar', type: 'text', required: true },
              ]
            : [
                { name: 'name', label: 'Nombre Interno', type: 'text', required: true },
                { name: 'display_name', label: 'Nombre para Mostrar', type: 'text', required: true },
              ]
        }
      />

      {/* Modal de confirmación para eliminar */}
      <DeleteConfirmModal
        isOpen={deleteModal?.isOpen || false}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={
          deleteModal?.type === 'operation-type'
            ? 'Esta acción eliminará el tipo de operación y todas sus categorías asociadas.'
            : deleteModal?.type === 'category'
            ? 'Esta acción eliminará la categoría y todas sus subcategorías asociadas.'
            : 'Esta acción eliminará el elemento seleccionado.'
        }
        itemName={deleteModal?.name || ''}
      />

      {/* Modal para crear/editar marcas */}
      <CategoryModal
        isOpen={brandModalOpen}
        onClose={() => {
          setBrandModalOpen(false);
          setSelectedBrand(null);
        }}
        onSave={handleSaveBrand}
        title={selectedBrand ? 'Editar Marca' : 'Nueva Marca'}
        initialData={selectedBrand}
        fields={[
          { name: 'name', label: 'Nombre Interno', type: 'text', required: true },
          { name: 'display_name', label: 'Nombre para Mostrar', type: 'text', required: true },
          { name: 'sort_order', label: 'Orden', type: 'number', required: false },
        ]}
      />

      {/* Modal para asignar marcas a subcategorías */}
      {assignModalOpen && selectedBrandForAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Asignar "{selectedBrandForAssign.display_name}" a Subcategorías
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {assignedSubcategories.size} subcategoría{assignedSubcategories.size !== 1 ? 's' : ''} asignada{assignedSubcategories.size !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-6 space-y-3">
              {subcategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay subcategorías disponibles
                </div>
              ) : (
                subcategories.map((subcat: any) => {
                  const isAssigned = assignedSubcategories.has(subcat.id);
                  return (
                    <div 
                      key={subcat.id} 
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        isAssigned 
                          ? 'border-2 border-[#16a135] bg-[#16a135]/5' 
                          : 'border border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{subcat.display_name}</p>
                          {isAssigned && (
                            <span className="px-2 py-0.5 bg-[#16a135] text-white text-xs rounded-full font-medium">
                              ✓ Asignada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{subcat.name}</p>
                      </div>
                      {isAssigned ? (
                        <button
                          onClick={() => handleUnassignBrand(subcat.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Unlink className="w-4 h-4" />
                          Desasignar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssignBrand(subcat.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2d] transition-colors"
                        >
                          <Link2 className="w-4 h-4" />
                          Asignar
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedBrandForAssign(null);
                  setAssignedSubcategories(new Set());
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar modelos */}
      <CategoryModal
        isOpen={modelModalOpen}
        onClose={() => {
          setModelModalOpen(false);
          setSelectedModel(null);
        }}
        onSave={handleSaveModel}
        title={selectedModel ? 'Editar Modelo' : 'Nuevo Modelo'}
        initialData={selectedModel}
        fields={[
          { name: 'name', label: 'Nombre Interno', type: 'text', required: true },
          { name: 'display_name', label: 'Nombre para Mostrar', type: 'text', required: true },
          { 
            name: 'brand_id', 
            label: 'Marca', 
            type: 'select', 
            required: true,
            options: brands.map(b => ({ value: b.id, label: b.display_name }))
          },
          { name: 'year_from', label: 'Año Desde', type: 'number', required: false },
          { name: 'year_to', label: 'Año Hasta', type: 'number', required: false },
          { name: 'sort_order', label: 'Orden', type: 'number', required: false },
        ]}
      />
    </div>
  );
}
