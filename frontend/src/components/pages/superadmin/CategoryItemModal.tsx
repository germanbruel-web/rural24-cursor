import React from 'react';
import { X, Save, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import type {
  NavigationState,
  CategoryFormData,
  SubcategoryFormData,
  CategoryTypeFormData,
  ModelFormData,
  BrandFormData,
} from './CategoriesAdminV2.types';

interface CategoryItemModalProps {
  isOpen: boolean;
  nav: NavigationState;
  editingCategory: any | null;
  editingSubcategory: any | null;
  editingCategoryType: any | null;
  editingBrand: any | null;
  editingModel: any | null;
  categoryFormData: CategoryFormData;
  setCategoryFormData: (d: CategoryFormData) => void;
  subcategoryFormData: SubcategoryFormData;
  setSubcategoryFormData: (d: SubcategoryFormData) => void;
  categoryTypeFormData: CategoryTypeFormData;
  setCategoryTypeFormData: (d: CategoryTypeFormData) => void;
  formData: ModelFormData;
  setFormData: (d: ModelFormData) => void;
  brandFormData: BrandFormData;
  setBrandFormData: (d: BrandFormData) => void;
  uploadingIcon: boolean;
  iconInputRef: React.RefObject<HTMLInputElement>;
  handleIconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const CategoryItemModal: React.FC<CategoryItemModalProps> = ({
  isOpen,
  nav,
  editingCategory,
  editingSubcategory,
  editingCategoryType,
  editingBrand,
  editingModel,
  categoryFormData,
  setCategoryFormData,
  subcategoryFormData,
  setSubcategoryFormData,
  categoryTypeFormData,
  setCategoryTypeFormData,
  formData,
  setFormData,
  brandFormData,
  setBrandFormData,
  uploadingIcon,
  iconInputRef,
  handleIconUpload,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {nav.mode === 'categories'
              ? (editingCategory ? 'Editar Categoría' : 'Nueva Categoría')
              : nav.mode === 'subcategories'
                ? (editingSubcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría')
                : nav.mode === 'category_types'
                  ? (editingCategoryType ? 'Editar Tipo' : 'Nuevo Tipo')
                  : nav.mode === 'models'
                    ? (editingModel ? 'Editar Modelo' : 'Nuevo Modelo')
                    : (editingBrand ? 'Editar Marca' : 'Nueva Marca')
            }
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre visible *
            </label>
            <input
              type="text"
              value={
                nav.mode === 'categories' ? categoryFormData.display_name :
                nav.mode === 'subcategories' ? subcategoryFormData.display_name :
                nav.mode === 'category_types' ? categoryTypeFormData.display_name :
                nav.mode === 'models' ? formData.display_name :
                brandFormData.display_name
              }
              onChange={(e) => {
                if (nav.mode === 'categories') {
                  setCategoryFormData({ ...categoryFormData, display_name: e.target.value });
                } else if (nav.mode === 'subcategories') {
                  setSubcategoryFormData({ ...subcategoryFormData, display_name: e.target.value });
                } else if (nav.mode === 'category_types') {
                  setCategoryTypeFormData({ ...categoryTypeFormData, display_name: e.target.value });
                } else if (nav.mode === 'models') {
                  setFormData({ ...formData, display_name: e.target.value });
                } else {
                  setBrandFormData({ ...brandFormData, display_name: e.target.value });
                }
              }}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
              placeholder={
                nav.mode === 'categories' ? "ej: Ganadería" :
                nav.mode === 'subcategories' ? "ej: Hacienda" :
                nav.mode === 'category_types' ? "ej: Toros" :
                nav.mode === 'models' ? "ej: TX Mega II" :
                "ej: John Deere"
              }
              required
            />
            <p className="text-xs text-gray-500 mt-1">Tal como se mostrará en la interfaz</p>
          </div>

          {/* Campos específicos para Categorías */}
          {nav.mode === 'categories' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden de visualización
              </label>
              <input
                type="number"
                value={categoryFormData.sort_order}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
                placeholder="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Número menor aparece primero</p>
            </div>
          )}

          {/* Icono de Categoría - Upload PNG */}
          {nav.mode === 'categories' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icono de categoría
              </label>
              <div className="flex items-center gap-4">
                {/* Preview del icono */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                  {categoryFormData.icon ? (
                    <img
                      src={categoryFormData.icon.startsWith('http')
                        ? categoryFormData.icon
                        : `/images/icons/${categoryFormData.icon}`
                      }
                      alt="Icono"
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Botón upload */}
                <div className="flex-1">
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/webp"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={uploadingIcon}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploadingIcon ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {categoryFormData.icon ? 'Cambiar icono' : 'Subir icono'}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">PNG, SVG o WebP. Máx 500KB. Recomendado: 48x48px</p>
                </div>

                {/* Botón eliminar */}
                {categoryFormData.icon && (
                  <button
                    type="button"
                    onClick={() => setCategoryFormData({ ...categoryFormData, icon: '' })}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar icono"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Campos específicos para Subcategorías */}
          {nav.mode === 'subcategories' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  value={subcategoryFormData.sort_order}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Número menor aparece primero</p>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="has_brands"
                    checked={subcategoryFormData.has_brands}
                    onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, has_brands: e.target.checked })}
                    className="w-5 h-5 text-brand-600 rounded focus:ring-brand-600"
                  />
                  <label htmlFor="has_brands" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Permite seleccionar marcas
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="has_models"
                    checked={subcategoryFormData.has_models}
                    onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, has_models: e.target.checked })}
                    className="w-5 h-5 text-brand-600 rounded focus:ring-brand-600"
                  />
                  <label htmlFor="has_models" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Permite seleccionar modelos
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Campos específicos para Tipos de Categoría */}
          {nav.mode === 'category_types' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={categoryTypeFormData.description}
                  onChange={(e) => setCategoryTypeFormData({ ...categoryTypeFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
                  placeholder="ej: Bovinos machos para reproducción"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  value={categoryTypeFormData.sort_order}
                  onChange={(e) => setCategoryTypeFormData({ ...categoryTypeFormData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Número menor aparece primero</p>
              </div>
            </>
          )}

          {/* Is Active */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="is_active"
              checked={
                nav.mode === 'subcategories' ? subcategoryFormData.is_active :
                nav.mode === 'category_types' ? categoryTypeFormData.is_active :
                nav.mode === 'models' ? formData.is_active :
                brandFormData.is_active
              }
              onChange={(e) => {
                if (nav.mode === 'subcategories') {
                  setSubcategoryFormData({ ...subcategoryFormData, is_active: e.target.checked });
                } else if (nav.mode === 'category_types') {
                  setCategoryTypeFormData({ ...categoryTypeFormData, is_active: e.target.checked });
                } else if (nav.mode === 'models') {
                  setFormData({ ...formData, is_active: e.target.checked });
                } else {
                  setBrandFormData({ ...brandFormData, is_active: e.target.checked });
                }
              }}
              className="w-5 h-5 text-brand-600 rounded focus:ring-brand-600"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
              {nav.mode === 'subcategories' ? 'Subcategoría activa' :
               nav.mode === 'category_types' ? 'Tipo activo' :
               nav.mode === 'models' ? 'Modelo activo' :
               'Marca activa'}
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {nav.mode === 'subcategories'
                ? (editingSubcategory ? 'Guardar cambios' : 'Crear subcategoría')
                : nav.mode === 'models'
                  ? (editingModel ? 'Guardar cambios' : 'Crear modelo')
                  : (editingBrand ? 'Guardar cambios' : 'Crear marca')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
