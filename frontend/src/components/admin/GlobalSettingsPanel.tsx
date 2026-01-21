/**
 * GlobalSettingsPanel
 * Panel de configuración global del sitio (SuperAdmin)
 * Lista plana editable de settings
 */

import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { 
  getAllSettings, 
  setSetting, 
  type GlobalSetting 
} from '../../services/v2/globalSettingsService';

// Iconos por categoría
const CATEGORY_ICONS: Record<string, string> = {
  featured: 'star',
  contacts: 'mail',
  general: 'cog',
  analytics: 'chart',
  plans: 'card',
};

const CATEGORY_LABELS: Record<string, string> = {
  featured: 'Destacados',
  contacts: 'Contactos',
  general: 'General',
  analytics: 'Analytics',
  plans: 'Planes',
};

export default function GlobalSettingsPanel() {
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<{ key: string; success: boolean } | null>(null);

  // Cargar settings
  const loadSettings = async () => {
    setLoading(true);
    const data = await getAllSettings();
    setSettings(data);
    // Inicializar valores editados
    const values: Record<string, string> = {};
    data.forEach(s => {
      values[s.key] = formatValueForInput(s.value, s.value_type);
    });
    setEditedValues(values);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Formatear valor para input
  const formatValueForInput = (value: any, type: string): string => {
    if (type === 'boolean') return value ? 'true' : 'false';
    if (type === 'json' || type === 'array') return JSON.stringify(value);
    return String(value ?? '');
  };

  // Parsear valor del input
  const parseInputValue = (value: string, type: string): any => {
    if (type === 'boolean') return value === 'true';
    if (type === 'number') return Number(value);
    if (type === 'json' || type === 'array') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  // Guardar un setting
  const handleSave = async (setting: GlobalSetting) => {
    const newValue = editedValues[setting.key];
    const parsedValue = parseInputValue(newValue, setting.value_type);
    
    setSaving(setting.key);
    const success = await setSetting(setting.key, parsedValue);
    setSaving(null);
    
    setSaveStatus({ key: setting.key, success });
    setTimeout(() => setSaveStatus(null), 2000);
    
    if (success) {
      // Actualizar en la lista local
      setSettings(prev => prev.map(s => 
        s.key === setting.key ? { ...s, value: parsedValue } : s
      ));
    }
  };

  // Verificar si hay cambios
  const hasChanges = (setting: GlobalSetting): boolean => {
    const currentValue = formatValueForInput(setting.value, setting.value_type);
    return editedValues[setting.key] !== currentValue;
  };

  // Agrupar por categoría
  const settingsByCategory = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, GlobalSetting[]>);

  // Renderizar input según tipo
  const renderInput = (setting: GlobalSetting) => {
    const value = editedValues[setting.key] ?? '';
    const isChanged = hasChanges(setting);
    const isSaving = saving === setting.key;
    const status = saveStatus?.key === setting.key ? saveStatus : null;

    const baseClasses = `w-full px-3 py-2 border rounded-lg transition-all ${
      isChanged 
        ? 'border-yellow-400 bg-yellow-50' 
        : 'border-gray-300 bg-white'
    } focus:outline-none focus:ring-2 focus:ring-green-500`;

    return (
      <div className="flex items-center gap-2">
        {setting.value_type === 'boolean' ? (
          <select
            value={value}
            onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
            className={baseClasses}
            disabled={isSaving}
          >
            <option value="true">Activado</option>
            <option value="false">Desactivado</option>
          </select>
        ) : setting.value_type === 'number' ? (
          <input
            type="number"
            value={value}
            onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
            className={baseClasses}
            disabled={isSaving}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
            className={baseClasses}
            disabled={isSaving}
          />
        )}

        {/* Botón guardar */}
        <button
          onClick={() => handleSave(setting)}
          disabled={!isChanged || isSaving}
          className={`p-2 rounded-lg transition-all ${
            isChanged && !isSaving
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Guardar cambio"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : status?.success ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : status && !status.success ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-green-600" />
            Configuración Global
          </h1>
          <p className="text-gray-600 mt-1">
            Ajusta los parámetros del sistema
          </p>
        </div>
        <button
          onClick={loadSettings}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Cambios en tiempo real</p>
          <p>Los cambios se aplican inmediatamente al guardar. Los valores marcados en amarillo tienen cambios sin guardar.</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
          <div key={category} className="border-b border-gray-200 last:border-b-0">
            {/* Category Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>{CATEGORY_ICONS[category] || 'cfg'}</span>
                {CATEGORY_LABELS[category] || category}
              </h2>
            </div>

            {/* Settings in category */}
            <div className="divide-y divide-gray-100">
              {categorySettings.map(setting => (
                <div key={setting.key} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Label & Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {setting.display_name || setting.key}
                        </span>
                        {setting.is_public && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Público
                          </span>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {setting.description}
                        </p>
                      )}
                      <code className="text-xs text-gray-400 mt-1 block">
                        {setting.key}
                      </code>
                    </div>

                    {/* Input */}
                    <div className="lg:w-64">
                      {renderInput(setting)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="text-center text-sm text-gray-500">
        {settings.length} configuraciones en {Object.keys(settingsByCategory).length} categorías
      </div>
    </div>
  );
}
