import React, { useState, useRef } from 'react';
import { ChevronRight, Plus, Save, ArrowLeft } from 'lucide-react';
import { uploadService } from '../../../services/uploadService';
import { useCategoriesAdmin } from './useCategoriesAdmin';
import { CategoryItemList } from './CategoryItemList';
import { CategoryItemModal } from './CategoryItemModal';
import { CategoryBulkImportModal } from './CategoryBulkImportModal';
import type {
  NavigationState,
  CategoryFormData,
  SubcategoryFormData,
  CategoryTypeFormData,
  ModelFormData,
  BrandFormData,
} from './CategoriesAdminV2.types';

export const CategoriesAdminPageV2: React.FC = () => {
  const [nav, setNav] = useState<NavigationState>({ mode: 'categories' });
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingCategoryType, setEditingCategoryType] = useState<any>(null);

  // Form data states
  const [categoryTypeFormData, setCategoryTypeFormData] = useState<CategoryTypeFormData>({
    display_name: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });
  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    display_name: '',
    is_active: true,
  });
  const [brandFormData, setBrandFormData] = useState<BrandFormData>({
    name: '',
    display_name: '',
    is_active: true,
  });
  const [subcategoryFormData, setSubcategoryFormData] = useState<SubcategoryFormData>({
    name: '',
    display_name: '',
    is_active: true,
    has_brands: false,
    has_models: false,
    sort_order: 0,
  });
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: '',
    display_name: '',
    is_active: true,
    sort_order: 0,
    icon: '',
  });
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Bulk import states
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkModelsText, setBulkModelsText] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [showBulkImportTypes, setShowBulkImportTypes] = useState(false);
  const [bulkTypesText, setBulkTypesText] = useState('');
  const [bulkImportingTypes, setBulkImportingTypes] = useState(false);

  const { loading, loadData, getFilteredData, handleDelete, handleSubmit, handleBulkImport, handleBulkImportTypes } = useCategoriesAdmin(nav);
  const filteredData = getFilteredData(searchTerm);

  // Navigation functions
  const navigateToSubcategories = (categoryId: string, categoryName: string) => {
    setNav({ mode: 'subcategories', categoryId, categoryName });
  };

  const navigateToCategoryTypes = (subcategoryId: string, subcategoryName: string) => {
    setNav({ ...nav, mode: 'category_types', subcategoryId, subcategoryName });
  };

  const navigateToBrands = (subcategoryId: string, subcategoryName: string) => {
    setNav({ ...nav, mode: 'brands', subcategoryId, subcategoryName });
  };

  const navigateToModels = (brandId: string, brandName: string) => {
    setNav({ ...nav, mode: 'models', brandId, brandName });
  };

  const goBack = () => {
    if (nav.mode === 'models') {
      setNav({ ...nav, mode: 'brands', brandId: undefined, brandName: undefined });
    } else if (nav.mode === 'brands') {
      setNav({ ...nav, mode: 'subcategories', subcategoryId: undefined, subcategoryName: undefined });
    } else if (nav.mode === 'category_types') {
      setNav({ ...nav, mode: 'subcategories', categoryTypeId: undefined, categoryTypeName: undefined });
    } else if (nav.mode === 'subcategories') {
      setNav({ mode: 'categories', categoryId: undefined, categoryName: undefined });
    }
  };

  // Breadcrumb
  const renderBreadcrumb = () => {
    const items = [];

    if (nav.categoryName) {
      items.push(nav.categoryName);
    }
    if (nav.subcategoryName) {
      items.push(nav.subcategoryName);
    }
    if (nav.categoryTypeName) {
      items.push(nav.categoryTypeName);
    }
    if (nav.brandName) {
      items.push(nav.brandName);
    }

    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <button
          onClick={() => setNav({ mode: 'categories' })}
          className="hover:text-brand-600 transition-colors"
        >
          Inicio
        </button>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-4 h-4" />
            <span className={index === items.length - 1 ? 'text-brand-600 font-medium' : ''}>
              {item}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Modal handlers
  const openCreateModal = () => {
    setEditingModel(null);
    setEditingBrand(null);
    setEditingSubcategory(null);
    setEditingCategory(null);
    setEditingCategoryType(null);

    if (nav.mode === 'categories') {
      setCategoryFormData({ name: '', display_name: '', is_active: true, sort_order: filteredData.length + 1, icon: '' });
    } else if (nav.mode === 'subcategories') {
      setSubcategoryFormData({ name: '', display_name: '', is_active: true, has_brands: false, has_models: false, sort_order: 0 });
    } else if (nav.mode === 'category_types') {
      setCategoryTypeFormData({ display_name: '', description: '', sort_order: filteredData.length, is_active: true });
    } else if (nav.mode === 'models') {
      setFormData({ name: '', display_name: '', is_active: true });
    } else if (nav.mode === 'brands') {
      setBrandFormData({ name: '', display_name: '', is_active: true });
    }

    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    if (nav.mode === 'categories') {
      setEditingCategory(item);
      setCategoryFormData({ name: item.name, display_name: item.display_name, is_active: item.is_active, sort_order: item.sort_order || 0, icon: item.icon || '' });
    } else if (nav.mode === 'subcategories') {
      setEditingSubcategory(item);
      setSubcategoryFormData({ name: item.name, display_name: item.display_name, is_active: item.is_active, has_brands: item.has_brands || false, has_models: item.has_models || false, sort_order: item.sort_order || 0 });
    } else if (nav.mode === 'category_types') {
      setEditingCategoryType(item);
      setCategoryTypeFormData({ display_name: item.display_name, description: item.description || '', sort_order: item.sort_order || 0, is_active: item.is_active });
    } else if (nav.mode === 'models') {
      setEditingModel(item);
      setFormData({ name: item.name, display_name: item.display_name, is_active: item.is_active });
    } else if (nav.mode === 'brands') {
      setEditingBrand(item);
      setBrandFormData({ name: item.name, display_name: item.display_name, is_active: item.is_active });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingModel(null);
    setEditingBrand(null);
    setEditingSubcategory(null);
    setEditingCategory(null);
    setEditingCategoryType(null);
    setFormData({ name: '', display_name: '', is_active: true });
    setBrandFormData({ name: '', display_name: '', is_active: true });
    setCategoryTypeFormData({ display_name: '', description: '', sort_order: 0, is_active: true });
    setSubcategoryFormData({
      name: '',
      display_name: '',
      is_active: true,
      has_brands: false,
      has_models: false,
      sort_order: 0,
    });
    setCategoryFormData({
      name: '',
      display_name: '',
      is_active: true,
      sort_order: 0,
      icon: '',
    });
  };

  // Handler para subir icono de categoría
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }

    // Validar tamaño (máx 500KB para iconos)
    if (file.size > 500 * 1024) {
      alert('El icono debe pesar menos de 500KB');
      return;
    }

    try {
      setUploadingIcon(true);
      const result = await uploadService.uploadImage(file, 'category-icons');
      setCategoryFormData({ ...categoryFormData, icon: result.url });
    } catch (err: any) {
      console.error('Error subiendo icono:', err);
      alert('Error subiendo icono: ' + (err.message || 'Error desconocido'));
    } finally {
      setUploadingIcon(false);
    }
  };

  const formStates = {
    categoryFormData,
    subcategoryFormData,
    categoryTypeFormData,
    formData,
    brandFormData,
    editingCategory,
    editingSubcategory,
    editingCategoryType,
    editingModel,
    editingBrand,
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>

          <div className="flex gap-3">
            {(nav.mode === 'models' || nav.mode === 'category_types') && (
              <button
                onClick={() => nav.mode === 'category_types' ? setShowBulkImportTypes(true) : setShowBulkImport(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                title="Carga masiva"
              >
                <Save className="w-5 h-5" />
                Carga Masiva
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {nav.mode === 'categories' && 'Nueva Categoría'}
              {nav.mode === 'subcategories' && 'Nueva Subcategoría'}
              {nav.mode === 'category_types' && 'Nuevo Tipo'}
              {nav.mode === 'brands' && 'Nueva Marca'}
              {nav.mode === 'models' && 'Nuevo Modelo'}
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          Administra la estructura jerárquica de categorías, subcategorías, marcas y modelos
        </p>
      </div>

      {/* Navigation breadcrumb */}
      {nav.mode !== 'categories' && (
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          {renderBreadcrumb()}
        </div>
      )}

      <CategoryItemList
        nav={nav}
        loading={loading}
        filteredData={filteredData}
        searchTerm={searchTerm}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onNavigate={(id, name) => {
          if (nav.mode === 'categories') navigateToSubcategories(id, name);
          else if (nav.mode === 'subcategories') navigateToCategoryTypes(id, name);
          else if (nav.mode === 'brands') navigateToModels(id, name);
        }}
        onNavigateToBrands={navigateToBrands}
      />

      <CategoryItemModal
        isOpen={showModal}
        nav={nav}
        editingCategory={editingCategory}
        editingSubcategory={editingSubcategory}
        editingCategoryType={editingCategoryType}
        editingBrand={editingBrand}
        editingModel={editingModel}
        categoryFormData={categoryFormData}
        setCategoryFormData={setCategoryFormData}
        subcategoryFormData={subcategoryFormData}
        setSubcategoryFormData={setSubcategoryFormData}
        categoryTypeFormData={categoryTypeFormData}
        setCategoryTypeFormData={setCategoryTypeFormData}
        formData={formData}
        setFormData={setFormData}
        brandFormData={brandFormData}
        setBrandFormData={setBrandFormData}
        uploadingIcon={uploadingIcon}
        iconInputRef={iconInputRef}
        handleIconUpload={handleIconUpload}
        onSubmit={handleSubmit(formStates, closeModal)}
        onClose={closeModal}
      />

      <CategoryBulkImportModal
        isOpen={showBulkImport}
        entityType="models"
        contextName={nav.brandName || ''}
        bulkText={bulkModelsText}
        onBulkTextChange={setBulkModelsText}
        importing={bulkImporting}
        onImport={async () => {
          setBulkImporting(true);
          await handleBulkImport(bulkModelsText, () => { setShowBulkImport(false); setBulkModelsText(''); });
          setBulkImporting(false);
        }}
        onClose={() => { setShowBulkImport(false); setBulkModelsText(''); }}
      />

      <CategoryBulkImportModal
        isOpen={showBulkImportTypes}
        entityType="types"
        contextName={nav.subcategoryName || ''}
        bulkText={bulkTypesText}
        onBulkTextChange={setBulkTypesText}
        importing={bulkImportingTypes}
        onImport={async () => {
          setBulkImportingTypes(true);
          await handleBulkImportTypes(bulkTypesText, () => { setShowBulkImportTypes(false); setBulkTypesText(''); });
          setBulkImportingTypes(false);
        }}
        onClose={() => { setShowBulkImportTypes(false); setBulkTypesText(''); }}
      />
    </div>
  );
};
