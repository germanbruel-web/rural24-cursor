// ====================================================================
// TEMPLATES ADMIN - Vista simple tipo Excel de plantillas
// ====================================================================
// Lista las plantillas por categoría, editar con textarea simple.
// ====================================================================

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RotateCcw, 
  Download, 
  Upload,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';
import { 
  getTemplates, 
  saveTemplates, 
  resetTemplates,
  exportTemplates,
  importTemplates,
  type CategoryTemplates,
} from '../../utils/contentTemplates';
import { notify } from '../../utils/notifications';

export function TemplatesAdmin() {
  const [templates, setTemplates] = useState<CategoryTemplates[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  const handleSave = () => {
    saveTemplates(templates);
    setIsDirty(false);
    notify.success('Plantillas guardadas');
  };

  const handleReset = () => {
    if (window.confirm('¿Resetear todas las plantillas a los valores originales?')) {
      resetTemplates();
      setTemplates(getTemplates());
      setIsDirty(false);
      notify.success('Plantillas reseteadas');
    }
  };

  const handleExport = () => {
    const json = exportTemplates();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantillas-rural24.json';
    a.click();
    URL.revokeObjectURL(url);
    notify.success('Exportado');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        if (importTemplates(text)) {
          setTemplates(getTemplates());
          notify.success('Importado');
        } else {
          notify.error('Archivo inválido');
        }
      }
    };
    input.click();
  };

  const handleTemplateChange = (categorySlug: string, index: number, value: string) => {
    setTemplates(prev => prev.map(cat => {
      if (cat.categorySlug === categorySlug) {
        const newTemplates = [...cat.templates];
        newTemplates[index] = value;
        return { ...cat, templates: newTemplates };
      }
      return cat;
    }));
    setIsDirty(true);
  };

  const handleAddTemplate = (categorySlug: string) => {
    setTemplates(prev => prev.map(cat => {
      if (cat.categorySlug === categorySlug) {
        return { 
          ...cat, 
          templates: [...cat.templates, 'Nueva plantilla - editar aquí...'] 
        };
      }
      return cat;
    }));
    setIsDirty(true);
  };

  const handleRemoveTemplate = (categorySlug: string, index: number) => {
    setTemplates(prev => prev.map(cat => {
      if (cat.categorySlug === categorySlug && cat.templates.length > 1) {
        const newTemplates = cat.templates.filter((_, i) => i !== index);
        return { ...cat, templates: newTemplates };
      }
      return cat;
    }));
    setIsDirty(true);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Autocompletado</h1>
          <p className="text-sm text-gray-500 mt-1">
            4-5 variantes por categoría que rotan al hacer click en "Autocompletar"
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-sm text-amber-600 font-medium mr-2">● Sin guardar</span>
          )}
          <button
            onClick={handleExport}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Exportar JSON"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleImport}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Importar JSON"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Resetear a originales"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              ${isDirty 
                ? 'bg-brand-500 text-white hover:bg-brand-600' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewText && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewText(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-900 mb-3">Vista previa</h3>
            <p className="text-gray-700 whitespace-pre-line">{previewText}</p>
            <button 
              onClick={() => setPreviewText(null)}
              className="mt-4 w-full py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de categorías */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {templates.map((category, catIndex) => (
          <div key={category.categorySlug} className={catIndex > 0 ? 'border-t' : ''}>
            {/* Fila de categoría */}
            <div 
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setExpandedCategory(
                expandedCategory === category.categorySlug ? null : category.categorySlug
              )}
            >
              <div className="flex items-center gap-3">
                {expandedCategory === category.categorySlug ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{category.categoryName}</h3>
                  <p className="text-xs text-gray-500">{category.templates.length} plantillas</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono">{category.categorySlug}</span>
            </div>

            {/* Plantillas expandidas */}
            {expandedCategory === category.categorySlug && (
              <div className="bg-gray-50 border-t p-4 space-y-3">
                {category.templates.map((template, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-sm text-gray-400 font-mono w-6 pt-2 text-right">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <textarea
                        value={template}
                        onChange={(e) => handleTemplateChange(category.categorySlug, index, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setPreviewText(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Vista previa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {category.templates.length > 1 && (
                        <button
                          onClick={() => handleRemoveTemplate(category.categorySlug, index)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Botón agregar */}
                <button
                  onClick={() => handleAddTemplate(category.categorySlug)}
                  className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium ml-8"
                >
                  <Plus className="w-4 h-4" />
                  Agregar variante
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Las plantillas rotan automáticamente cada vez que el usuario hace click en "Autocompletar"
      </p>
    </div>
  );
}

export default TemplatesAdmin;
