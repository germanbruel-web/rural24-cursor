/**
 * HomeSectionBuilder — Admin CMS-A
 * CRUD para secciones dinámicas de la homepage.
 * Permite crear, editar, activar/pausar, reordenar y eliminar secciones.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Play, Pause, GripVertical,
  LayoutGrid, List, BarChart2, Image as ImageIcon, Rows,
  ChevronUp, ChevronDown, Loader2, X, AlertCircle
} from 'lucide-react';
import type { HomeSection, SectionType, CreateHomeSectionInput } from '@/services/v2/homeSectionsService';
import {
  getAllHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  toggleHomeSectionActive,
  reorderHomeSections
} from '@/services/v2/homeSectionsService';
import { supabase } from '@/services/supabaseClient';

// ---- Constantes ----

const SECTION_TYPES: { value: SectionType; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'featured_grid',      label: 'Grid Destacados',   desc: 'Grid de avisos destacados por categoría',             icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'category_carousel',  label: 'Carrusel Categoría',desc: 'Carrusel horizontal de avisos de una categoría',       icon: <Rows className="w-4 h-4" /> },
  { value: 'ad_list',            label: 'Lista de Avisos',   desc: 'Listado filtrado de avisos (por categoría/estado)',    icon: <List className="w-4 h-4" /> },
  { value: 'banner',             label: 'Banner',            desc: 'Banner publicitario desde banners_clean',              icon: <ImageIcon className="w-4 h-4" /> },
  { value: 'stats',              label: 'Estadísticas',      desc: 'Contadores de la plataforma (avisos, usuarios, etc.)', icon: <BarChart2 className="w-4 h-4" /> },
];

const TYPE_COLORS: Record<SectionType, string> = {
  featured_grid:     'bg-purple-100 text-purple-700',
  category_carousel: 'bg-blue-100 text-blue-700',
  ad_list:           'bg-brand-100 text-brand-700',
  banner:            'bg-amber-100 text-amber-700',
  stats:             'bg-gray-100 text-gray-700',
};

const INITIAL_FORM: CreateHomeSectionInput = {
  type: 'featured_grid',
  title: '',
  query_filter: {},
  display_config: { columns: 4, show_price: true },
  active_schedule: null,
  sort_order: 0,
  is_active: true,
};

interface CategoryOption { value: string; label: string }

// ---- Toast inline ----

interface Toast { id: number; type: 'error' | 'success'; message: string }
let _tid = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((type: Toast['type'], message: string) => {
    const id = ++_tid;
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, dismiss };
}

function ToastBar({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium min-w-[260px] ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-600 text-white'}`}>
          {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)}><X className="w-4 h-4 opacity-75 hover:opacity-100" /></button>
        </div>
      ))}
    </div>
  );
}

// ---- Helpers para JSONB editable ----

function JsonEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const [raw, setRaw] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState('');

  const handleChange = (text: string) => {
    setRaw(text);
    try {
      const parsed = JSON.parse(text);
      setError('');
      onChange(parsed);
    } catch {
      setError('JSON inválido');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={raw}
        onChange={e => handleChange(e.target.value)}
        rows={4}
        className={`w-full border rounded-lg px-3 py-2 font-mono text-xs ${error ? 'border-red-400' : 'border-gray-300'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ---- Componente principal ----

export default function HomeSectionBuilder() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [form, setForm] = useState<CreateHomeSectionInput>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const { toasts, add: addToast, dismiss } = useToasts();

  // Cargar categorías para el selector de query_filter.category_slug
  useEffect(() => {
    supabase
      .from('categories')
      .select('slug, display_name')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data?.length) {
          setCategories([
            { value: '', label: 'Todas las categorías' },
            ...data.map(c => ({ value: c.slug, label: c.display_name })),
          ]);
        }
      });
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setSections(await getAllHomeSections());
    } catch {
      addToast('error', 'Error cargando secciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...INITIAL_FORM, sort_order: (sections.length + 1) * 10 });
    setShowModal(true);
  };

  const openEdit = (s: HomeSection) => {
    setEditing(s);
    setForm({
      type:            s.type,
      title:           s.title,
      query_filter:    s.query_filter,
      display_config:  s.display_config,
      active_schedule: s.active_schedule,
      sort_order:      s.sort_order,
      is_active:       s.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (s: HomeSection) => {
    if (!confirm(`¿Eliminar sección "${s.title}"?`)) return;
    try {
      await deleteHomeSection(s.id);
      addToast('success', 'Sección eliminada');
      void load();
    } catch {
      addToast('error', 'Error eliminando sección');
    }
  };

  const handleToggle = async (s: HomeSection) => {
    try {
      await toggleHomeSectionActive(s.id, !s.is_active);
      void load();
    } catch {
      addToast('error', 'Error cambiando estado');
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    // Swap sort_order values
    const aOrder = next[idx].sort_order;
    const bOrder = next[target].sort_order;
    next[idx] = { ...next[idx], sort_order: bOrder };
    next[target] = { ...next[target], sort_order: aOrder };
    setSections(next.sort((a, b) => a.sort_order - b.sort_order));
    await reorderHomeSections([
      { id: next[idx].id, sort_order: next[idx].sort_order },
      { id: next[target].id, sort_order: next[target].sort_order },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { addToast('error', 'El título es requerido'); return; }
    setIsSaving(true);
    try {
      if (editing) {
        await updateHomeSection(editing.id, form);
        addToast('success', 'Sección actualizada');
      } else {
        await createHomeSection(form);
        addToast('success', 'Sección creada');
      }
      setShowModal(false);
      void load();
    } catch {
      addToast('error', 'Error guardando sección');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: leer/escribir category_slug dentro de query_filter
  const queryCategorySlug = (form.query_filter?.category_slug as string) ?? '';
  const setQueryCategorySlug = (val: string) =>
    setForm(f => ({ ...f, query_filter: { ...f.query_filter, category_slug: val || undefined } }));

  const queryLimit = (form.query_filter?.limit as number) ?? 8;
  const setQueryLimit = (val: number) =>
    setForm(f => ({ ...f, query_filter: { ...f.query_filter, limit: val } }));

  const queryFeaturedOnly = !!(form.query_filter?.featured_only);
  const setQueryFeaturedOnly = (val: boolean) =>
    setForm(f => ({ ...f, query_filter: { ...f.query_filter, featured_only: val || undefined } }));

  const displayColumns = (form.display_config?.columns as number) ?? 4;
  const setDisplayColumns = (val: number) =>
    setForm(f => ({ ...f, display_config: { ...f.display_config, columns: val } }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastBar toasts={toasts} dismiss={dismiss} />

      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Constructor de Homepage</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Secciones dinámicas de la página principal. El orden y estado de cada sección se aplica en tiempo real.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva sección
            </button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-500" />
            Cargando secciones...
          </div>
        ) : sections.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay secciones creadas.</p>
            <button onClick={openCreate} className="mt-3 text-brand-600 hover:underline text-sm">
              Crear la primera sección
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((s, idx) => {
              const typeInfo = SECTION_TYPES.find(t => t.value === s.type);
              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-lg shadow-sm border ${s.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    {/* Orden */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-400 text-center tabular-nums">{s.sort_order}</span>
                      <button
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === sections.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />

                    {/* Tipo badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium shrink-0 ${TYPE_COLORS[s.type]}`}>
                      {typeInfo?.icon}
                      {typeInfo?.label ?? s.type}
                    </span>

                    {/* Título y descripción */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{s.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {s.query_filter?.category_slug
                          ? `Cat: ${s.query_filter.category_slug}`
                          : 'Todas las categorías'}
                        {s.query_filter?.limit ? ` · Límite: ${s.query_filter.limit}` : ''}
                        {s.query_filter?.featured_only ? ' · Solo destacados' : ''}
                      </p>
                    </div>

                    {/* Estado */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${s.is_active ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.is_active ? 'Activa' : 'Pausada'}
                    </span>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(s)}
                        className={`p-1.5 rounded transition-colors ${s.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-brand-600 hover:bg-brand-50'}`}
                        title={s.is_active ? 'Pausar' : 'Activar'}
                      >
                        {s.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {editing ? 'Editar sección' : 'Nueva sección'}
                </h2>
                <button type="button" onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de sección *</label>
                  <div className="space-y-2">
                    {SECTION_TYPES.map(t => (
                      <label key={t.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="type"
                          value={t.value}
                          checked={form.type === t.value}
                          onChange={() => setForm(f => ({ ...f, type: t.value }))}
                          className="mt-1"
                        />
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-gray-500">{t.icon}</span>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{t.label}</p>
                            <p className="text-xs text-gray-500">{t.desc}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ej: Maquinaria Agrícola Destacada"
                    required
                  />
                </div>

                {/* Filtros básicos (section types que usan avisos) */}
                {['featured_grid', 'category_carousel', 'ad_list'].includes(form.type) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Filtros de contenido</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                        <select
                          value={queryCategorySlug}
                          onChange={e => setQueryCategorySlug(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {categories.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Límite de avisos</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={queryLimit}
                          onChange={e => setQueryLimit(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    {form.type !== 'category_carousel' && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={queryFeaturedOnly}
                          onChange={e => setQueryFeaturedOnly(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-gray-700">Solo avisos destacados</span>
                      </label>
                    )}
                  </div>
                )}

                {/* Display config básico */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Configuración visual</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Columnas</label>
                      <select
                        value={displayColumns}
                        onChange={e => setDisplayColumns(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {[2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n} columnas</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
                      <input
                        type="number"
                        value={form.sort_order}
                        onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        step={10}
                      />
                    </div>
                  </div>

                  {/* JSON avanzado colapsable */}
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
                      Configuración avanzada (JSON)
                    </summary>
                    <div className="mt-3 space-y-3">
                      <JsonEditor
                        label="query_filter"
                        value={form.query_filter ?? {}}
                        onChange={v => setForm(f => ({ ...f, query_filter: v }))}
                      />
                      <JsonEditor
                        label="display_config"
                        value={form.display_config ?? {}}
                        onChange={v => setForm(f => ({ ...f, display_config: v }))}
                      />
                    </div>
                  </details>
                </div>

                {/* Estado */}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-gray-700">Sección activa</span>
                </label>
              </div>

              <div className="border-t px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !form.title.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Guardar cambios' : 'Crear sección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
