// ====================================================================
// FORM PREVIEW - Preview en tiempo real del formulario Step 2
// Muestra cómo se verán los atributos en el formulario de publicación
// ====================================================================

import React, { useState, useEffect } from 'react';
import { Eye, Smartphone, Monitor, ChevronRight, Lock, CheckCircle } from 'lucide-react';
import { DynamicField } from '../DynamicField';
import type { DynamicAttribute } from '../../services/catalogService';

interface FormPreviewProps {
  attributes: any[]; // DynamicAttributeDB[]
  categoryName?: string;
  subcategoryName?: string;
}

export function FormPreview({ attributes, categoryName, subcategoryName }: FormPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [expandedGroup, setExpandedGroup] = useState<string>('');
  const [demoValues, setDemoValues] = useState<Record<string, any>>({});

  // Convertir atributos de BD a formato DynamicAttribute
  const convertedAttributes: DynamicAttribute[] = attributes.map(attr => ({
    id: attr.id,
    slug: attr.field_name,
    name: attr.field_label,
    description: attr.help_text || undefined,
    inputType: attr.field_type,
    dataType: attr.field_type,
    isRequired: attr.is_required,
    displayOrder: attr.sort_order,
    fieldGroup: attr.field_group || 'general',
    uiConfig: {
      placeholder: attr.placeholder || '',
      prefix: attr.prefix || '',
      suffix: attr.suffix || '',
    },
    validations: {
      min: attr.min_value || undefined,
      max: attr.max_value || undefined,
    },
    isFilterable: false,
    isFeatured: false,
    options: (attr.field_options || []).map((opt: string) => ({
      value: opt,
      label: opt,
    })),
  }));

  // Obtener orden de grupos dinámicamente
  const getGroupsOrder = (attrs: DynamicAttribute[]): string[] => {
    const groupsMap = attrs.reduce((acc, attr) => {
      const group = attr.fieldGroup || 'general';
      if (!acc[group] || attr.displayOrder < acc[group]) {
        acc[group] = attr.displayOrder;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(groupsMap).sort((a, b) => groupsMap[a] - groupsMap[b]);
  };

  // Validar si un grupo está completo
  const isGroupComplete = (group: string, groupFields: DynamicAttribute[]): boolean => {
    const requiredFields = groupFields.filter(f => f.isRequired);
    if (requiredFields.length === 0) return true;
    
    return requiredFields.every(field => {
      const value = demoValues[field.slug];
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
  };

  // Verificar si un grupo está desbloqueado
  const isGroupUnlocked = (group: string, attrs: DynamicAttribute[]): boolean => {
    const groupsOrder = getGroupsOrder(attrs);
    const groupIndex = groupsOrder.indexOf(group);
    
    if (groupIndex === 0) return true;
    
    for (let i = 0; i < groupIndex; i++) {
      const prevGroup = groupsOrder[i];
      const prevGroupFields = attrs.filter(a => (a.fieldGroup || 'general') === prevGroup);
      if (!isGroupComplete(prevGroup, prevGroupFields)) {
        return false;
      }
    }
    
    return true;
  };

  // Abrir primer grupo automáticamente
  useEffect(() => {
    if (convertedAttributes.length > 0 && !expandedGroup) {
      const groupsOrder = getGroupsOrder(convertedAttributes);
      if (groupsOrder.length > 0) {
        setExpandedGroup(groupsOrder[0]);
      }
    }
  }, [convertedAttributes.length]);

  const getGroupTitle = (groupKey: string): string => {
    const titles: Record<string, string> = {
      general: 'Información General',
      motor: 'Motor',
      transmision: 'Transmisión',
      dimensiones: 'Dimensiones',
      hidraulica: 'Sistema Hidráulico',
      cabina: 'Cabina y Confort',
      neumaticos: 'Neumáticos',
      toma_fuerza: 'Toma de Fuerza',
      capacidades: 'Capacidades',
      implementos: 'Implementos',
      otros: 'Otros',
    };
    return titles[groupKey] || groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
  };

  if (attributes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Sin atributos para previsualizar</p>
          <p className="text-sm text-gray-400 mt-2">
            Agregá campos para ver cómo quedarán en el formulario
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Preview en Tiempo Real</h3>
          </div>
          
          {/* Toggle Desktop/Mobile */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                previewMode === 'desktop'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                previewMode === 'mobile'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {categoryName && subcategoryName && (
          <p className="text-sm text-gray-600">
            <strong>{categoryName}</strong> → <strong>{subcategoryName}</strong>
          </p>
        )}
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className={`mx-auto ${previewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
          <div className="bg-gray-100 rounded-2xl shadow-xl border-2 border-gray-300 overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Título */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Características técnicas
                </h2>
                <p className="text-sm text-gray-600">
                  Completá los detalles específicos de tu producto
                </p>
              </div>

              {/* Grupos de atributos */}
              <div className="space-y-4">
                {(() => {
                  const grouped = convertedAttributes.reduce((acc, attr) => {
                    const group = attr.fieldGroup || 'general';
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(attr);
                    return acc;
                  }, {} as Record<string, DynamicAttribute[]>);
                  
                  const groupsOrder = getGroupsOrder(convertedAttributes);
                  
                  return groupsOrder.map((group) => {
                    const fields = grouped[group];
                    const isExpanded = expandedGroup === group;
                    const isUnlocked = isGroupUnlocked(group, convertedAttributes);
                    const isComplete = isGroupComplete(group, fields);
                    const requiredCount = fields.filter(f => f.isRequired).length;
                    
                    return (
                      <div 
                        key={group} 
                        className={`border-2 rounded-xl overflow-hidden transition-all ${
                          isUnlocked 
                            ? isComplete 
                              ? 'border-green-300 bg-green-50/30' 
                              : 'border-gray-200'
                            : 'border-gray-300 bg-gray-50 opacity-60'
                        }`}
                      >
                        <button
                          onClick={() => {
                            if (!isUnlocked) return;
                            setExpandedGroup(isExpanded ? '' : group);
                          }}
                          disabled={!isUnlocked}
                          className={`w-full p-4 transition-all text-left ${
                            !isUnlocked
                              ? 'cursor-not-allowed'
                              : isExpanded
                              ? 'bg-green-50 border-b-2 border-green-200'
                              : 'bg-white hover:bg-green-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {isComplete ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                              ) : !isUnlocked ? (
                                <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                              )}
                              
                              <div className="flex-1">
                                <p className={`text-base font-bold ${
                                  isUnlocked ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                  {getGroupTitle(group)}
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {requiredCount > 0 
                                    ? `${requiredCount} campo${requiredCount !== 1 ? 's' : ''} requerido${requiredCount !== 1 ? 's' : ''}`
                                    : `${fields.length} campo${fields.length !== 1 ? 's' : ''} opcional${fields.length !== 1 ? 'es' : ''}`
                                  }
                                </p>
                              </div>
                            </div>
                            
                            <ChevronRight
                              className={`w-5 h-5 flex-shrink-0 ml-2 transition-transform ${
                                isUnlocked ? 'text-green-600' : 'text-gray-400'
                              } ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </div>
                        </button>

                        {isExpanded && isUnlocked && (
                          <div className="p-4 bg-white space-y-3">
                            {fields.map((attr) => (
                              <DynamicField
                                key={attr.slug}
                                attribute={attr}
                                value={demoValues[attr.slug]}
                                onChange={(value) => {
                                  setDemoValues(prev => ({
                                    ...prev,
                                    [attr.slug]: value,
                                  }));
                                }}
                                error={undefined}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t-2 border-gray-200 bg-blue-50">
        <p className="text-xs text-gray-600 text-center">
          <strong>💡 Preview interactivo:</strong> Probá completando campos para ver la validación secuencial
        </p>
      </div>
    </div>
  );
}
