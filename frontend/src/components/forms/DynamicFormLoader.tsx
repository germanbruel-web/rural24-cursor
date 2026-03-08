import React, { useEffect, useState } from 'react';
import { BackendFormSection } from './BackendFormSection';
import { getFieldsForSubcategory, type DynamicFormField } from '../../services/formConfigService';
import { getFormForContext } from '../../services/v2/formsService';
import { DynamicFormV2Fields } from './DynamicFormV2Fields';
import type { CompleteFormV2 } from '../../types/v2';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

const normalizeGroupName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
};

interface DynamicFormLoaderProps {
  subcategoryId: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryName?: string;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  title?: string;
  description?: string;
  expandedGroup?: string;
  onGroupToggle?: (groupName: string) => void;
  completedGroups?: Set<string>;
  onConnectionError?: (hasError: boolean) => void;
}

export const DynamicFormLoader: React.FC<DynamicFormLoaderProps> = ({
  subcategoryId,
  categoryId,
  categoryName,
  subcategoryName,
  values,
  onChange,
  errors,
  title,
  description,
  expandedGroup,
  onGroupToggle,
  completedGroups,
  onConnectionError,
}) => {
  const [formV2, setFormV2] = useState<CompleteFormV2 | null>(null);
  const [backendFields, setBackendFields] = useState<DynamicFormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (subcategoryId && subcategoryId.trim() !== '') {
      loadFields();
    } else {
      setFormV2(null);
      setBackendFields([]);
      setLoading(false);
    }
  }, [subcategoryId, categoryId, retryCount]);

  const loadFields = async () => {
    setLoading(true);
    setConnectionError(null);

    try {
      // 1. Intentar form_templates_v2 (nuevo sistema)
      const v2Form = await getFormForContext(categoryId, subcategoryId);

      if (v2Form && v2Form.fields && v2Form.fields.length > 0) {
        console.log('DynamicFormLoader: usando form_templates_v2');
        setFormV2(v2Form);
        setBackendFields([]);
        onConnectionError?.(false);
        return;
      }

      // 2. Fallback: sistema legacy
      console.log('DynamicFormLoader: sin template v2, usando legacy');
      const legacyFields = await getFieldsForSubcategory(subcategoryId);
      setFormV2(null);
      setBackendFields(legacyFields);
      onConnectionError?.(false);

    } catch (error) {
      console.error('Error al cargar formulario:', error);

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const isNetworkError =
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('ERR_CONNECTION');

      setConnectionError(
        isNetworkError
          ? 'No se pudo conectar con el servidor. Verificá tu conexión a internet.'
          : `Error al cargar el formulario: ${errorMessage}`
      );
      setFormV2(null);
      setBackendFields([]);
      onConnectionError?.(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => setRetryCount((prev) => prev + 1);

  if (loading) {
    return (
      <div className="space-y-6">
        {title && (
          <div className="border-b pb-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-red-800">No es posible continuar</h3>
            <p className="text-red-600 max-w-md">{connectionError}</p>
          </div>
          <div className="bg-red-100 rounded-lg p-4 mt-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 text-left">
                <p className="font-medium mb-1">Para continuar, asegurate de:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tener conexión estable a internet</li>
                  <li>Que el servidor de la aplicación esté funcionando</li>
                </ul>
              </div>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar conexión
          </button>
        </div>
      </div>
    );
  }

  if (formV2) {
    return (
      <DynamicFormV2Fields
        form={formV2}
        values={values}
        onChange={onChange}
        errors={errors}
      />
    );
  }

  if (backendFields.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          ⚠️ No se encontraron campos para esta subcategoría.
        </p>
      </div>
    );
  }

  return (
    <BackendFormSection
      fields={backendFields}
      values={values}
      onChange={onChange}
      errors={errors}
      title={title}
      description={description}
      expandedGroup={expandedGroup}
      onGroupToggle={onGroupToggle}
      completedGroups={completedGroups}
    />
  );
};
