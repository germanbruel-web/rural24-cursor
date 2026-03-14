// ============================================================
// WIZARD CONFIG PANEL — Sprint 4F
// ============================================================
// Admin panel para configurar los steps del wizard de alta.
// Permite reordenar (drag-to-reorder con botones ↑↓) y
// togglear visibilidad de cada step.
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  GripVertical, Eye, EyeOff, Lock, Trash2,
  Tag, Settings, MapPin, Camera, FileText, CheckCircle2,
  Loader2, AlertCircle, ChevronUp, ChevronDown, Save,
  DollarSign, Building2, Image, LayoutTemplate, Layers,
} from 'lucide-react';
import {
  getAllWizardConfigs,
  updateWizardConfigSteps,
  deleteWizardConfig,
  type WizardConfig,
  type WizardStep,
  type WizardBlockType,
} from '../../services/v2/wizardConfigService';
import { notify } from '../../utils/notifications';

// ─── ICON MAP ─────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<any>> = {
  Tag, Settings, MapPin, Camera, FileText, CheckCircle2,
};

function StepIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? Settings;
  return <Icon className="w-4 h-4" />;
}

// ─── BLOCK CHIPS ──────────────────────────────────────────────

const BLOCK_META: Record<WizardBlockType, { label: string; icon: React.FC<any>; color: string }> = {
  dynamic_fields:   { label: 'Campos dinámicos',    icon: Layers,         color: 'bg-violet-100 text-violet-700' },
  price:            { label: 'Precio',               icon: DollarSign,     color: 'bg-green-100 text-green-700' },
  location:         { label: 'Ubicación',            icon: MapPin,         color: 'bg-blue-100 text-blue-700' },
  images:           { label: 'Fotos',                icon: Image,          color: 'bg-amber-100 text-amber-700' },
  title_description:{ label: 'Título y descripción', icon: LayoutTemplate, color: 'bg-sky-100 text-sky-700' },
  empresa_selector: { label: 'Empresa',              icon: Building2,      color: 'bg-brand-100 text-brand-700' },
};

// ─── STEP ROW ─────────────────────────────────────────────────

function StepRow({
  step,
  index,
  total,
  onToggle,
  onMoveUp,
  onMoveDown,
}: {
  step: WizardStep;
  index: number;
  total: number;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      step.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
    }`}>
      {/* Drag handle (visual, reorder via botones) */}
      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

      {/* Número */}
      <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {index + 1}
      </span>

      {/* Icono + info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
          <StepIcon name={step.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{step.label}</p>
          <p className="text-xs text-gray-500 truncate">{step.description}</p>
          {(step.blocks ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[...(step.blocks ?? [])].sort((a, b) => a.order - b.order).map((block) => {
                const meta = BLOCK_META[block.type];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <span key={block.type} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.color}`}>
                    <Icon className="w-2.5 h-2.5" />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Mover arriba/abajo */}
        <button
          onClick={onMoveUp}
          disabled={step.locked || index === 0}
          title="Mover arriba"
          className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={step.locked || index === total - 1}
          title="Mover abajo"
          className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Toggle visibilidad */}
        {step.locked ? (
          <div className="p-1 text-gray-300" title="Step obligatorio">
            <Lock className="w-4 h-4" />
          </div>
        ) : (
          <button
            onClick={onToggle}
            title={step.visible ? 'Ocultar step' : 'Mostrar step'}
            className={`p-1 rounded transition-colors ${
              step.visible ? 'text-brand-600 hover:text-brand-800' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {step.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CONFIG EDITOR ────────────────────────────────────────────

function ConfigEditor({
  config,
  onSaved,
  onDeleted,
}: {
  config: WizardConfig;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [steps, setSteps] = useState<WizardStep[]>([...config.steps].sort((a, b) => a.order - b.order));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const toggle = (idx: number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], visible: !next[idx].visible };
      return next;
    });
    setDirty(true);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
    setDirty(true);
  };

  const moveDown = (idx: number) => {
    setSteps((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWizardConfigSteps(config.id, steps);
      setDirty(false);
      notify.success('Configuración guardada');
      onSaved();
    } catch (e: any) {
      notify.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (config.name === 'default') {
      notify.error('No se puede eliminar la config por defecto');
      return;
    }
    if (!confirm(`¿Eliminar la config "${config.display_name}"?`)) return;
    try {
      await deleteWizardConfig(config.id);
      notify.success('Config eliminada');
      onDeleted();
    } catch (e: any) {
      notify.error(e.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <StepRow
          key={step.key}
          step={step}
          index={idx}
          total={steps.length}
          onToggle={() => toggle(idx)}
          onMoveUp={() => moveUp(idx)}
          onMoveDown={() => moveDown(idx)}
        />
      ))}

      <div className="flex items-center justify-between pt-2">
        {config.name !== 'default' && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar config
          </button>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PANEL PRINCIPAL ──────────────────────────────────────────

export function WizardConfigPanel() {
  const [configs, setConfigs] = useState<WizardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllWizardConfigs();
      setConfigs(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data.find((c) => c.name === 'default')?.id ?? data[0].id);
      }
    } catch (e: any) {
      setError(e.message || 'Error al cargar configs');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { load(); }, []);

  const selectedConfig = configs.find((c) => c.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Wizard de Publicación</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurá el orden y visibilidad de los pasos del formulario de alta.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de configs */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Configuraciones</p>
          {configs.map((cfg) => (
            <button
              key={cfg.id}
              onClick={() => setSelectedId(cfg.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                cfg.id === selectedId
                  ? 'bg-brand-50 border-brand-300 text-brand-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-sm">{cfg.display_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {cfg.name === 'default' ? 'Global' : 'Por categoría'} · {cfg.steps.filter((s) => s.visible).length} steps
              </p>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {selectedConfig ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{selectedConfig.display_name}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {selectedConfig.name === 'default' ? 'Config global' : `Categoría override`}
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <strong>Bloqueados</strong> (🔒): los steps <em>Categoría</em> y <em>Revisar y Publicar</em> son obligatorios y no pueden ocultarse ni moverse.
                </p>
              </div>

              <ConfigEditor
                key={selectedConfig.id}
                config={selectedConfig}
                onSaved={load}
                onDeleted={() => { setSelectedId(null); load(); }}
              />
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
              Seleccioná una configuración para editarla.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
