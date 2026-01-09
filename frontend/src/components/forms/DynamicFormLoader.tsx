import React, { useEffect, useState } from 'react';
import { DynamicFormSection } from './DynamicFields';
import { getFieldsForSubcategory } from '../../services/formConfigService';
import { getFieldsForAd, type FieldConfig } from '../../config/adFieldsConfig';

interface DynamicFormLoaderProps {
  subcategoryId: string;
  categoryName?: string;
  subcategoryName?: string;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  title?: string;
  description?: string;
}

/**
 * Componente inteligente que carga campos de formulario desde backend
 * con fallback automático a configuración hardcoded
 */
export const DynamicFormLoader: React.FC<DynamicFormLoaderProps> = ({
  subcategoryId,
  categoryName,
  subcategoryName,
  values,
  onChange,
  errors,
  title,
  description
}) => {
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'backend' | 'fallback'>('backend');

  useEffect(() => {
    loadFields();
  }, [subcategoryId, categoryName, subcategoryName]);

  const loadFields = async () => {
    setLoading(true);
    
    try {
      // 1. Intentar desde backend (nueva arquitectura)
      console.log(`🔄 Cargando campos desde backend para subcategory: ${subcategoryId}`);
      const backendFields = await getFieldsForSubcategory(subcategoryId);
      
      setFields(backendFields);
      setSource('backend');
      console.log(`✅ ${backendFields.length} campos cargados desde backend`);
      
    } catch (error) {
      // 2. Fallback a configuración hardcoded
      console.warn('⚠️ Backend no disponible, usando fallback hardcoded');
      
      if (categoryName && subcategoryName) {
        const fallbackFields = getFieldsForAd(categoryName, subcategoryName);
        setFields(fallbackFields);
        setSource('fallback');
        console.log(`✅ ${fallbackFields.length} campos cargados desde fallback`);
      } else {
        console.error('❌ No se puede usar fallback: falta categoryName o subcategoryName');
        setFields([]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {title && (
          <div className="border-b pb-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          ⚠️ No se encontraron campos para esta subcategoría.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Badge indicador de origen (solo en dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2">
          <span className={`text-xs px-2 py-1 rounded ${
            source === 'backend' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {source === 'backend' ? '🔄 Backend API' : '⚠️ Fallback hardcoded'}
          </span>
        </div>
      )}
      
      <DynamicFormSection
        fields={fields}
        values={values}
        onChange={onChange}
        errors={errors}
        title={title}
        description={description}
      />
    </>
  );
};
