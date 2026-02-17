/**
 * GlobalSettingsPanel
 * Panel de configuración global del sitio (SuperAdmin)
 * Con tabs: Configuración General + Planes de Suscripción
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, AlertCircle, CheckCircle, Info, CreditCard, Sliders,
  Star, Mail, BarChart3, Image, Megaphone, HelpCircle
} from 'lucide-react';
import { 
  getAllSettings, 
  setSetting, 
  type GlobalSetting 
} from '../../services/v2/globalSettingsService';
import PlansAdmin from './PlansAdmin';

// Tabs disponibles
type TabType = 'settings' | 'plans';

// Información detallada por categoría
const CATEGORY_INFO: Record<string, { 
  icon: React.ReactNode; 
  label: string; 
  description: string;
  color: string;
}> = {
  featured: { 
    icon: <Star className="w-5 h-5" />, 
    label: 'Avisos Destacados', 
    description: 'Configuración de avisos que aparecen con prioridad en la homepage',
    color: 'yellow'
  },
  contacts: { 
    icon: <Mail className="w-5 h-5" />, 
    label: 'Sistema de Contactos', 
    description: 'Control de mensajes entre compradores y vendedores',
    color: 'blue'
  },
  general: { 
    icon: <Settings className="w-5 h-5" />, 
    label: 'General', 
    description: 'Configuración general del sitio',
    color: 'gray'
  },
  analytics: { 
    icon: <BarChart3 className="w-5 h-5" />, 
    label: 'Estadísticas', 
    description: 'Visibilidad de métricas y analytics',
    color: 'purple'
  },
  plans: { 
    icon: <CreditCard className="w-5 h-5" />, 
    label: 'Planes', 
    description: 'Valores por defecto para suscripciones',
    color: 'green'
  },
  banners: { 
    icon: <Image className="w-5 h-5" />, 
    label: 'Banners', 
    description: 'Configuración de banners publicitarios',
    color: 'pink'
  },
  ads: { 
    icon: <Megaphone className="w-5 h-5" />, 
    label: 'Avisos', 
    description: 'Configuración de publicación de avisos',
    color: 'orange'
  },
};

// Explicaciones detalladas por setting key
const SETTING_HELP: Record<string, string> = {
  featured_max_per_category: 'Cuántos avisos destacados pueden aparecer simultáneamente en cada categoría de la homepage. Si hay más, se rotan.',
  featured_min_days: 'Mínimo de días que un usuario puede pagar para destacar. Evita compras muy cortas.',
  featured_max_days: 'Máximo de días que un usuario puede destacar un aviso de una sola vez.',
  featured_price_per_day: 'Precio en pesos argentinos (ARS) por cada día de destacado.',
  contacts_reset_day: 'Día del mes en que se reinician los contadores de contactos mensuales. Usar 1 para el primer día del mes. Poner 0 para desactivar el reset automático.',
  site_maintenance_mode: 'Si está activado, solo los administradores pueden acceder al sitio. Los usuarios ven una página de mantenimiento.',
  new_user_default_plan: 'Nombre del plan que se asigna automáticamente cuando un usuario se registra (ej: "free").',
  analytics_enabled: 'Si los usuarios pueden ver las estadísticas de vistas de sus avisos.',
};

export default function GlobalSettingsPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<{ key: string; success: boolean } | null>(null);
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);

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
    } focus:outline-none focus:ring-2 focus:ring-brand-600`;

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
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Guardar cambio"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : status?.success ? (
            <CheckCircle className="w-4 h-4 text-brand-600" />
          ) : status && !status.success ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  };

  if (loading && activeTab === 'settings') {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-brand-600" />
            Configuración Global
          </h1>
          <p className="text-gray-600 mt-1">
            Ajusta los parámetros del sistema y planes de suscripción
          </p>
        </div>
        {activeTab === 'settings' && (
          <button
            onClick={loadSettings}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Configuración
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'plans'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Planes de Suscripción
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' ? (
        <PlansAdmin />
      ) : (
        <>
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">¿Cómo funciona?</p>
              <p>Cada configuración se guarda individualmente al hacer clic en 💾. Los campos amarillos tienen cambios pendientes.</p>
            </div>
          </div>

          {/* Settings by Category */}
          <div className="space-y-6">
            {Object.entries(settingsByCategory).map(([category, categorySettings]) => {
              const catInfo = CATEGORY_INFO[category] || { 
                icon: <Settings className="w-5 h-5" />, 
                label: category, 
                description: '',
                color: 'gray'
              };
              
              return (
                <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Category Header */}
                  <div className={`px-5 py-4 border-b border-gray-200 bg-gradient-to-r ${
                    catInfo.color === 'yellow' ? 'from-yellow-50 to-white' :
                    catInfo.color === 'blue' ? 'from-blue-50 to-white' :
                    catInfo.color === 'purple' ? 'from-purple-50 to-white' :
                    catInfo.color === 'green' ? 'from-brand-50 to-white' :
                    catInfo.color === 'pink' ? 'from-pink-50 to-white' :
                    catInfo.color === 'orange' ? 'from-orange-50 to-white' :
                    'from-gray-50 to-white'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        catInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                        catInfo.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        catInfo.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        catInfo.color === 'green' ? 'bg-brand-100 text-brand-600' :
                        catInfo.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                        catInfo.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {catInfo.icon}
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{catInfo.label}</h2>
                        <p className="text-sm text-gray-500">{catInfo.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Settings in category */}
                  <div className="divide-y divide-gray-100">
                    {categorySettings.map(setting => {
                      const helpText = SETTING_HELP[setting.key];
                      const isHelpOpen = expandedHelp === setting.key;
                      
                      return (
                        <div key={setting.key} className="p-5 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            {/* Label & Description */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {setting.display_name || setting.key}
                                </span>
                                {helpText && (
                                  <button
                                    onClick={() => setExpandedHelp(isHelpOpen ? null : setting.key)}
                                    className={`p-1 rounded-full transition-colors ${
                                      isHelpOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400'
                                    }`}
                                    title="Ver ayuda"
                                  >
                                    <HelpCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {setting.is_public && (
                                  <span className="px-2 py-0.5 bg-brand-100 text-brand-600 text-xs rounded-full">
                                    Público
                                  </span>
                                )}
                              </div>
                              
                              {/* Descripción corta */}
                              {setting.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {setting.description}
                                </p>
                              )}
                              
                              {/* Ayuda expandida */}
                              {isHelpOpen && helpText && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                                  <strong>💡 Explicación:</strong> {helpText}
                                </div>
                              )}
                              
                              {/* Key técnico */}
                              <code className="text-xs text-gray-400 mt-2 block font-mono">
                                key: {setting.key}
                              </code>
                            </div>

                            {/* Input */}
                            <div className="lg:w-48 flex-shrink-0">
                              {renderInput(setting)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="text-center text-sm text-gray-500 py-4">
            {settings.length} configuraciones en {Object.keys(settingsByCategory).length} categorías
          </div>
        </>
      )}
    </div>
  );
}
