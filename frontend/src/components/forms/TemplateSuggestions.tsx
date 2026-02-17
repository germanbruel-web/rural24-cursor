// ====================================================================
// TEMPLATE SUGGESTIONS - Dropdown compacto para sugerencias de contenido
// Usa plantillas configuradas en el admin
// ====================================================================

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, FileText, Type, AlignLeft, Sparkles, Check } from 'lucide-react';
import {
  getTemplatesForContext,
  interpolateTemplate,
  type ContentTemplate,
} from '../../services/v2/contentTemplatesService';

interface TemplateSuggestionsProps {
  // Contexto para buscar plantillas
  categoryId?: string;
  subcategoryId?: string;
  typeId?: string;
  
  // Valores para interpolación
  categoria?: string;
  subcategoria?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  año?: string;
  condicion?: string;
  provincia?: string;
  localidad?: string;
  precio?: string;
  atributos?: Record<string, string>;
  
  // Callbacks
  onSelectTitle: (title: string) => void;
  onSelectDescription: (description: string) => void;
  
  // Estado actual
  currentTitle?: string;
  currentDescription?: string;
}

export function TemplateSuggestions({
  categoryId,
  subcategoryId,
  typeId,
  categoria,
  subcategoria,
  tipo,
  marca,
  modelo,
  año,
  condicion,
  provincia,
  localidad,
  precio,
  atributos,
  onSelectTitle,
  onSelectDescription,
  currentTitle,
  currentDescription,
}: TemplateSuggestionsProps) {
  const [titleTemplates, setTitleTemplates] = useState<ContentTemplate[]>([]);
  const [descTemplates, setDescTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [showDescDropdown, setShowDescDropdown] = useState(false);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [selectedDescId, setSelectedDescId] = useState<string | null>(null);
  
  const titleDropdownRef = useRef<HTMLDivElement>(null);
  const descDropdownRef = useRef<HTMLDivElement>(null);

  // Contexto para interpolación
  const interpolationContext = {
    categoria: categoria || '',
    subcategoria: subcategoria || '',
    tipo: tipo || '',
    marca: marca || '',
    modelo: modelo || '',
    año: año || '',
    condicion: condicion || '',
    provincia: provincia || '',
    localidad: localidad || '',
    precio: precio || '',
    atributos: atributos || {},
  };

  // Cargar plantillas cuando cambia el contexto
  useEffect(() => {
    if (!categoryId) {
      setTitleTemplates([]);
      setDescTemplates([]);
      return;
    }

    const loadTemplates = async () => {
      setLoading(true);
      try {
        const [titles, descriptions] = await Promise.all([
          getTemplatesForContext({
            categoryId,
            subcategoryId,
            typeId,
            templateType: 'title',
          }),
          getTemplatesForContext({
            categoryId,
            subcategoryId,
            typeId,
            templateType: 'description',
          }),
        ]);
        setTitleTemplates(titles);
        setDescTemplates(descriptions);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [categoryId, subcategoryId, typeId]);

  // Cerrar dropdowns al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(event.target as Node)) {
        setShowTitleDropdown(false);
      }
      if (descDropdownRef.current && !descDropdownRef.current.contains(event.target as Node)) {
        setShowDescDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTitle = (template: ContentTemplate) => {
    const interpolated = interpolateTemplate(template.template_text, interpolationContext);
    onSelectTitle(interpolated);
    setSelectedTitleId(template.id);
    setShowTitleDropdown(false);
  };

  const handleSelectDescription = (template: ContentTemplate) => {
    const interpolated = interpolateTemplate(template.template_text, interpolationContext);
    onSelectDescription(interpolated);
    setSelectedDescId(template.id);
    setShowDescDropdown(false);
  };

  // Si no hay plantillas disponibles, no mostrar nada
  if (!categoryId || (titleTemplates.length === 0 && descTemplates.length === 0 && !loading)) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {/* Dropdown de Títulos */}
      {titleTemplates.length > 0 && (
        <div className="relative" ref={titleDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowTitleDropdown(!showTitleDropdown);
              setShowDescDropdown(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
              selectedTitleId
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Sugerir Título</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTitleDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showTitleDropdown && (
            <div className="absolute z-50 mt-2 w-80 bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Plantillas de título ({titleTemplates.length})
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {titleTemplates.map((template) => {
                  const preview = interpolateTemplate(template.template_text, interpolationContext);
                  const isSelected = selectedTitleId === template.id;
                  
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleSelectTitle(template)}
                      className={`w-full text-left p-3 border-b border-gray-100 last:border-0 transition-all ${
                        isSelected
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">{template.name}</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {preview || template.template_text}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dropdown de Descripciones */}
      {descTemplates.length > 0 && (
        <div className="relative" ref={descDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowDescDropdown(!showDescDropdown);
              setShowTitleDropdown(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
              selectedDescId
                ? 'bg-brand-50 border-green-300 text-brand-600'
                : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-brand-50'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
            <span>Sugerir Descripción</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDescDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDescDropdown && (
            <div className="absolute z-50 mt-2 w-96 bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 bg-gradient-to-r from-brand-50 to-brand-100 border-b">
                <p className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Plantillas de descripción ({descTemplates.length})
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {descTemplates.map((template) => {
                  const preview = interpolateTemplate(template.template_text, interpolationContext);
                  const isSelected = selectedDescId === template.id;
                  
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleSelectDescription(template)}
                      className={`w-full text-left p-3 border-b border-gray-100 last:border-0 transition-all ${
                        isSelected
                          ? 'bg-brand-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">{template.name}</p>
                          <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-3">
                            {preview || template.template_text}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-brand-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-600 rounded-full animate-spin" />
          <span>Cargando plantillas...</span>
        </div>
      )}
    </div>
  );
}
