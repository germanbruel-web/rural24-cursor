import React from 'react';
import { ChevronRight, Edit, Trash2, CheckCircle, XCircle, Box, Tag, Wrench, List } from 'lucide-react';
import type { NavigationState } from './CategoriesAdminV2.types';

interface CategoryItemListProps {
  nav: NavigationState;
  loading: boolean;
  filteredData: any[];
  searchTerm: string;
  onEdit: (item: any) => void;
  onDelete: (itemId: string) => void;
  onNavigate: (itemId: string, itemName: string) => void;
  onNavigateToBrands: (itemId: string, itemName: string) => void;
}

export const CategoryItemList: React.FC<CategoryItemListProps> = ({
  nav,
  loading,
  filteredData,
  searchTerm,
  onEdit,
  onDelete,
  onNavigate,
  onNavigateToBrands,
}) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Cargando...</p>
      </div>
    );
  }

  if (nav.mode === 'models') {
    return (
      <>
        {/* VISTA TABLA PARA MODELOS */}
        <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Modelo</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Orden</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-brand-600" />
                        <div>
                          <p className="font-medium text-gray-900">{item.display_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        item.is_active
                          ? 'bg-brand-100 text-brand-600'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {item.sort_order || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar modelo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar modelo"
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
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {searchTerm ? 'No se encontraron resultados' : 'No hay elementos'}
            </p>
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando elementos'}
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* VISTA COMPACTA TIPO EXCEL */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header de tabla */}
        <div className="grid grid-cols-12 gap-4 bg-gray-50 border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
          <div className="col-span-1 flex items-center">
            {nav.mode === 'categories' && <Box className="w-4 h-4 text-gray-500" />}
            {nav.mode === 'subcategories' && <Tag className="w-4 h-4 text-gray-500" />}
            {nav.mode === 'category_types' && <List className="w-4 h-4 text-gray-500" />}
            {nav.mode === 'brands' && <Tag className="w-4 h-4 text-gray-500" />}
          </div>
          <div className="col-span-5">Nombre</div>
          <div className="col-span-2 text-center">Orden</div>
          <div className="col-span-2 text-center">Estado</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {/* Filas de datos */}
        <div className="divide-y divide-gray-100">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group items-center"
              onClick={() => {
                if (nav.mode === 'categories') {
                  onNavigate(item.id, item.display_name);
                } else if (nav.mode === 'subcategories') {
                  onNavigate(item.id, item.display_name);
                } else if (nav.mode === 'category_types') {
                  // leaf node — no further navigation
                } else if (nav.mode === 'brands') {
                  onNavigate(item.id, item.display_name);
                }
              }}
            >
              {/* Icono */}
              <div className="col-span-1 flex items-center">
                <div className="w-8 h-8 bg-brand-600/10 rounded flex items-center justify-center">
                  {nav.mode === 'categories' && <Box className="w-4 h-4 text-brand-600" />}
                  {nav.mode === 'subcategories' && <Tag className="w-4 h-4 text-brand-600" />}
                  {nav.mode === 'category_types' && <List className="w-4 h-4 text-brand-600" />}
                  {nav.mode === 'brands' && <Tag className="w-4 h-4 text-brand-600" />}
                </div>
              </div>

              {/* Nombre */}
              <div className="col-span-5">
                <div className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                  {item.display_name}
                </div>
              </div>

              {/* Orden */}
              <div className="col-span-2 text-center">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {item.sort_order || '—'}
                </span>
              </div>

              {/* Estado */}
              <div className="col-span-2 text-center">
                {item.is_active ? (
                  <span className="px-2 py-1 bg-brand-100 text-brand-600 text-xs font-medium rounded">
                    ✓ Activo
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                    ✕ Inactivo
                  </span>
                )}
              </div>

              {/* Acciones */}
              <div className="col-span-2 flex justify-end gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {nav.mode === 'subcategories' && item.has_brands && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNavigateToBrands(item.id, item.display_name); }}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors text-xs font-medium"
                    title="Ver marcas"
                  >
                    Marcas
                  </button>
                )}
                {nav.mode !== 'category_types' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(item.id, item.display_name);
                    }}
                    className="p-2 text-brand-600 hover:bg-brand-600/10 rounded transition-colors"
                    title="Ver contenido"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            {searchTerm ? 'No se encontraron resultados' : 'No hay elementos'}
          </p>
          <p className="text-gray-500 text-sm">
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando elementos'}
          </p>
        </div>
      )}
    </>
  );
};
