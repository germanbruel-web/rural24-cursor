import React from 'react';
import {
  ChevronRight,
  ChevronDown,
  Loader2,
  Globe,
  Layers,
  FileText,
} from 'lucide-react';
import type { CatNode, SubNode, ModoSeleccion } from '../types';
import { CATEGORY_ICON_MAP } from '../constants';

interface CategoryTreeProps {
  categorias: CatNode[];
  subcategorias: SubNode[];
  cargandoCats: boolean;
  cargandoSubs: boolean;
  catSeleccionada: CatNode | null;
  expandidosL2: Set<string>;
  hojaSeleccionada: SubNode | null;
  modo: ModoSeleccion;
  l2: SubNode[];
  hijosDeL2: (parentId: string) => SubNode[];
  tieneHijos: (id: string) => boolean;
  onSeleccionarCategoria: (cat: CatNode) => void;
  onSeleccionarGlobal: () => void;
  onSeleccionarHoja: (sub: SubNode) => void;
  onAlternarL2: (id: string) => void;
}

export function CategoryTree({
  categorias,
  cargandoCats,
  cargandoSubs,
  catSeleccionada,
  expandidosL2,
  hojaSeleccionada,
  modo,
  l2,
  hijosDeL2,
  tieneHijos,
  onSeleccionarCategoria,
  onSeleccionarGlobal,
  onSeleccionarHoja,
  onAlternarL2,
}: CategoryTreeProps) {
  return (
    <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Categorías y formularios</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Cada categoría tiene un formulario global + variantes por subcategoría
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {cargandoCats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
          </div>
        ) : (
          categorias.map((cat) => {
            const esCatActiva = catSeleccionada?.id === cat.id;
            return (
              <div key={cat.id}>
                <button
                  onClick={() => onSeleccionarCategoria(cat)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors ${
                    esCatActiva ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cat.icon && (
                    cat.icon.startsWith('http')
                      ? <img src={cat.icon.split('|')[0]} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                      : CATEGORY_ICON_MAP[cat.icon]
                        ? <span className="text-base leading-none">{CATEGORY_ICON_MAP[cat.icon]}</span>
                        : null
                  )}
                  <span className="flex-1 truncate">{cat.display_name}</span>
                  {esCatActiva && cargandoSubs
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                    : <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${esCatActiva ? 'rotate-90' : ''}`} />
                  }
                </button>

                {esCatActiva && !cargandoSubs && (
                  <div className="ml-2 border-l border-gray-100 pl-1">
                    <button
                      onClick={onSeleccionarGlobal}
                      className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs transition-colors rounded ${
                        modo === 'global'
                          ? 'bg-brand-100 text-brand-700 font-semibold'
                          : 'text-brand-600 hover:bg-brand-50'
                      }`}
                    >
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      <span>Formulario global</span>
                    </button>

                    {l2.length > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1">
                        <Layers className="w-3 h-3 text-gray-300" />
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Variantes</span>
                      </div>
                    )}

                    {l2.map((sub2) => {
                      const hijos = hijosDeL2(sub2.id);
                      const expandido = expandidosL2.has(sub2.id);
                      const esHoja = !tieneHijos(sub2.id);
                      const seleccionado = hojaSeleccionada?.id === sub2.id && modo === 'variante';

                      return (
                        <div key={sub2.id}>
                          <button
                            onClick={() => {
                              if (esHoja) onSeleccionarHoja(sub2);
                              else onAlternarL2(sub2.id);
                            }}
                            className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs transition-colors rounded ${
                              seleccionado
                                ? 'bg-brand-100 text-brand-700 font-semibold'
                                : esHoja
                                  ? 'text-gray-600 hover:bg-gray-50'
                                  : 'text-gray-700 hover:bg-gray-50'
                            } ${!sub2.is_active ? 'opacity-40' : ''}`}
                          >
                            {!esHoja
                              ? expandido
                                ? <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
                                : <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-400" />
                              : <FileText className="w-3 h-3 flex-shrink-0 text-gray-300" />
                            }
                            <span className="flex-1 truncate">{sub2.display_name}</span>
                            {!sub2.is_active && <span className="text-gray-400">·</span>}
                          </button>

                          {!esHoja && expandido && (
                            <div className="ml-4">
                              <button
                                onClick={() => onSeleccionarHoja(sub2)}
                                className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs transition-colors rounded ${
                                  hojaSeleccionada?.id === sub2.id && modo === 'variante'
                                    ? 'bg-brand-100 text-brand-700 font-semibold'
                                    : 'text-brand-600 hover:bg-brand-50'
                                }`}
                              >
                                <Globe className="w-3 h-3 flex-shrink-0" />
                                <span className="flex-1 truncate italic">Formulario de {sub2.display_name}</span>
                              </button>

                              {hijos.map((sub3) => {
                                const sel3 = hojaSeleccionada?.id === sub3.id && modo === 'variante';
                                return (
                                  <button
                                    key={sub3.id}
                                    onClick={() => onSeleccionarHoja(sub3)}
                                    className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs transition-colors rounded ${
                                      sel3
                                        ? 'bg-brand-100 text-brand-700 font-semibold'
                                        : 'text-gray-500 hover:bg-gray-50'
                                    } ${!sub3.is_active ? 'opacity-40' : ''}`}
                                  >
                                    <FileText className="w-3 h-3 flex-shrink-0 text-gray-300" />
                                    <span className="flex-1 truncate">{sub3.display_name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {l2.length === 0 && (
                      <p className="px-4 py-2 text-xs text-gray-400 italic">Sin subcategorías</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
