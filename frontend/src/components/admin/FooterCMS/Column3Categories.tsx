/**
 * COLUMNA 3: CATEGORÍAS DINÁMICAS
 */

import React, { useState, useEffect } from 'react';
import { Loader, Grid } from 'lucide-react';
import type { FooterCategoriesColumn } from '../../../types/footer';
import { getDynamicCategories } from '../../../services/footerService';
import type { Category } from '../../../types/footer';

interface Props {
  column: FooterCategoriesColumn;
  onChange: (updated: FooterCategoriesColumn) => void;
}

export const Column3Categories: React.FC<Props> = ({ column, onChange }) => {
  const [previewCategories, setPreviewCategories] = useState<Category[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (column.source === 'dynamic') {
      loadPreview();
    }
  }, [column.source, column.limit]);

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const cats = await getDynamicCategories(column.limit);
      setPreviewCategories(cats);
    } catch (error) {
      console.error('Error cargando preview:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título de la Columna
        </label>
        <input
          type="text"
          value={column.title}
          onChange={(e) => onChange({ ...column, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Categorías Principales"
        />
      </div>

      {/* Fuente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fuente de Datos
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="source"
              value="dynamic"
              checked={column.source === 'dynamic'}
              onChange={(e) => onChange({ ...column, source: 'dynamic' as const })}
              className="text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Categorías desde BD (dinámico)</div>
              <div className="text-xs text-gray-500">Se actualizan automáticamente</div>
            </div>
          </label>
          
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors opacity-50">
            <input
              type="radio"
              name="source"
              value="manual"
              checked={column.source === 'manual'}
              onChange={(e) => onChange({ ...column, source: 'manual' as const })}
              disabled
              className="text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Links manuales</div>
              <div className="text-xs text-gray-500">Próximamente</div>
            </div>
          </label>
        </div>
      </div>

      {/* Límite */}
      {column.source === 'dynamic' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad máxima a mostrar
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={column.limit}
            onChange={(e) => onChange({ ...column, limit: parseInt(e.target.value) || 6 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Entre 1 y 20 categorías</p>
        </div>
      )}

      {/* Preview */}
      {column.source === 'dynamic' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Preview
          </label>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="w-4 h-4 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Cargando...</span>
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {previewCategories.map(cat => (
                  <li key={cat.id} className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full"></div>
                    <span className="font-medium">{cat.display_name || cat.name}</span>
                    <span className="text-xs text-gray-400">→ #{cat.slug}</span>
                  </li>
                ))}
                
                {previewCategories.length === 0 && (
                  <li className="text-gray-400 italic">No hay categorías disponibles</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
