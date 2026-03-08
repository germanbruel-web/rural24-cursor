// ============================================================
// FIELDS EDITOR DRAWER — Sprint 4B
// ============================================================
// Editor de campos para un form_template_v2.
// Se abre como drawer derecho desde FormManagerTab.
// Permite: listar, agregar, editar, reordenar y eliminar campos.
// Para campos select/autocomplete: vincular a option_list o
// gestionar opciones estáticas inline.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Pencil,
  Check,
  Loader2,
  AlignLeft,
  Hash,
  List,
  CheckSquare,
  Type,
  Sliders,
  Tag,
  Zap,
  Star,
  GripVertical,
  Link2,
  ListOrdered,
  ChevronRight,
} from 'lucide-react';
import {
  getFormFields,
  createFormField,
  updateFormField,
  deleteFormField,
  moveFieldUp,
  moveFieldDown,
  getFieldOptions,
  addFieldOption,
  deleteFieldOption,
} from '../../services/v2/formFieldsService';
import { getOptionLists } from '../../services/v2/optionListsService';
import type { OptionList } from '../../services/v2/optionListsService';
import { notify } from '../../utils/notifications';
import type { FormFieldV2, FormFieldOptionV2 } from '../../types/v2';

// ─── TIPOS LOCALES ─────────────────────────────────────────────

type FieldExtended = FormFieldV2 & { option_list_id?: string | null };

type FieldType = FormFieldV2['field_type'];
type FieldWidth = FormFieldV2['field_width'];

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode }[] = [
  { value: 'text',         label: 'Texto',            icon: <Type className="w-3.5 h-3.5" /> },
  { value: 'number',       label: 'Número',           icon: <Hash className="w-3.5 h-3.5" /> },
  { value: 'textarea',     label: 'Texto largo',      icon: <AlignLeft className="w-3.5 h-3.5" /> },
  { value: 'select',       label: 'Selector',         icon: <List className="w-3.5 h-3.5" /> },
  { value: 'autocomplete', label: 'Autocompletar',    icon: <Zap className="w-3.5 h-3.5" /> },
  { value: 'checkbox',     label: 'Sí / No',          icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { value: 'range',        label: 'Rango',            icon: <Sliders className="w-3.5 h-3.5" /> },
  { value: 'tags',         label: 'Etiquetas',        icon: <Tag className="w-3.5 h-3.5" /> },
  { value: 'features',     label: 'Características',  icon: <Star className="w-3.5 h-3.5" /> },
];

const FIELD_WIDTH_OPTIONS: { value: FieldWidth; label: string }[] = [
  { value: 'full',  label: 'Ancho completo' },
  { value: 'half',  label: 'Mitad (50%)' },
  { value: 'third', label: 'Tercio (33%)' },
];

function fieldTypeIcon(type: FieldType) {
  return FIELD_TYPES.find((t) => t.value === type)?.icon ?? <Type className="w-3.5 h-3.5" />;
}

function fieldTypeLabel(type: FieldType) {
  return FIELD_TYPES.find((t) => t.value === type)?.label ?? type;
}

const NEEDS_OPTIONS: FieldType[] = ['select', 'autocomplete'];

// ─── STATIC OPTIONS MANAGER ───────────────────────────────────

interface StaticOptionsMgrProps {
  fieldId: string;
  onClose: () => void;
}

function StaticOptionsManager({ fieldId, onClose }: StaticOptionsMgrProps) {
  const [options, setOptions] = useState<FormFieldOptionV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const opts = await getFieldOptions(fieldId);
      setOptions(opts);
    } finally {
      setLoading(false);
    }
  }, [fieldId]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const nextOrder = options.length > 0 ? Math.max(...options.map((o) => o.display_order)) + 1 : 0;
      const created = await addFieldOption(fieldId, newLabel, newLabel, nextOrder);
      setOptions((prev) => [...prev, created]);
      setNewLabel('');
    } catch (err: any) {
      notify.error(err.message || 'Error al agregar opción');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (optionId: string, label: string) => {
    if (!window.confirm(`¿Eliminar opción "${label}"?`)) return;
    try {
      await deleteFieldOption(optionId);
      setOptions((prev) => prev.filter((o) => o.id !== optionId));
    } catch (err: any) {
      notify.error(err.message || 'Error al eliminar opción');
    }
  };

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5" /> Opciones estáticas ({options.length})
        </span>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">cerrar</button>
      </div>

      <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
        ) : options.length === 0 ? (
          <p className="text-xs text-gray-400 px-3 py-3 text-center">Sin opciones — agregá la primera</p>
        ) : (
          options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2 px-3 py-1.5 group hover:bg-gray-50">
              <span className="flex-1 text-xs text-gray-700">{opt.option_label}</span>
              <span className="text-xs text-gray-400 font-mono">{opt.option_value}</span>
              <button
                onClick={() => handleDelete(opt.id, opt.option_label)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 p-2 border-t border-gray-200 bg-gray-50">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nueva opción..."
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!newLabel.trim() || adding}
          className="px-2 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1"
        >
          {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Agregar
        </button>
      </form>
    </div>
  );
}

// ─── FIELD EDIT FORM ──────────────────────────────────────────

interface FieldEditFormProps {
  field: FieldExtended;
  optionLists: OptionList[];
  onSave: (updates: Partial<FieldExtended>) => Promise<void>;
  onCancel: () => void;
}

function FieldEditForm({ field, optionLists, onSave, onCancel }: FieldEditFormProps) {
  const [label, setLabel] = useState(field.field_label);
  const [type, setType] = useState<FieldType>(field.field_type);
  const [width, setWidth] = useState<FieldWidth>(field.field_width);
  const [required, setRequired] = useState(field.is_required);
  const [placeholder, setPlaceholder] = useState(field.placeholder ?? '');
  const [helpText, setHelpText] = useState(field.help_text ?? '');
  const [optionListId, setOptionListId] = useState<string>(field.option_list_id ?? '');
  const [showStaticOptions, setShowStaticOptions] = useState(false);
  const [saving, setSaving] = useState(false);

  const needsOptions = NEEDS_OPTIONS.includes(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await onSave({
        field_label: label.trim(),
        field_type: type,
        field_width: width,
        is_required: required,
        placeholder: placeholder.trim() || null,
        help_text: helpText.trim() || null,
        option_list_id: needsOptions && optionListId ? optionListId : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
      {/* Label + tipo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Etiqueta *</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as FieldType); setOptionListId(''); setShowStaticOptions(false); }}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ancho + requerido */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Ancho</label>
          <select
            value={width}
            onChange={(e) => setWidth(e.target.value as FieldWidth)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          >
            {FIELD_WIDTH_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
            />
            <span className="text-sm text-gray-700">Campo requerido</span>
          </label>
        </div>
      </div>

      {/* Placeholder + help text */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Placeholder</label>
          <input
            type="text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="ej: Ingresá el valor..."
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Texto de ayuda</label>
          <input
            type="text"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="ej: Solo valores enteros"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Opciones para select/autocomplete */}
      {needsOptions && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              <Link2 className="w-3 h-3 inline mr-1" /> Vincular a lista de opciones
            </label>
            <select
              value={optionListId}
              onChange={(e) => { setOptionListId(e.target.value); if (e.target.value) setShowStaticOptions(false); }}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            >
              <option value="">Sin lista vinculada (opciones manuales)</option>
              {optionLists.map((ol) => (
                <option key={ol.id} value={ol.id}>{ol.display_name}</option>
              ))}
            </select>
          </div>

          {!optionListId && (
            <button
              type="button"
              onClick={() => setShowStaticOptions((v) => !v)}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              {showStaticOptions ? 'Ocultar opciones manuales' : 'Gestionar opciones manuales'}
              <ChevronRight className={`w-3 h-3 transition-transform ${showStaticOptions ? 'rotate-90' : ''}`} />
            </button>
          )}

          {showStaticOptions && !optionListId && (
            <StaticOptionsManager
              fieldId={field.id}
              onClose={() => setShowStaticOptions(false)}
            />
          )}
        </div>
      )}

      {/* Nombre interno (readonly) */}
      <p className="text-xs text-gray-400">
        Nombre interno: <code className="bg-gray-200 px-1 rounded">{field.field_name}</code>
      </p>

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={!label.trim() || saving}
          className="flex-1 px-3 py-1.5 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Guardar
        </button>
      </div>
    </form>
  );
}

// ─── ADD FIELD FORM ───────────────────────────────────────────

interface AddFieldFormProps {
  optionLists: OptionList[];
  onAdd: (field: Partial<FieldExtended>) => Promise<void>;
  onCancel: () => void;
}

function AddFieldForm({ optionLists, onAdd, onCancel }: AddFieldFormProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [width, setWidth] = useState<FieldWidth>('full');
  const [required, setRequired] = useState(false);
  const [optionListId, setOptionListId] = useState('');
  const [saving, setSaving] = useState(false);

  const needsOptions = NEEDS_OPTIONS.includes(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        field_label: label.trim(),
        field_type: type,
        field_width: width,
        is_required: required,
        option_list_id: needsOptions && optionListId ? optionListId : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-brand-50 border border-brand-200 rounded-xl space-y-3">
      <p className="text-sm font-semibold text-brand-800">Nuevo campo</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Etiqueta *</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ej: Raza del animal"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as FieldType); setOptionListId(''); }}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Ancho</label>
          <select
            value={width}
            onChange={(e) => setWidth(e.target.value as FieldWidth)}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          >
            {FIELD_WIDTH_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
      </div>

      {needsOptions && optionLists.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            <Link2 className="w-3 h-3 inline mr-1" /> Lista de opciones (opcional)
          </label>
          <select
            value={optionListId}
            onChange={(e) => setOptionListId(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          >
            <option value="">Sin lista vinculada</option>
            {optionLists.map((ol) => (
              <option key={ol.id} value={ol.id}>{ol.display_name}</option>
            ))}
          </select>
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
        />
        <span className="text-sm text-gray-700">Campo requerido</span>
      </label>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={!label.trim() || saving}
          className="flex-1 px-3 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Agregar campo
        </button>
      </div>
    </form>
  );
}

// ─── FIELD CARD ───────────────────────────────────────────────

interface FieldCardProps {
  field: FieldExtended;
  idx: number;
  total: number;
  optionLists: OptionList[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Partial<FieldExtended>) => Promise<void>;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function FieldCard({
  field, idx, total, optionLists, isEditing,
  onEdit, onCancelEdit, onSave, onDelete, onMoveUp, onMoveDown,
}: FieldCardProps) {
  const linkedList = optionLists.find((ol) => ol.id === field.option_list_id);

  return (
    <div className={`rounded-xl border transition-colors ${isEditing ? 'border-brand-300 bg-white shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
      {/* Row compacta */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Orden */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={onMoveUp}
            disabled={idx === 0}
            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
            title="Subir"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={idx === total - 1}
            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
            title="Bajar"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tipo badge */}
        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex-shrink-0">
          {fieldTypeIcon(field.field_type)}
          {fieldTypeLabel(field.field_type)}
        </span>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{field.field_label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 font-mono truncate">{field.field_name}</span>
            {field.is_required && (
              <span className="text-xs text-red-500 font-semibold">*requerido</span>
            )}
            {field.field_width !== 'full' && (
              <span className="text-xs text-gray-400">{field.field_width === 'half' ? '½' : '⅓'}</span>
            )}
            {linkedList && (
              <span className="flex items-center gap-0.5 text-xs text-brand-600">
                <Link2 className="w-3 h-3" /> {linkedList.display_name}
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            title="Editar"
            className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-brand-100 text-brand-700' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50'}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Eliminar"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit form expandible */}
      {isEditing && (
        <div className="px-3 pb-3">
          <FieldEditForm
            field={field}
            optionLists={optionLists}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────

interface FieldsEditorDrawerProps {
  templateId: string;
  templateName: string;
  onClose: () => void;
  onFieldsChanged?: () => void;
}

export function FieldsEditorDrawer({
  templateId,
  templateName,
  onClose,
  onFieldsChanged,
}: FieldsEditorDrawerProps) {
  const [fields, setFields] = useState<FieldExtended[]>([]);
  const [optionLists, setOptionLists] = useState<OptionList[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fieldsData, listsData] = await Promise.all([
        getFormFields(templateId),
        getOptionLists({ isActive: true }),
      ]);
      setFields(fieldsData);
      setOptionLists(listsData);
    } catch (err: any) {
      notify.error('Error al cargar los campos');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Handlers ────────────────────────────────────────────────

  const handleAdd = async (fieldData: Partial<FieldExtended>) => {
    const nextOrder = fields.length > 0
      ? Math.max(...fields.map((f) => f.display_order)) + 10
      : 0;

    try {
      const created = await createFormField(templateId, fieldData as any, nextOrder);
      setFields((prev) => [...prev, created]);
      setShowAddForm(false);
      notify.success('Campo agregado');
      onFieldsChanged?.();
    } catch (err: any) {
      notify.error(err.message || 'Error al agregar campo');
      throw err;
    }
  };

  const handleSave = async (fieldId: string, updates: Partial<FieldExtended>) => {
    try {
      await updateFormField(fieldId, updates);
      setFields((prev) =>
        prev.map((f) => f.id === fieldId ? { ...f, ...updates } : f)
      );
      setEditingId(null);
      notify.success('Campo actualizado');
    } catch (err: any) {
      notify.error(err.message || 'Error al actualizar campo');
      throw err;
    }
  };

  const handleDelete = async (field: FieldExtended) => {
    if (!window.confirm(`¿Eliminar el campo "${field.field_label}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteFormField(field.id);
      setFields((prev) => prev.filter((f) => f.id !== field.id));
      if (editingId === field.id) setEditingId(null);
      notify.success('Campo eliminado');
      onFieldsChanged?.();
    } catch (err: any) {
      notify.error(err.message || 'Error al eliminar campo');
    }
  };

  const handleMoveUp = async (fieldId: string) => {
    const ordered = [...fields].sort((a, b) => a.display_order - b.display_order);
    try {
      await moveFieldUp(fieldId, ordered);
      await loadData();
    } catch (err: any) {
      notify.error('Error al reordenar');
    }
  };

  const handleMoveDown = async (fieldId: string) => {
    const ordered = [...fields].sort((a, b) => a.display_order - b.display_order);
    try {
      await moveFieldDown(fieldId, ordered);
      await loadData();
    } catch (err: any) {
      notify.error('Error al reordenar');
    }
  };

  const sortedFields = [...fields].sort((a, b) => a.display_order - b.display_order);

  // ─── Render ──────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="drawer-enter fixed inset-y-0 right-0 z-50 w-[95vw] sm:w-[640px] max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Campos del formulario</h2>
            <p className="text-xs text-gray-500 font-mono">{templateName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowAddForm((v) => !v); setEditingId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar campo
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Add field form */}
          {showAddForm && (
            <AddFieldForm
              optionLists={optionLists}
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Cargando campos...
            </div>
          ) : sortedFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
              <GripVertical className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium text-gray-500">Este formulario no tiene campos aún</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Agregar el primero
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400">
                {sortedFields.length} campo{sortedFields.length !== 1 ? 's' : ''} — usá ↑↓ para reordenar
              </p>
              {sortedFields.map((field, idx) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  idx={idx}
                  total={sortedFields.length}
                  optionLists={optionLists}
                  isEditing={editingId === field.id}
                  onEdit={() => { setEditingId(editingId === field.id ? null : field.id); setShowAddForm(false); }}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(updates) => handleSave(field.id, updates)}
                  onDelete={() => handleDelete(field)}
                  onMoveUp={() => handleMoveUp(field.id)}
                  onMoveDown={() => handleMoveDown(field.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
