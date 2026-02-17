/**
 * =====================================================
 * FOOTER CMS - Panel de Administración del Footer
 * =====================================================
 * Componente principal para editar footer dinámico
 */

import React, { useState, useEffect } from 'react';
import { Save, Loader, RefreshCw, Download, Upload as UploadIcon } from 'lucide-react';
import { getFooterConfig, updateFooterConfig, resetFooterToDefault, exportFooterConfig, importFooterConfig } from '../../../services/footerService';
import { useToastHelpers } from '../../../contexts/ToastContext';
import type { FooterConfig } from '../../../types/footer';
import { DEFAULT_FOOTER_CONFIG } from '../../../utils/footerDefaults';
import { Column1Contact } from './Column1Contact';
import { Column2Links } from './Column2Links';
import { Column3Categories } from './Column3Categories';
import { Column4Mixed } from './Column4Mixed';

export const FooterCMS: React.FC = () => {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToastHelpers();

  // Cargar configuración al montar
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const footerConfig = await getFooterConfig();
      setConfig(footerConfig);
      setOriginalConfig(footerConfig);
    } catch (error) {
      toast.error('Error cargando configuración', 'Intenta recargar la página');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const success = await updateFooterConfig(config);
      
      if (success) {
        setOriginalConfig(config);
        toast.success('Footer actualizado', 'Los cambios se guardaron correctamente');
      } else {
        toast.error('Error actualizando footer', 'Verifica permisos de SuperAdmin');
      }
    } catch (error) {
      toast.error('Error guardando cambios', 'Intenta nuevamente');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Resetear footer a configuración por defecto? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setIsSaving(true);
      const success = await resetFooterToDefault();
      
      if (success) {
        await loadConfig();
        toast.success('Footer reseteado', 'Valores por defecto restaurados');
      } else {
        toast.error('Error reseteando footer', 'Intenta nuevamente');
      }
    } catch (error) {
      toast.error('Error en reset', 'Intenta nuevamente');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportFooterConfig();
      if (!json) {
        toast.error('Error exportando', 'No se pudo obtener la configuración');
        return;
      }
      
      // Descargar como archivo
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `footer-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Configuración exportada', 'Archivo descargado correctamente');
    } catch (error) {
      toast.error('Error exportando', 'Intenta nuevamente');
      console.error(error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const success = await importFooterConfig(text);
      
      if (success) {
        await loadConfig();
        toast.success('Configuración importada', 'Archivo cargado correctamente');
      } else {
        toast.error('Error importando', 'Verifica el formato JSON');
      }
    } catch (error) {
      toast.error('Error leyendo archivo', 'El archivo puede estar corrupto');
      console.error(error);
    }
    
    // Reset input
    event.target.value = '';
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando configuración del footer...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Configuración del Footer</h2>
            <p className="text-gray-500">Gestiona el contenido dinámico del pie de página</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              title="Exportar configuración"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            
            <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer">
              <UploadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Importar</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Resetear a valores por defecto"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de 4 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Columna 1: Contacto */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <span className="text-brand-600 font-bold">1</span>
            </div>
            <h3 className="font-bold text-gray-900">Información de Contacto</h3>
          </div>
          
          <Column1Contact
            column={config.column1}
            onChange={(updated) => setConfig({ ...config, column1: updated })}
          />
        </div>

        {/* Columna 2: Links Personalizados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h3 className="font-bold text-gray-900">Links Personalizados</h3>
          </div>
          
          <Column2Links
            column={config.column2}
            onChange={(updated) => setConfig({ ...config, column2: updated })}
          />
        </div>

        {/* Columna 3: Categorías */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <h3 className="font-bold text-gray-900">Categorías</h3>
          </div>
          
          <Column3Categories
            column={config.column3}
            onChange={(updated) => setConfig({ ...config, column3: updated })}
          />
        </div>

        {/* Columna 4: Links + Sociales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold">4</span>
            </div>
            <h3 className="font-bold text-gray-900">Links + Redes Sociales</h3>
          </div>
          
          <Column4Mixed
            column={config.column4}
            onChange={(updated) => setConfig({ ...config, column4: updated })}
          />
        </div>
      </div>

      {/* Footer con botón de guardar */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Cambios sin guardar</span>
                </div>
              )}
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2
                ${hasChanges && !isSaving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isSaving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Todos los Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
