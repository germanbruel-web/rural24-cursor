// ============================================================
// FORM MANAGER TAB — Sprint 4A
// ============================================================
// Gestión completa de form_templates_v2: listar, crear, eliminar,
// duplicar. Los campos internos de cada formulario se gestionan
// en un drawer de edición (vista detalle).
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Eye,
  Search,
  FileText,
  Loader2,
  AlertCircle,
  ChevronDown,
  X,
  Check,
  Tag,
  Layers,
} from 'lucide-react';
import {
  getAllFormTemplates,
  getFormByName,
} from '../../services/v2/formsService';
import { getCategories, getSubcategories } from '../../services/v2/formsService';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import type { FormTemplateV2 } from '../../types/v2';
import type { Category, Subcategory } from '../../types/v2';

// ─── HELPERS ──────────────────────────────────────────────────

function scopeLabel(tmpl: FormTemplateV2): string {
  if (tmpl.category_type_id) return 'Tipo';
  if (tmpl.subcategory_id) return 'Subcategoría';
  if (tmpl.category_id) return 'Categoría';
  return 'Global';
}

function scopeBadgeClass(tmpl: FormTemplateV2): string {
  if (tmpl.category_type_id) return 'bg-purple-100 text-purple-700';
  if (tmpl.subcategory_id) return 'bg-blue-100 text-blue-700';
  if (tmpl.category_id) return 'bg-brand-100 text-brand-700';
  return 'bg-gray-100 text-gray-700';
}

// ─── FORM CRUD (servicios inline) ────────────────────────────

async function deleteFormTemplate(id: string): Promise<void> {
  // Primero eliminar campos y opciones
  const { data: fields } = await supabase
    .from('form_fields_v2')
    .select('id')
    .eq('form_template_id', id);

  if (fields && fields.length > 0) {
    const fieldIds = fields.map((f) => f.id);
    await supabase.from('form_field_options_v2').delete().in('field_id', fieldIds);
    await supabase.from('form_fields_v2').delete().eq('form_template_id', id);
  }

  const { error } = await supabase.from('form_templates_v2').delete().eq('id', id);
  if (error) throw error;
}

async function duplicateFormTemplate(
  source: FormTemplateV2,
  newName: string,
  newDisplayName: string
): Promise<string> {
  // Crear template nuevo
  const { data: newTemplate, error: tmplError } = await supabase
    .from('form_templates_v2')
    .insert({
      name: newName,
      display_name: newDisplayName,
      category_id: source.category_id,
      subcategory_id: source.subcategory_id || null,
      category_type_id: (source as any).category_type_id || null,
      sections: source.sections || [],
      is_active: false, // inactivo hasta que el admin lo active manualmente
      priority: (source.priority || 0) - 1, // un poco menor de prioridad
    })
    .select()
    .single();

  if (tmplError) throw tmplError;

  // Copiar campos
  const { data: fields } = await supabase
    .from('form_fields_v2')
    .select('*')
    .eq('form_template_id', source.id)
    .order('display_order', { ascending: true });

  if (fields && fields.length > 0) {
    for (const field of fields) {
      const { id: _id, form_template_id: _tid, created_at: _ca, ...fieldData } = field as any;
      const { data: newField, error: fieldError } = await supabase
        .from('form_fields_v2')
        .insert({ ...fieldData, form_template_id: newTemplate.id })
        .select()
        .single();

      if (fieldError) continue;

      // Copiar opciones del campo
      const { data: options } = await supabase
        .from('form_field_options_v2')
        .select('*')
        .eq('field_id', field.id);

      if (options && options.length > 0) {
        const optPayload = options.map(({ id: _oid, field_id: _fid, ...opt }: any) => ({
          ...opt,
          field_id: newField.id,
        }));
        await supabase.from('form_field_options_v2').insert(optPayload);
      }
    }
  }

  return newTemplate.id;
}

async function getFieldCount(templateId: string): Promise<number> {
  const { count } = await supabase
    .from('form_fields_v2')
    .select('*', { count: 'exact', head: true })
    .eq('form_template_id', templateId);
  return count ?? 0;
}

// ─── CREATE FORM MODAL ────────────────────────────────────────

interface CreateFormModalProps {
  categories: Category[];
  onClose: () => void;
  onCreated: () => void;
}

function CreateFormModal({ categories, onClose, onCreated }: CreateFormModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!categoryId) { setSubcategories([]); setSubcategoryId(''); return; }
    getSubcategories(categoryId).then(setSubcategories);
  }, [categoryId]);

  const nameSlug = displayName.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').replace(/_+/g, '_').trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !categoryId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('form_templates_v2')
        .insert({
          name: nameSlug || `form_${Date.now()}`,
          display_name: displayName.trim(),
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          sections: [],
          is_active: false,
          priority: 0,
        });
      if (error) throw error;
      notify.success('Formulario creado');
      onCreated();
    } catch (err: any) {
      notify.error(err.message || 'Error al crear formulario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">Nuevo Formulario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del formulario *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ej: Formulario Hacienda"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
              autoFocus
            />
            {nameSlug && (
              <p className="text-xs text-gray-400 mt-1">Slug: <code>{nameSlug}</code></p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.display_name}</option>
              ))}
            </select>
          </div>

          {subcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategoría (opcional)
              </label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
              >
                <option value="">Aplica a toda la categoría</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.display_name}</option>
                ))}
              </select>
            </div>
          )}

          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            El formulario se crea inactivo. Activalo desde la lista una vez que hayas configurado sus campos.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!displayName.trim() || !categoryId || saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DUPLICATE MODAL ──────────────────────────────────────────

interface DuplicateModalProps {
  source: FormTemplateV2;
  onClose: () => void;
  onDuplicated: () => void;
}

function DuplicateModal({ source, onClose, onDuplicated }: DuplicateModalProps) {
  const [displayName, setDisplayName] = useState(`${source.display_name} (copia)`);
  const [saving, setSaving] = useState(false);

  const nameSlug = `${source.name}_copia_${Date.now()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await duplicateFormTemplate(source, nameSlug, displayName.trim());
      notify.success('Formulario duplicado. Revisá y activalo cuando esté listo.');
      onDuplicated();
    } catch (err: any) {
      notify.error(err.message || 'Error al duplicar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">Duplicar Formulario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Se copiará <strong>{source.display_name}</strong> con todos sus campos y secciones.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre para la copia *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={!displayName.trim() || saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Duplicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TEMPLATE ROW ─────────────────────────────────────────────

interface TemplateRowProps {
  template: FormTemplateV2 & { field_count?: number; category_name?: string; subcategory_name?: string };
  categories: Category[];
  onDelete: (t: FormTemplateV2) => void;
  onDuplicate: (t: FormTemplateV2) => void;
  onToggleActive: (t: FormTemplateV2) => void;
}

function TemplateRow({ template, onDelete, onDuplicate, onToggleActive }: TemplateRowProps) {
  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{template.display_name}</p>
          <p className="text-xs text-gray-400 font-mono">{template.name}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{(template as any).category_name || '—'}</span>
        {(template as any).subcategory_name && (
          <p className="text-xs text-gray-400">{(template as any).subcategory_name}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${scopeBadgeClass(template)}`}>
          <Layers className="w-3 h-3" />
          {scopeLabel(template)}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm text-gray-700 tabular-nums">
          {(template as any).field_count ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-gray-500 tabular-nums">
          {template.priority}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleActive(template)}
          title={template.is_active ? 'Desactivar' : 'Activar'}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
            template.is_active
              ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {template.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {template.is_active ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate(template)}
            title="Duplicar"
            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(template)}
            title="Eliminar"
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────

export function FormManagerTab() {
  const [templates, setTemplates] = useState<(FormTemplateV2 & { field_count?: number })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [duplicating, setDuplicating] = useState<FormTemplateV2 | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, tmpls] = await Promise.all([
        getCategories(),
        getAllFormTemplates(),
      ]);
      setCategories(cats);

      // Enriquecer con field counts
      const enriched = await Promise.all(
        tmpls.map(async (t) => ({
          ...t,
          field_count: await getFieldCount(t.id),
        }))
      );
      setTemplates(enriched);
    } catch (err: any) {
      notify.error('Error al cargar formularios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtros
  const filtered = templates.filter((t) => {
    const matchSearch = !search ||
      t.display_name.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategoryId || t.category_id === filterCategoryId;
    const matchActive =
      filterActive === 'all' ? true :
      filterActive === 'active' ? t.is_active :
      !t.is_active;
    return matchSearch && matchCat && matchActive;
  });

  const handleDelete = async (t: FormTemplateV2) => {
    const count = (t as any).field_count ?? 0;
    const msg = count > 0
      ? `¿Eliminar "${t.display_name}"?\n\nTiene ${count} campo(s). Se eliminarán también sus campos y opciones. Esta acción no se puede deshacer.`
      : `¿Eliminar "${t.display_name}"? Esta acción no se puede deshacer.`;

    if (!window.confirm(msg)) return;
    try {
      await deleteFormTemplate(t.id);
      notify.success('Formulario eliminado');
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
    } catch (err: any) {
      notify.error(err.message || 'Error al eliminar');
    }
  };

  const handleToggleActive = async (t: FormTemplateV2) => {
    try {
      const { error } = await supabase
        .from('form_templates_v2')
        .update({ is_active: !t.is_active })
        .eq('id', t.id);
      if (error) throw error;
      setTemplates((prev) =>
        prev.map((x) => x.id === t.id ? { ...x, is_active: !t.is_active } : x)
      );
      notify.success(t.is_active ? 'Formulario desactivado' : 'Formulario activado');
    } catch (err: any) {
      notify.error('Error al cambiar estado');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Formularios de Alta</h2>
          <p className="text-sm text-gray-500">
            {templates.length} formulario{templates.length !== 1 ? 's' : ''} — gestionan los campos al publicar un aviso
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo formulario
        </button>
      </div>

      {/* Nota informativa */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
        <div>
          <strong>¿Cómo funciona el scope?</strong> El sistema busca el formulario más específico disponible:
          <span className="mx-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">Tipo</span>
          &gt;
          <span className="mx-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Subcategoría</span>
          &gt;
          <span className="mx-1 px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded text-xs font-semibold">Categoría</span>
          &gt;
          <span className="mx-1 px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">Global</span>
          . Si no hay uno más específico, usa el de categoría.
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
          />
        </div>
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.display_name}</option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
        >
          <option value="all">Todos</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando formularios...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">
              {templates.length === 0 ? 'No hay formularios creados' : 'Ninguno coincide con los filtros'}
            </p>
            {templates.length === 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Crear el primero
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Formulario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scope</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Campos</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Prioridad</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => (
                  <TemplateRow
                    key={t.id}
                    template={t as any}
                    categories={categories}
                    onDelete={handleDelete}
                    onDuplicate={(tmpl) => setDuplicating(tmpl)}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateFormModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadData(); }}
        />
      )}
      {duplicating && (
        <DuplicateModal
          source={duplicating}
          onClose={() => setDuplicating(null)}
          onDuplicated={() => { setDuplicating(null); loadData(); }}
        />
      )}
    </div>
  );
}
