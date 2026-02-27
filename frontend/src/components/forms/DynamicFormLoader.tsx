import React, { useEffect, useState } from 'react';
import { BackendFormSection } from './BackendFormSection';
import { getFieldsForSubcategory, type DynamicFormField } from '../../services/formConfigService';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

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

interface DynamicFormLoaderProps {
  subcategoryId: string;
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
  /** Callback para notificar al padre cuando hay error de conexión */
  onConnectionError?: (hasError: boolean) => void;
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
  description,
  expandedGroup,
  onGroupToggle,
  completedGroups,
  onConnectionError
}) => {
  const [backendFields, setBackendFields] = useState<DynamicFormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Cargar campos siempre que tengamos un subcategoryId válido
    if (subcategoryId && subcategoryId.trim() !== '') {
      console.log(`🔄 DynamicFormLoader: Loading fields for subcategoryId: ${subcategoryId}`);
      loadFields();
    } else {
      console.log(`⚠️ DynamicFormLoader: No subcategoryId provided, skipping load`);
      setBackendFields([]);
      setLoading(false);
    }
  }, [subcategoryId, categoryName, subcategoryName, retryCount]);

  const loadFields = async () => {
    setLoading(true);
    setConnectionError(null);
    
    try {
      // Cargar desde backend (única fuente de verdad)
      console.log(`🔄 Cargando campos desde backend para subcategory: ${subcategoryId}`);
      const response = await getFieldsForSubcategory(subcategoryId);
      
      setBackendFields(response);
      setConnectionError(null);
      onConnectionError?.(false);
      console.log(`✅ ${response.length} campos cargados desde backend`);
      
      // No auto-abrir grupos: iniciar siempre colapsado.
      
    } catch (error) {
      // ERROR DE CONEXIÓN - NO hay fallback, bloquear avance
      console.error('❌ Error de conexión con el servidor:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const isNetworkError = errorMessage.includes('fetch') || 
                             errorMessage.includes('network') ||
                             errorMessage.includes('Failed to fetch') ||
                             errorMessage.includes('ERR_CONNECTION');
      
      setConnectionError(
        isNetworkError 
          ? 'No se pudo conectar con el servidor. Verifique su conexión a internet o que el servidor esté activo.'
          : `Error al cargar el formulario: ${errorMessage}`
      );
      setBackendFields([]);
      onConnectionError?.(true);
      
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
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

  // ERROR DE CONEXIÓN - Bloquear avance con mensaje claro
  if (connectionError) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-red-800">
              No es posible continuar
            </h3>
            <p className="text-red-600 max-w-md">
              {connectionError}
            </p>
          </div>

          <div className="bg-red-100 rounded-lg p-4 mt-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 text-left">
                <p className="font-medium mb-1">Para continuar, asegúrese de:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tener conexión estable a internet</li>
                  <li>El servidor de la aplicación esté funcionando</li>
                  <li>No haya bloqueadores de red activos</li>
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

          <p className="text-xs text-red-400 mt-2">
            Si el problema persiste, contacte al soporte técnico.
          </p>
        </div>
      </div>
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
    <>
      {/* Badge indicador de conexión exitosa (solo en dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2">
          <span className="text-xs px-2 py-1 rounded bg-brand-100 text-brand-700">
            ✅ Conectado al servidor
          </span>
        </div>
      )}
      
      {/* Formulario desde Backend */}
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
    </>
  );
};
