// ====================================================================
// IMPORT TEMPLATE MODAL
// Modal para seleccionar y aplicar templates de atributos
// ====================================================================

import React, { useState, useEffect } from 'react';
import { X, Search, Check, Package, AlertCircle, Loader2 } from 'lucide-react';
import { getTemplates, applyTemplateToSubcategory, type AttributeTemplate } from '../../services/v2/templatesService';

interface ImportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCategoryId: string;
  targetSubcategoryId: string;
  onSuccess: (count: number) => void;
}

export function ImportTemplateModal({
  isOpen,
  onClose,
  targetCategoryId,
  targetSubcategoryId,
  onSuccess,
}: ImportTemplateModalProps) {
  const [templates, setTemplates] = useState<AttributeTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AttributeTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar templates al abrir modal
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setSearchQuery('');
      setSelectedTemplateId('');
      setError(null);
    }
  }, [isOpen]);

  // Filtrar templates por búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTemplates(
        templates.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query) ||
            t.category_name?.toLowerCase().includes(query) ||
            t.subcategory_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, templates]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const data = await getTemplates({ isActive: true });
      setTemplates(data);
      setFilteredTemplates(data);
    } catch (err: any) {
      setError('Error cargando templates: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyTemplate() {
    if (!selectedTemplateId) {
      setError('Seleccioná un template primero');
      return;
    }

    try {
      setApplying(true);
      setError(null);

      const count = await applyTemplateToSubcategory(
        selectedTemplateId,
        targetCategoryId,
        targetSubcategoryId
      );

      onSuccess(count);
      onClose();
    } catch (err: any) {
      setError('Error aplicando template: ' + err.message);
    } finally {
      setApplying(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importar Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              Seleccioná un template para copiar sus atributos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, categoría o descripción..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
            />
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="ml-3 text-gray-600">Cargando templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchQuery ? 'No se encontraron templates' : 'No hay templates disponibles'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Creá tu primer template desde una subcategoría existente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-brand-400 bg-brand-50 shadow-md'
                        : 'border-gray-200 hover:border-green-400 hover:bg-brand-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {template.name}
                          </h3>
                          {isSelected && (
                            <div className="w-6 h-6 bg-brand-400 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {template.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-gray-500">
                            <strong>Categoría:</strong> {template.category_name}
                          </span>
                          {template.subcategory_name && (
                            <span className="text-xs text-gray-500">
                              <strong>Subcategoría:</strong> {template.subcategory_name}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {template.field_count} campo{template.field_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-gray-200">
          <button
            onClick={onClose}
            disabled={applying}
            className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplateId || applying}
            className="px-6 py-3 rounded-xl bg-brand-400 text-white font-semibold hover:bg-brand-500 transition-all shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {applying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Importar Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
