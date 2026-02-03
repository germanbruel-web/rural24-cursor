/**
 * =====================================================
 * BACKEND SETTINGS V2 - Panel CMS Profesional
 * =====================================================
 * Panel mejorado con:
 * - Sistema de notificaciones toast
 * - Validación de archivos
 * - Estados de carga detallados
 * - Preview de imágenes mejorado
 * - Cache-busting automático
 * - Limpieza de archivos antiguos
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Save, 
  Loader,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  FileImage,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../../constants/defaultImages';
import {
  getAllSettings,
  updateSetting,
  updateImageSetting,
  type SiteSetting
} from '../../services/siteSettingsService';
import { 
  validateImageFile, 
  formatFileSize,
  type FileValidationOptions 
} from '../../utils/fileValidation';
import { useToastHelpers } from '../../contexts/ToastContext';
import { FooterCMS } from './FooterCMS';
import { CategoryIconsCMS } from './CategoryIconsCMS';

type Section = 'header' | 'footer' | 'content' | 'general' | 'icons';

interface SettingsBySection {
  header: SiteSetting[];
  footer: SiteSetting[];
  content: SiteSetting[];
  general: SiteSetting[];
}

interface UploadProgress {
  settingKey: string;
  progress: number;
  status: 'validating' | 'uploading' | 'updating' | 'completed';
}

// Componente separado para text settings (evita hooks dentro de funciones render)
const TextSettingItem: React.FC<{
  setting: SiteSetting;
  onUpdate: (key: string, value: string) => Promise<void>;
}> = ({ setting, onUpdate }) => {
  const [value, setValue] = useState(setting.setting_value || '');
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = value !== setting.setting_value;

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(setting.setting_key, value);
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{setting.description}</h3>
          <p className="text-xs text-gray-500 mt-1 font-mono">{setting.setting_key}</p>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
          Texto
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={isSaving}
          placeholder={`Ingresa ${setting.description?.toLowerCase()}`}
        />
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={`
            px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium
            ${hasChanges && !isSaving
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          title={!hasChanges ? 'Sin cambios' : 'Guardar cambios'}
        >
          {isSaving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : hasChanges ? (
            <Save className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {hasChanges && !isSaving && (
        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Hay cambios sin guardar
        </p>
      )}
    </div>
  );
};

export const BackendSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsBySection>({
    header: [],
    footer: [],
    content: [],
    general: []
  });
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('header');
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  
  const toast = useToastHelpers();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Cargar settings al montar
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await getAllSettings();
      
      // Agrupar por sección
      const grouped: SettingsBySection = {
        header: [],
        footer: [],
        content: [],
        general: []
      };

      allSettings.forEach(setting => {
        grouped[setting.section].push(setting);
      });

      setSettings(grouped);
      toast.success('Configuraciones cargadas', 'Datos actualizados desde la base de datos');
    } catch (error) {
      toast.error('Error cargando configuraciones', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleTextUpdate = async (settingKey: string, newValue: string) => {
    const loadingToast = toast.loading('Actualizando...', `Guardando ${settingKey}`);
    
    try {
      const success = await updateSetting({ setting_key: settingKey, setting_value: newValue });
      
      toast.hide(loadingToast);
      
      if (success) {
        toast.success('¡Actualizado!', 'El texto se guardó correctamente');
        await loadSettings();
      } else {
        toast.error('Error', 'No se pudo actualizar la configuración');
      }
    } catch (error) {
      toast.hide(loadingToast);
      toast.error('Error', 'Ocurrió un problema al guardar');
    }
  };

  const handleImageUpload = async (settingKey: string, file: File) => {
    // 1. Validar archivo
    setUploadProgress({ settingKey, progress: 5, status: 'validating' });
    
    const validationOptions: FileValidationOptions = {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif'],
      maxWidth: 4096,
      maxHeight: 4096,
      recommendedFormats: ['image/webp', 'image/avif']
    };

    const validation = await validateImageFile(file, validationOptions);
    
    if (!validation.valid) {
      setUploadProgress(null);
      toast.error('Archivo inválido', validation.error || 'El archivo no cumple los requisitos');
      return;
    }

    // Mostrar advertencias si las hay
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        toast.info('Recomendación', warning, 6000);
      });
    }

    // 2. Crear preview local
    const previewUrl = URL.createObjectURL(file);
    setPreviewImages(prev => ({ ...prev, [settingKey]: previewUrl }));

    // 3. Subir imagen
    const loadingToast = toast.loading(
      'Subiendo imagen...', 
      `${file.name} (${formatFileSize(file.size)})`
    );

    try {
      setUploadProgress({ settingKey, progress: 10, status: 'uploading' });

      const success = await updateImageSetting(
        settingKey, 
        file, 
        settingKey.split('_')[0],
        (progress) => {
          if (progress < 90) {
            setUploadProgress({ settingKey, progress, status: 'uploading' });
          } else if (progress < 100) {
            setUploadProgress({ settingKey, progress, status: 'updating' });
          }
        }
      );

      toast.hide(loadingToast);
      
      if (success) {
        setUploadProgress({ settingKey, progress: 100, status: 'completed' });
        toast.success(
          '¡Imagen actualizada!', 
          'La imagen se guardó y se eliminó la anterior automáticamente'
        );
        
        // Limpiar preview local
        URL.revokeObjectURL(previewUrl);
        setPreviewImages(prev => {
          const newPrev = { ...prev };
          delete newPrev[settingKey];
          return newPrev;
        });
        
        // Recargar settings para mostrar nueva imagen
        await loadSettings();
        
        setTimeout(() => setUploadProgress(null), 1500);
      } else {
        setUploadProgress(null);
        toast.error('Error al subir', 'No se pudo actualizar la imagen');
      }
    } catch (error) {
      toast.hide(loadingToast);
      setUploadProgress(null);
      toast.error('Error', 'Ocurrió un problema durante la subida');
      URL.revokeObjectURL(previewUrl);
    }

    // Limpiar input file
    if (fileInputRefs.current[settingKey]) {
      fileInputRefs.current[settingKey]!.value = '';
    }
  };

  const renderImageSetting = (setting: SiteSetting) => {
    const isUploading = uploadProgress?.settingKey === setting.setting_key;
    const progress = isUploading ? uploadProgress.progress : 0;
    const status = isUploading ? uploadProgress.status : null;
    const previewUrl = previewImages[setting.setting_key];
    const displayUrl = previewUrl || setting.setting_value;

    return (
      <div key={setting.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileImage className="w-5 h-5 text-purple-600" />
              {setting.description}
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">{setting.setting_key}</p>
          </div>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            Imagen
          </span>
        </div>

        {/* Preview actual o placeholder */}
        {displayUrl ? (
          <div className="mb-4 relative">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {previewUrl ? 'Vista previa:' : 'Imagen actual:'}
            </p>
            <div className="relative group">
              <img 
                src={displayUrl}
                alt={setting.description || ''} 
                className="h-32 w-auto object-contain bg-gray-50 rounded-lg p-3 border border-gray-200 group-hover:border-purple-300 transition-colors"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE;
                }}
              />
              {previewUrl && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Nuevo
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {displayUrl.includes('cms-images') 
                ? 'Almacenada en CMS' 
                : 'Placeholder por defecto'}
            </p>
          </div>
        ) : (
          <div className="mb-4 h-32 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Sin imagen</p>
            </div>
          </div>
        )}

        {/* Barra de progreso */}
        {isUploading && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700 font-medium">
                {status === 'validating' && 'Validando...'}
                {status === 'uploading' && 'Subiendo...'}
                {status === 'updating' && 'Guardando...'}
                {status === 'completed' && '¡Completado!'}
              </span>
              <span className="text-gray-600 font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload button */}
        <div className="flex gap-2">
          <label className="flex-1 cursor-pointer">
            <div className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium
              ${isUploading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-[#16a135] hover:bg-[#138a2c] text-white shadow-sm hover:shadow-md'
              }
            `}>
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Cambiar imagen
                </>
              )}
            </div>
            <input
              ref={el => { fileInputRefs.current[setting.setting_key] = el; }}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/avif"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(setting.setting_key, file);
              }}
            />
          </label>
        </div>

        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Formatos:</strong> JPG, PNG, WEBP, SVG, AVIF<br />
              <strong>Máximo:</strong> 5 MB<br />
              <strong>Recomendado:</strong> WEBP o AVIF para mejor rendimiento
            </span>
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-600">Cargando configuraciones del CMS...</p>
      </div>
    );
  }

  const currentSettings = settings[activeSection];
  const totalSettings = Object.values(settings).flat().length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileImage className="w-6 h-6 text-gray-600" />
            CMS - Gestión de Contenidos
          </h1>
          <p className="mt-1 text-gray-500">
            Control sobre logos, imágenes y textos del sitio
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="px-3 py-1 bg-gray-100 rounded-full">
            {totalSettings} configuraciones
          </span>
        </div>
      </div>

      {/* Tabs de secciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {(['header', 'content', 'footer', 'general', 'icons'] as Section[]).map(section => {
            const count = section === 'icons' ? 0 : settings[section as keyof SettingsBySection].length;
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`
                  px-4 py-3 rounded-lg font-medium transition-all
                  ${activeSection === section
                    ? 'bg-[#16a135] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm uppercase tracking-wide">{section}</span>
                  {section !== 'icons' && <span className="text-xs opacity-75">{count} items</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Botón recargar */}
      <div className="flex justify-between items-center">
        <button
          onClick={loadSettings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-gray-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recargar configuraciones
        </button>
        
        <div className="text-sm text-gray-500">
          Sección: <strong className="text-gray-900">{activeSection.toUpperCase()}</strong>
        </div>
      </div>

      {/* Mostrar iconos, footer CMS o settings según la sección */}
      {activeSection === 'icons' ? (
        <CategoryIconsCMS />
      ) : activeSection === 'footer' ? (
        <FooterCMS />
      ) : (
        <>
          {/* Settings Grid */}
          {currentSettings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentSettings.map(setting => {
                if (setting.setting_type === 'image') {
                  return renderImageSetting(setting);
                } else {
                  return <TextSettingItem key={setting.id} setting={setting} onUpdate={handleTextUpdate} />;
                }
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No hay configuraciones en esta sección</p>
              <p className="text-gray-500 text-sm mt-2">Selecciona otra pestaña para ver más opciones</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
