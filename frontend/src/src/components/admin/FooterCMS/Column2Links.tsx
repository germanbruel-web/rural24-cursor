/**
 * COLUMNA 2: LINKS PERSONALIZADOS
 */

import React from 'react';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import type { FooterLinksColumn, FooterLinkItem } from '../../../types/footer';

interface Props {
  column: FooterLinksColumn;
  onChange: (updated: FooterLinksColumn) => void;
}

export const Column2Links: React.FC<Props> = ({ column, onChange }) => {
  const handleAdd = () => {
    const newLink: FooterLinkItem = {
      id: `link-2-${Date.now()}`,
      label: '',
      url: '#/',
      order: column.items.length + 1,
      openNewTab: false
    };
    onChange({ ...column, items: [...column.items, newLink] });
  };

  const handleRemove = (id: string) => {
    if (column.items.length === 1) {
      alert('Debe haber al menos 1 link');
      return;
    }
    onChange({ ...column, items: column.items.filter(item => item.id !== id) });
  };

  const handleUpdate = (id: string, field: keyof FooterLinkItem, value: any) => {
    const updated = column.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange({ ...column, items: updated });
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
          placeholder="Sobre Nosotros"
        />
      </div>

      {/* Links */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Links ({column.items.length})
          </label>
          <button
            onClick={handleAdd}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>

        <div className="space-y-3">
          {column.items.map((link, index) => (
            <div key={link.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2 mb-2">
                <span className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0 mt-1">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleUpdate(link.id, 'label', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    placeholder="Nombre del link"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => handleUpdate(link.id, 'url', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono text-xs"
                    placeholder="#/about"
                  />
                </div>
                <button
                  onClick={() => handleRemove(link.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {column.items.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay links. Click en "Agregar" para crear uno.
          </div>
        )}
      </div>
    </div>
  );
};
