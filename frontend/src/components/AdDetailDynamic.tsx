// ====================================================================
// AdDetailDynamic - Componente para renderizar atributos dinámicos
// Lee de ad.attributes (JSONB) en lugar de campos fijos
// Diseño profesional y minimalista
// ====================================================================

import React from 'react';
import { Settings, Wrench, CheckCircle, Sparkles, Info, ChevronRight } from 'lucide-react';
import type { DynamicAttribute } from '../../services/catalogService';

interface AdDetailDynamicProps {
  attributes: Record<string, any>; // JSONB del aviso
  schema: DynamicAttribute[]; // Esquema de la subcategoría
}

export const AdDetailDynamic: React.FC<AdDetailDynamicProps> = ({ attributes, schema }) => {
  // Agrupar atributos por field_group
  const groupedSchema = schema.reduce((acc, attr) => {
    const group = attr.fieldGroup || 'general';
    if (!acc[group]) acc[group] = [];
    acc[group].push(attr);
    return acc;
  }, {} as Record<string, DynamicAttribute[]>);

  const groupConfig: Record<string, { icon: React.ReactNode; title: string; color: string }> = {
    general: { 
      icon: <Info className="w-5 h-5" />, 
      title: 'Información General',
      color: 'blue'
    },
    specifications: { 
      icon: <Settings className="w-5 h-5" />, 
      title: 'Especificaciones Técnicas',
      color: 'green'
    },
    condition: { 
      icon: <Wrench className="w-5 h-5" />, 
      title: 'Estado y Condición',
      color: 'orange'
    },
    features: { 
      icon: <Sparkles className="w-5 h-5" />, 
      title: 'Características Adicionales',
      color: 'purple'
    },
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
      blue: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        iconBg: 'bg-blue-100'
      },
      green: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        border: 'border-green-200',
        iconBg: 'bg-green-100'
      },
      orange: { 
        bg: 'bg-orange-50', 
        text: 'text-orange-700', 
        border: 'border-orange-200',
        iconBg: 'bg-orange-100'
      },
      purple: { 
        bg: 'bg-purple-50', 
        text: 'text-purple-700', 
        border: 'border-purple-200',
        iconBg: 'bg-purple-100'
      },
    };
    return colors[color] || colors.blue;
  };

  const formatValue = (attr: DynamicAttribute, value: any): string => {
    if (value === null || value === undefined || value === '') return 'No especificado';

    // Boolean
    if (attr.dataType === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    // Number con sufijos
    if (attr.dataType === 'integer' || attr.dataType === 'decimal') {
      const suffix = attr.uiConfig?.suffix || '';
      const prefix = attr.uiConfig?.prefix || '';
      const formattedNumber = typeof value === 'number' ? value.toLocaleString('es-AR') : value;
      return `${prefix}${formattedNumber}${suffix ? ' ' + suffix : ''}`;
    }

    // Array (multiselect)
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    // Date
    if (attr.dataType === 'date') {
      try {
        return new Date(value).toLocaleDateString('es-AR');
      } catch {
        return value;
      }
    }

    return String(value);
  };

  const renderAttributeValue = (attr: DynamicAttribute, groupColor: string) => {
    const value = attributes[attr.slug];
    
    // No mostrar si no tiene valor y no es requerido
    if ((value === null || value === undefined || value === '') && !attr.isRequired) {
      return null;
    }

    const displayValue = formatValue(attr, value);
    const isFeatured = attr.isFeatured;

    return (
      <div
        key={attr.slug}
        className={`relative p-4 rounded-xl border transition-all hover:shadow-md ${
          isFeatured 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 ring-2 ring-green-200' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        {isFeatured && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-gray-600">
            {attr.name}
          </span>
          <span className={`text-lg font-bold ${isFeatured ? 'text-green-900' : 'text-gray-900'}`}>
            {displayValue}
          </span>
          {attr.uiConfig?.helpText && (
            <span className="text-xs text-gray-500 italic">
              {attr.uiConfig.helpText}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedSchema).map(([groupKey, attrs]) => {
        // Filtrar solo los atributos que tienen valor
        const attrsWithValue = attrs.filter(
          (attr) => attributes[attr.slug] !== null && attributes[attr.slug] !== undefined && attributes[attr.slug] !== ''
        );

        if (attrsWithValue.length === 0) return null;

        const groupInfo = groupConfig[groupKey] || { 
          icon: <Info className="w-5 h-5" />, 
          title: groupKey,
          color: 'blue'
        };
        
        const colorClasses = getColorClasses(groupInfo.color);

        return (
          <div key={groupKey} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
            {/* Header del grupo */}
            <div className={`${colorClasses.bg} ${colorClasses.border} border-b-2 p-5`}>
              <div className="flex items-center gap-3">
                <div className={`${colorClasses.iconBg} ${colorClasses.text} p-3 rounded-xl`}>
                  {groupInfo.icon}
                </div>
                <div className="flex-1">
                  <h2 className={`text-2xl font-bold ${colorClasses.text}`}>
                    {groupInfo.title}
                  </h2>
                  <p className="text-base text-gray-600 mt-1">
                    {attrsWithValue.length} {attrsWithValue.length === 1 ? 'característica' : 'características'}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 ${colorClasses.text}`} />
              </div>
            </div>
            
            {/* Grid de atributos */}
            <div className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {attrsWithValue.map((attr) => renderAttributeValue(attr, groupInfo.color))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
