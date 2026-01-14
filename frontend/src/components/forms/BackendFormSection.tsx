import React from 'react';
import { ChevronRight, CheckCircle } from 'lucide-react';
import { BackendDynamicField } from './BackendDynamicField';
import type { DynamicFormField } from '../../services/formConfigService';

interface BackendFormSectionProps {
  fields: DynamicFormField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  title?: string;
  description?: string;
  expandedGroup?: string;
  onGroupToggle?: (groupName: string) => void;
  completedGroups?: Set<string>;
}

/**
 * Normaliza el nombre del grupo para comparaciones
 * "Información General" -> "informacion_general"
 */
const normalizeGroupName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/\s+/g, '_');            // Espacios a guiones bajos
};

/**
 * Orden de grupos definido por el negocio
 * El backend puede enviar cualquier nombre, se normaliza para ordenar
 */
const GROUP_ORDER = [
  'informacion_general',
  'especificaciones_tecnicas', 
  'caracteristicas'
];

/**
 * Verifica si un grupo tiene al menos un campo con valor
 */
const hasGroupValues = (fields: DynamicFormField[], values: Record<string, any>): boolean => {
  return fields.some(field => {
    const value = values[field.field_name];
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
};

/**
 * Sección de formulario que respeta los tipos originales del backend
 * Implementa accordion por grupos SIN bloqueo secuencial (mejor UX)
 */
export const BackendFormSection: React.FC<BackendFormSectionProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  title,
  description,
  expandedGroup = '',
  onGroupToggle,
  completedGroups = new Set()
}) => {
  // Agrupar campos por field_group (usando el nombre original del backend)
  const groupedFields = fields.reduce((groups, field) => {
    const group = field.field_group || 'General';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(field);
    return groups;
  }, {} as Record<string, DynamicFormField[]>);

  // Ordenar campos dentro de cada grupo por sort_order
  Object.keys(groupedFields).forEach(group => {
    groupedFields[group].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  });

  // Ordenar grupos según GROUP_ORDER (usando nombres normalizados para comparar)
  const sortedGroupNames = Object.keys(groupedFields).sort((a, b) => {
    const normalizedA = normalizeGroupName(a);
    const normalizedB = normalizeGroupName(b);
    const indexA = GROUP_ORDER.indexOf(normalizedA);
    const indexB = GROUP_ORDER.indexOf(normalizedB);
    
    // Si ambos están en GROUP_ORDER, ordenar por índice
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // Si solo uno está, priorizarlo
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // Si ninguno está, ordenar alfabéticamente
    return a.localeCompare(b);
  });

  // Si solo hay un grupo, mostrar directamente sin accordion
  if (sortedGroupNames.length <= 1) {
    return (
      <div className="space-y-6">
        {title && (
          <div className="border-b pb-3">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((field) => (
            <div 
              key={field.id}
              className={`
                ${field.field_type === 'textarea' ? 'md:col-span-2' : ''}
                ${field.field_type === 'multiselect' ? 'md:col-span-2' : ''}
              `}
            >
              <BackendDynamicField
                field={field}
                value={values[field.field_name]}
                onChange={onChange}
                error={errors[field.field_name]}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Implementar accordion para múltiples grupos - SIN BLOQUEO (mejor UX)
  return (
    <div className="space-y-3">
      {sortedGroupNames.map((groupName) => {
        const groupFields = groupedFields[groupName];
        const normalizedGroupName = normalizeGroupName(groupName);
        
        // Detectar si el grupo tiene valores (auto-completado)
        const hasValues = hasGroupValues(groupFields, values);
        
        // Comparar con nombre original O normalizado para expandedGroup
        const isExpanded = expandedGroup === groupName || expandedGroup === normalizedGroupName;

        return (
          <div 
            key={groupName} 
            className={`border-2 rounded-xl overflow-hidden transition-colors ${
              isExpanded ? 'border-green-300 shadow-md' : hasValues ? 'border-green-200' : 'border-gray-200'
            }`}
          >
            {/* Header del grupo - SIEMPRE clickeable */}
            <button
              type="button"
              onClick={() => {
                if (onGroupToggle) {
                  onGroupToggle(isExpanded ? '' : normalizedGroupName);
                }
              }}
              className={`w-full px-4 py-3 text-left transition-all hover:bg-gray-50 ${
                isExpanded ? 'bg-green-50' : hasValues ? 'bg-green-50/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasValues ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  
                  <div>
                    <h4 className="text-base font-bold text-gray-900">
                      {groupName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {groupFields.length} campo{groupFields.length !== 1 ? 's' : ''}
                      {hasValues && !isExpanded && (
                        <span className="text-green-600 ml-1">• Completado</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <ChevronRight
                  className={`w-5 h-5 flex-shrink-0 transition-transform text-green-600 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {/* Contenido del grupo */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupFields.map((field) => (
                    <div 
                      key={field.id}
                      className={`
                        ${field.field_type === 'textarea' ? 'md:col-span-2' : ''}
                        ${field.field_type === 'multiselect' ? 'md:col-span-2' : ''}
                      `}
                    >
                      <BackendDynamicField
                        field={field}
                        value={values[field.field_name]}
                        onChange={onChange}
                        error={errors[field.field_name]}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No hay campos específicos configurados para esta subcategoría.</p>
        </div>
      )}
    </div>
  );
};