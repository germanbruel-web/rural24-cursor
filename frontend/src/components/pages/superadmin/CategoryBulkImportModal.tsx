import React from 'react';
import { X, Save } from 'lucide-react';

interface CategoryBulkImportModalProps {
  isOpen: boolean;
  entityType: 'models' | 'types';
  contextName: string;
  bulkText: string;
  onBulkTextChange: (text: string) => void;
  importing: boolean;
  onImport: () => void;
  onClose: () => void;
}

export const CategoryBulkImportModal: React.FC<CategoryBulkImportModalProps> = ({
  isOpen,
  entityType,
  contextName,
  bulkText,
  onBulkTextChange,
  importing,
  onImport,
  onClose,
}) => {
  if (!isOpen) return null;

  if (entityType === 'models') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Carga Masiva de Modelos</h2>
              <p className="text-sm text-gray-600 mt-1">
                Para: <span className="font-semibold text-brand-600">{contextName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={importing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Instrucciones:</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Pega la lista de modelos en el campo de texto</li>
                <li>Cada modelo debe estar en una línea separada</li>
                <li>Se creará automáticamente el nombre interno (ID) a partir del nombre visible</li>
                <li>Los modelos duplicados serán ignorados</li>
              </ul>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lista de Modelos (uno por línea)
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => onBulkTextChange(e.target.value)}
                placeholder="TX Mega II&#10;Agrotanque 3000&#10;Serie 4000&#10;Modelo X Plus&#10;..."
                className="w-full h-64 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors font-mono text-sm"
                disabled={importing}
              />
              <p className="text-xs text-gray-500 mt-2">
                {bulkText.split('\n').filter(line => line.trim()).length} modelo(s) detectado(s)
              </p>
            </div>

            {/* Example */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Ejemplo:</p>
              <pre className="text-xs text-gray-600 font-mono">
TX Mega II{'\n'}Agrotanque 3000{'\n'}Serie 4000{'\n'}Modelo X Plus
              </pre>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={importing}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onImport}
                disabled={importing || !bulkText.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Importar Modelos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // entityType === 'types'
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Carga Masiva de Tipos</h2>
            <p className="text-sm text-gray-500 mt-1">
              {contextName} — uno por línea
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            value={bulkText}
            onChange={(e) => onBulkTextChange(e.target.value)}
            placeholder={"Toros\nVacas\nNovillos\nVaquillonas\nTerneros"}
            className="w-full h-56 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
            disabled={importing}
          />
          <p className="text-xs text-gray-500">
            {bulkText.split('\n').filter(l => l.trim()).length} tipo(s) detectado(s)
          </p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              disabled={importing}>
              Cancelar
            </button>
            <button type="button" onClick={onImport}
              disabled={importing || !bulkText.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
              {importing ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Importando...</>
              ) : (
                <><Save className="w-4 h-4" />Importar Tipos</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
