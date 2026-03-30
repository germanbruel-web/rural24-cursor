/**
 * HomeSectionBuilder — Admin CMS-A
 * CRUD para secciones dinámicas de la homepage.
 * Permite crear, editar, activar/pausar, reordenar y eliminar secciones.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Play, Pause, GripVertical,
  LayoutGrid, List, BarChart2, Image as ImageIcon, Rows,
  ChevronUp, ChevronDown, Loader2, X, AlertCircle,
  Upload, ExternalLink, ChevronRight
} from 'lucide-react';
import { uploadsApi } from '@/services/api/uploads';
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
  { value: 'cta_cards',          label: 'Cards CTA',         desc: 'Cards editoriales con imagen, texto y filtro hacia resultados de búsqueda', icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'category_section',   label: 'Sección Categoría', desc: 'Sección completa: destacados + índice taxonómico con conteo de avisos',       icon: <List className="w-4 h-4" /> },
];

const TYPE_COLORS: Record<SectionType, string> = {
  featured_grid:     'bg-purple-100 text-purple-700',
  category_carousel: 'bg-blue-100 text-blue-700',
  ad_list:           'bg-brand-100 text-brand-700',
  banner:            'bg-amber-100 text-amber-700',
  stats:             'bg-gray-100 text-gray-700',
  cta_cards:         'bg-green-100 text-green-700',
  category_section:  'bg-teal-100 text-teal-700',
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

interface TaxOption { value: string; label: string }

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

// ---- cta_cards: tipos y constantes ----

interface CardConfig {
  id: string;
  image_url: string;
  label: string;
  title: string;
  subtitle: string;
  cta_label: string;
  filters: Record<string, string>;
}

const ARGENTINA_PROVINCES = [
  '', 'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

// ---- CardImageUploader ----

function CardImageUploader({
  url,
  onChange,
}: {
  url: string;
  onChange: (u: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const result = await uploadsApi.uploadImage(file, 'banners');
      onChange(result.url);
    } catch (e: any) {
      setError(e?.message ?? 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  if (url) {
    return (
      <div className="relative">
        <img src={url} alt="" className="w-full h-36 object-cover rounded-lg border border-gray-200" />
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 border border-gray-200"
        >
          <X className="w-4 h-4 text-red-500" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="relative flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors">
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-500">Subir imagen</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={handleInputChange}
        />
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ---- CardFilterBuilder ----

function CardFilterBuilder({
  filters,
  onChange,
  categories,
}: {
  filters: Record<string, string>;
  onChange: (f: Record<string, string>) => void;
  categories: TaxOption[];
}) {
  const [subcategories, setSubcategories] = useState<TaxOption[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<TaxOption[]>([]);
  const [catId, setCatId] = useState<string | null>(null);

  const cat = filters.cat ?? '';
  const sub = filters.sub ?? '';
  const subsub = filters.subsub ?? '';
  const prov = filters.prov ?? '';

  const handleCatChange = async (val: string) => {
    setSubcategories([]);
    setSubSubcategories([]);
    setCatId(null);
    onChange({ cat: val, sub: '', subsub: '', prov });
    if (!val) return;
    const { data: catRow } = await supabase.from('categories').select('id').eq('slug', val).single();
    if (!catRow?.id) return;
    setCatId(catRow.id);
    const { data: subs } = await supabase
      .from('subcategories')
      .select('slug, display_name')
      .eq('category_id', catRow.id)
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order');
    if (subs?.length) {
      setSubcategories([
        { value: '', label: 'Todas las subcategorías' },
        ...subs.map((s: any) => ({ value: s.slug, label: s.display_name })),
      ]);
    }
  };

  const handleSubChange = async (val: string) => {
    setSubSubcategories([]);
    onChange({ cat, sub: val, subsub: '', prov });
    if (!val) return;
    let q = supabase.from('subcategories').select('id').eq('slug', val).is('parent_id', null);
    if (catId) q = q.eq('category_id', catId);
    const { data: subcat } = await q.maybeSingle();
    if (!subcat?.id) return;
    const { data: subsubs } = await supabase
      .from('subcategories')
      .select('slug, display_name')
      .eq('parent_id', subcat.id)
      .eq('is_active', true)
      .order('sort_order');
    if (subsubs?.length) {
      setSubSubcategories([
        { value: '', label: 'Todas las sub-subcategorías' },
        ...subsubs.map((s: any) => ({ value: s.slug, label: s.display_name })),
      ]);
    }
  };

  const buildPreviewUrl = () => {
    const params: string[] = [];
    if (cat) params.push(`cat=${encodeURIComponent(cat)}`);
    if (sub) params.push(`sub=${encodeURIComponent(sub)}`);
    if (subsub) params.push(`subsub=${encodeURIComponent(subsub)}`);
    if (prov) params.push(`prov=${encodeURIComponent(prov)}`);
    const qs = params.length ? '?' + params.join('&') : '';
    return `${window.location.origin}/#/search${qs}`;
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs font-semibold text-gray-600">Filtros del destino</p>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Categoría</label>
        <select
          value={cat}
          onChange={e => void handleCatChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {subcategories.length > 1 && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Subcategoría</label>
          <select
            value={sub}
            onChange={e => void handleSubChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {subcategories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {subSubcategories.length > 1 && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sub-subcategoría</label>
          <select
            value={subsub}
            onChange={e => onChange({ cat, sub, subsub: e.target.value, prov })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {subSubcategories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">Provincia</label>
        <select
          value={prov}
          onChange={e => onChange({ cat, sub, subsub, prov: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todas las provincias</option>
          {ARGENTINA_PROVINCES.filter(p => p !== '').map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="pt-1 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-1">URL generada</p>
        <code className="block text-xs bg-brand-50 text-brand-700 rounded px-2 py-1.5 break-all">
          {buildPreviewUrl()}
        </code>
        <a
          href={buildPreviewUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
        >
          <ExternalLink className="w-3 h-3" />
          Probar
        </a>
      </div>
    </div>
  );
}

// ---- CardEditorItem ----

function CardEditorItem({
  card,
  isExpanded,
  onToggle,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  categories,
}: {
  card: CardConfig;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<CardConfig>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  categories: TaxOption[];
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Collapsed header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-white">
        {card.image_url ? (
          <img src={card.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4 text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {card.label && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 leading-none mb-0.5">
              {card.label}
            </p>
          )}
          <p className="text-sm font-medium text-gray-800 truncate">
            {card.title || <span className="text-gray-400 italic font-normal">Sin título</span>}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {isExpanded && (
        <div className="px-3 pb-4 pt-2 border-t border-gray-100 space-y-3 bg-gray-50">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Imagen</label>
            <CardImageUploader
              url={card.image_url}
              onChange={url => onChange({ image_url: url })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Etiqueta <span className="text-gray-400">(ej: INMOBILIARIA RURAL)</span>
            </label>
            <input
              type="text"
              value={card.label}
              onChange={e => onChange({ label: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="ej: INMOBILIARIA RURAL"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={card.title}
              onChange={e => onChange({ title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="ej: Campos y chacras en todo el país"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Subtítulo <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={card.subtitle}
              onChange={e => onChange({ subtitle: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="ej: Propiedades rurales con todo el potencial"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Texto del botón CTA</label>
            <input
              type="text"
              value={card.cta_label}
              onChange={e => onChange({ cta_label: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ver todos"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Destino del card</label>
            <CardFilterBuilder
              filters={card.filters}
              onChange={f => onChange({ filters: f })}
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---- CardBuilder ----

function CardBuilder({
  cards,
  onChange,
  categories,
}: {
  cards: CardConfig[];
  onChange: (c: CardConfig[]) => void;
  categories: TaxOption[];
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const addCard = () => {
    const newCard: CardConfig = {
      id: crypto.randomUUID(),
      image_url: '',
      label: '',
      title: '',
      subtitle: '',
      cta_label: 'Ver todos',
      filters: {},
    };
    const updated = [...cards, newCard];
    onChange(updated);
    setExpanded(prev => ({ ...prev, [newCard.id]: true }));
  };

  const updateCard = (id: string, patch: Partial<CardConfig>) => {
    onChange(cards.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const removeCard = (id: string) => {
    onChange(cards.filter(c => c.id !== id));
  };

  const moveCard = (idx: number, dir: -1 | 1) => {
    const next = [...cards];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {cards.map((card, idx) => (
        <CardEditorItem
          key={card.id}
          card={card}
          isExpanded={!!expanded[card.id]}
          onToggle={() => toggle(card.id)}
          onChange={patch => updateCard(card.id, patch)}
          onRemove={() => removeCard(card.id)}
          onMoveUp={() => moveCard(idx, -1)}
          onMoveDown={() => moveCard(idx, 1)}
          isFirst={idx === 0}
          isLast={idx === cards.length - 1}
          categories={categories}
        />
      ))}
      <button
        type="button"
        onClick={addCard}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar card
      </button>
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
  const [categories, setCategories] = useState<TaxOption[]>([]);
  const [subcategories, setSubcategories] = useState<TaxOption[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<TaxOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
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
    setSubcategories([]);
    setSubSubcategories([]);
    setSelectedCategoryId(null);
    setForm({ ...INITIAL_FORM, sort_order: (sections.length + 1) * 10 });
    setShowModal(true);
  };

  const openEdit = async (s: HomeSection) => {
    setEditing(s);
    setSubcategories([]);
    setSubSubcategories([]);
    const newForm = {
      type:            s.type,
      title:           s.title,
      query_filter:    s.query_filter,
      display_config:  s.display_config,
      active_schedule: s.active_schedule,
      sort_order:      s.sort_order,
      is_active:       s.is_active,
    };
    setForm(newForm);
    setShowModal(true);

    // Precargar subcategorías si hay filtros guardados
    const catSlug = s.query_filter?.category_slug as string | undefined;
    const subSlug = s.query_filter?.subcategory_slug as string | undefined;
    if (catSlug) {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', catSlug).single();
      if (cat?.id) {
        setSelectedCategoryId(cat.id);
        const { data: subs } = await supabase
          .from('subcategories')
          .select('slug, display_name')
          .eq('category_id', cat.id)
          .is('parent_id', null)
          .order('sort_order');
        setSubcategories([
          { value: '', label: 'Todas las subcategorías' },
          ...(subs ?? []).map((s: any) => ({ value: s.slug, label: s.display_name })),
        ]);
        if (subSlug) {
          const { data: subcat } = await supabase
            .from('subcategories').select('id')
            .eq('slug', subSlug).eq('category_id', cat.id).is('parent_id', null).maybeSingle();
          if (subcat?.id) {
            const { data: subsubs } = await supabase
              .from('subcategories')
              .select('slug, display_name')
              .eq('parent_id', subcat.id)
              .order('sort_order');
            if (subsubs && subsubs.length > 0) {
              setSubSubcategories([
                { value: '', label: 'Todas las sub-subcategorías' },
                ...subsubs.map((s: any) => ({ value: s.slug, label: s.display_name })),
              ]);
            }
          }
        }
      }
    }
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

  // Helpers: leer/escribir fields dentro de query_filter
  const queryCategorySlug = (form.query_filter?.category_slug as string) ?? '';
  const querySubcategorySlug = (form.query_filter?.subcategory_slug as string) ?? '';
  const querySubSubcategorySlug = (form.query_filter?.sub_subcategory_slug as string) ?? '';
  const queryCategorySlugs = (form.query_filter?.category_slugs as string[]) ?? [];
  const queryExcludeSlugs  = (form.query_filter?.exclude_category_slugs as string[]) ?? [];

  const toggleCategorySlug = (slug: string, include: boolean) => {
    if (include) {
      // Incluir: agrega a category_slugs, limpia exclude
      const updated = queryCategorySlugs.includes(slug)
        ? queryCategorySlugs.filter(s => s !== slug)
        : [...queryCategorySlugs, slug];
      setForm(f => ({
        ...f,
        query_filter: {
          ...f.query_filter,
          category_slugs: updated.length ? updated : undefined,
          exclude_category_slugs: undefined,
        },
      }));
    } else {
      // Excluir: agrega a exclude_category_slugs, limpia include
      const updated = queryExcludeSlugs.includes(slug)
        ? queryExcludeSlugs.filter(s => s !== slug)
        : [...queryExcludeSlugs, slug];
      setForm(f => ({
        ...f,
        query_filter: {
          ...f.query_filter,
          exclude_category_slugs: updated.length ? updated : undefined,
          category_slugs: undefined,
        },
      }));
    }
  };

  const setQueryCategorySlug = async (val: string) => {
    setSubcategories([]);
    setSubSubcategories([]);
    setSelectedCategoryId(null);
    setForm(f => ({
      ...f,
      query_filter: {
        ...f.query_filter,
        category_slug: val || undefined,
        subcategory_slug: undefined,
        sub_subcategory_slug: undefined,
      },
    }));
    if (!val) return;
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', val).single();
    if (!cat?.id) return;
    setSelectedCategoryId(cat.id);
    const { data: subs } = await supabase
      .from('subcategories')
      .select('slug, display_name')
      .eq('category_id', cat.id)
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order');
    if (subs && subs.length > 0) {
      setSubcategories([
        { value: '', label: 'Todas las subcategorías' },
        ...subs.map((s: any) => ({ value: s.slug, label: s.display_name })),
      ]);
    }
  };

  const setQuerySubcategorySlug = async (val: string) => {
    setSubSubcategories([]);
    setForm(f => ({
      ...f,
      query_filter: {
        ...f.query_filter,
        subcategory_slug: val || undefined,
        sub_subcategory_slug: undefined,
      },
    }));
    if (!val) return;
    // Scope el lookup por category_id para evitar colisiones de slug entre categorías
    let q = supabase.from('subcategories').select('id').eq('slug', val).is('parent_id', null);
    if (selectedCategoryId) q = q.eq('category_id', selectedCategoryId);
    const { data: subcat } = await q.maybeSingle();
    if (!subcat?.id) return;
    const { data: subsubs } = await supabase
      .from('subcategories')
      .select('slug, display_name')
      .eq('parent_id', subcat.id)
      .eq('is_active', true)
      .order('sort_order');
    if (subsubs && subsubs.length > 0) {
      setSubSubcategories([
        { value: '', label: 'Todas las sub-subcategorías' },
        ...subsubs.map((s: any) => ({ value: s.slug, label: s.display_name })),
      ]);
    }
  };

  const setQuerySubSubcategorySlug = (val: string) =>
    setForm(f => ({ ...f, query_filter: { ...f.query_filter, sub_subcategory_slug: val || undefined } }));

  // Filtro de atributo (L4 efectivo: ads.attributes @> {field: value})
  // Permite estado parcial (campo sin valor) para que el input no se resetee en cada keystroke
  const attrFilter = (form.query_filter?.attribute_filter ?? {}) as Record<string, string>;
  const attrField  = Object.keys(attrFilter)[0] ?? '';
  const attrValue  = attrField ? (attrFilter[attrField] ?? '') : '';
  const setAttrFilter = (field: string, value: string) => {
    if (!field && !value) {
      // Ambos vacíos → limpiar
      setForm(f => ({ ...f, query_filter: { ...f.query_filter, attribute_filter: undefined } }));
    } else {
      // Permite parcial: campo con valor vacío es válido mientras el usuario escribe
      const af: Record<string, string> = {};
      if (field) af[field] = value;
      setForm(f => ({ ...f, query_filter: { ...f.query_filter, attribute_filter: af } }));
    }
  };

  const queryLimit = (form.query_filter?.limit as number) ?? 8;
  const setQueryLimit = (val: number) =>
    setForm(f => ({ ...f, query_filter: { ...f.query_filter, limit: val } }));

  const queryFeaturedOnly = !!(form.query_filter?.featured_only);
  const setQueryFeaturedOnly = (val: boolean) =>
    setForm(f => ({ ...f, query_filter: { ...f.query_filter, featured_only: val || undefined } }));

  const displayColumns     = (form.display_config?.columns as number) ?? 4;
  const displayBgColor     = (form.display_config?.bg_color as string) ?? 'white';
  const displayTitleSize   = (form.display_config?.title_size as string) ?? 'xl';
  const displayTitleColor  = (form.display_config?.title_color as string) ?? 'gray-900';
  const displaySubtitle    = (form.display_config?.subtitle as string) ?? '';
  const displaySubColor    = (form.display_config?.subtitle_color as string) ?? 'gray-500';
  const displayShowMore    = !!(form.display_config?.show_more);
  const displayShowMoreLabel = (form.display_config?.show_more_label as string) ?? 'Ver más';
  const displayShowMoreAuto  = !!(form.display_config?.show_more_auto);
  const displayShowMoreUrl   = (form.display_config?.show_more_url as string) ?? '';

  const setDC = (patch: Record<string, unknown>) =>
    setForm(f => ({ ...f, display_config: { ...f.display_config, ...patch } }));
  const setDisplayColumns = (val: number) => setDC({ columns: val });

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
                        {s.type === 'cta_cards' ? (
                          `${((s.display_config?.cards as any[]) ?? []).length} cards`
                        ) : s.type === 'category_section' ? (
                          <>
                            {s.query_filter?.category_slug ?? 'Sin categoría'}
                            {s.query_filter?.limit ? ` · ${s.query_filter.limit} avisos` : ''}
                            {s.display_config?.show_taxonomy_index ? ' · índice taxonómico' : ''}
                          </>
                        ) : (
                          <>
                            {s.query_filter?.category_slug
                              ? `Cat: ${s.query_filter.category_slug}`
                              : (s.query_filter?.category_slugs as string[] | undefined)?.length
                                ? `Incluye: ${(s.query_filter.category_slugs as string[]).join(', ')}`
                                : (s.query_filter?.exclude_category_slugs as string[] | undefined)?.length
                                  ? `Excluye: ${(s.query_filter.exclude_category_slugs as string[]).join(', ')}`
                                  : 'Todas las categorías'}
                            {s.query_filter?.subcategory_slug ? ` › ${s.query_filter.subcategory_slug}` : ''}
                            {s.query_filter?.sub_subcategory_slug ? ` › ${s.query_filter.sub_subcategory_slug}` : ''}
                            {s.query_filter?.limit ? ` · Límite: ${s.query_filter.limit}` : ''}
                            {s.query_filter?.featured_only ? ' · Solo destacados' : ''}
                          </>
                        )}
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

                {/* Banner — placement */}
                {form.type === 'banner' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Configuración del banner</h3>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Placement (fuente desde Gestor de Banners)</label>
                      <select
                        value={(form.query_filter?.banner_placement as string) ?? ''}
                        onChange={e => setForm(f => ({ ...f, query_filter: { ...f.query_filter, banner_placement: e.target.value || undefined } }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Seleccionar placement...</option>
                        <option value="hero_vip">Hero VIP (desktop 1100×200 + mobile 480×100)</option>
                        <option value="category_carousel">Carrusel Categorías (650×100)</option>
                        <option value="results_intercalated">Intercalado Resultados (650×100)</option>
                        <option value="results_below_filter">Debajo del Filtro (280×250)</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        Se muestra el primer banner activo con ese placement en Gestor de Banners.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cards builder — solo para cta_cards */}
                {form.type === 'cta_cards' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Cards</h3>
                    <CardBuilder
                      cards={(form.display_config?.cards as CardConfig[]) ?? []}
                      onChange={cards => setDC({ cards })}
                      categories={categories}
                    />
                  </div>
                )}

                {/* Sección Categoría — config específica */}
                {form.type === 'category_section' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Configuración de categoría</h3>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Categoría (L1) *</label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Avisos destacados a mostrar</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={queryLimit}
                          onChange={e => setQueryLimit(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
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
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={queryFeaturedOnly}
                        onChange={e => setQueryFeaturedOnly(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-700">Solo avisos destacados</span>
                    </label>

                    <div className="space-y-3 pt-1 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600">Banner publicitario de la sección</p>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Placement (desde Gestor de Banners)</label>
                        <select
                          value={(form.query_filter?.banner_placement as string) ?? ''}
                          onChange={e => setForm(f => ({ ...f, query_filter: { ...f.query_filter, banner_placement: e.target.value || undefined } }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="">Sin banner</option>
                          <option value="hero_vip">Hero VIP (desktop 1100×200 + mobile 480×100)</option>
                          <option value="category_carousel">Carrusel Categorías (650×100)</option>
                          <option value="results_intercalated">Intercalado Resultados (650×100)</option>
                          <option value="results_below_filter">Debajo del Filtro (280×250)</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                          Se muestra el primer banner activo de ese placement que coincida con la categoría seleccionada.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600">Índice de subcategorías</p>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!(form.display_config?.show_taxonomy_index)}
                          onChange={e => setDC({ show_taxonomy_index: e.target.checked || undefined })}
                          className="rounded"
                        />
                        <span className="text-gray-700">Mostrar índice de subcategorías al pie</span>
                      </label>

                      {!!(form.display_config?.show_taxonomy_index) && (
                        <label className="ml-6 flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!(form.display_config?.show_only_with_ads)}
                            onChange={e => setDC({ show_only_with_ads: e.target.checked || undefined })}
                            className="rounded"
                          />
                          <span className="text-gray-700">Ocultar subcategorías sin avisos</span>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Filtros básicos (section types que usan avisos) */}
                {['featured_grid', 'category_carousel', 'ad_list'].includes(form.type) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Filtros de contenido</h3>

                    {/* Taxonomía en cascada */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Categoría (L1)</label>
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

                    {/* Multi-categoría: solo visible cuando "Todas las categorías" está seleccionada */}
                    {!queryCategorySlug && (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-600">Filtro de categorías</p>
                          {(queryCategorySlugs.length > 0 || queryExcludeSlugs.length > 0) && (
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, query_filter: { ...f.query_filter, category_slugs: undefined, exclude_category_slugs: undefined } }))}
                              className="text-[11px] text-red-500 hover:text-red-700"
                            >
                              Limpiar
                            </button>
                          )}
                        </div>

                        {/* Modo activo: include o exclude */}
                        {queryCategorySlugs.length === 0 && queryExcludeSlugs.length === 0 && (
                          <p className="text-[11px] text-gray-400">Seleccioná categorías para incluir o excluir de esta sección.</p>
                        )}

                        <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                          {categories.filter(c => c.value).map(c => {
                            const isIncluded = queryCategorySlugs.includes(c.value);
                            const isExcluded = queryExcludeSlugs.includes(c.value);
                            const modeIsInclude = queryCategorySlugs.length > 0;
                            const modeIsExclude = queryExcludeSlugs.length > 0;

                            return (
                              <div key={c.value} className="flex items-center gap-2 py-0.5">
                                <span className="flex-1 text-sm text-gray-700">{c.label}</span>
                                {/* Botón incluir — deshabilitado si modo excluir activo */}
                                {!modeIsExclude && (
                                  <button
                                    type="button"
                                    onClick={() => toggleCategorySlug(c.value, true)}
                                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                                      isIncluded
                                        ? 'bg-brand-500 text-white border-brand-500'
                                        : 'text-gray-400 border-gray-200 hover:border-brand-400 hover:text-brand-600'
                                    }`}
                                  >
                                    {isIncluded ? '✓ incluir' : '+ incluir'}
                                  </button>
                                )}
                                {/* Botón excluir — deshabilitado si modo incluir activo */}
                                {!modeIsInclude && (
                                  <button
                                    type="button"
                                    onClick={() => toggleCategorySlug(c.value, false)}
                                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                                      isExcluded
                                        ? 'bg-red-500 text-white border-red-500'
                                        : 'text-gray-400 border-gray-200 hover:border-red-400 hover:text-red-600'
                                    }`}
                                  >
                                    {isExcluded ? '✗ excluir' : '− excluir'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {queryCategorySlugs.length > 0 && (
                          <p className="text-[11px] text-brand-600 font-medium">
                            Mostrando solo: {queryCategorySlugs.join(', ')}
                          </p>
                        )}
                        {queryExcludeSlugs.length > 0 && (
                          <p className="text-[11px] text-red-500 font-medium">
                            Excluyendo: {queryExcludeSlugs.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {subcategories.length > 1 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Subcategoría (L2)</label>
                        <select
                          value={querySubcategorySlug}
                          onChange={e => setQuerySubcategorySlug(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {subcategories.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {subSubcategories.length > 1 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sub-subcategoría (L3)</label>
                        <select
                          value={querySubSubcategorySlug}
                          onChange={e => setQuerySubSubcategorySlug(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {subSubcategories.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Filtro L4: atributo (razas, marcas, tipos, etc.) */}
                    {(queryCategorySlug) && (
                      <div className="space-y-2 pt-1 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-gray-600">Filtro de atributo (Raza / Marca / Tipo / etc.)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Campo (slug del atributo)</label>
                            <input
                              type="text"
                              value={attrField}
                              onChange={e => setAttrFilter(e.target.value, attrValue)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                              placeholder="ej: raza"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Valor</label>
                            <input
                              type="text"
                              value={attrValue}
                              onChange={e => setAttrFilter(attrField, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              placeholder="ej: angus"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">
                          El slug del campo se ve en Admin › Formularios. El valor debe coincidir exactamente con lo ingresado en el aviso.
                        </p>
                      </div>
                    )}

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

                {/* Display config */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Configuración visual</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Columnas — solo para tipos de avisos (category_section tiene su propio selector arriba) */}
                    {['featured_grid', 'category_carousel', 'ad_list'].includes(form.type) && (
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
                    )}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fondo de sección</label>
                      <select
                        value={displayBgColor}
                        onChange={e => setDC({ bg_color: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="white">Blanco</option>
                        <option value="gray-50">Gris claro</option>
                        <option value="brand-50">Brand claro</option>
                        <option value="brand-600">Brand (azul/verde)</option>
                        <option value="gray-900">Oscuro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tamaño de título</label>
                      <select
                        value={displayTitleSize}
                        onChange={e => setDC({ title_size: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="sm">Pequeño</option>
                        <option value="md">Mediano</option>
                        <option value="lg">Grande</option>
                        <option value="xl">Extra grande</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Color de título</label>
                      <select
                        value={displayTitleColor}
                        onChange={e => setDC({ title_color: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="gray-900">Oscuro</option>
                        <option value="brand-600">Brand</option>
                        <option value="white">Blanco (para fondos oscuros)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Color de subtítulo</label>
                      <select
                        value={displaySubColor}
                        onChange={e => setDC({ subtitle_color: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="gray-500">Gris</option>
                        <option value="gray-300">Gris claro</option>
                        <option value="white">Blanco</option>
                        <option value="brand-600">Brand</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subtítulo / leyenda</label>
                    <input
                      type="text"
                      value={displaySubtitle}
                      onChange={e => setDC({ subtitle: e.target.value || undefined })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Ej: Los mejores animales seleccionados esta semana"
                    />
                  </div>

                  {/* Botón Ver más */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={displayShowMore}
                        onChange={e => setDC({ show_more: e.target.checked || undefined })}
                        className="rounded"
                      />
                      <span className="text-gray-700 font-medium">Mostrar botón "Ver más"</span>
                    </label>

                    {displayShowMore && (
                      <div className="ml-6 space-y-3 border-l-2 border-gray-100 pl-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Etiqueta del botón</label>
                          <input
                            type="text"
                            value={displayShowMoreLabel}
                            onChange={e => setDC({ show_more_label: e.target.value || undefined })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            placeholder="Ver más"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Destino del botón</label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="radio"
                                name="show_more_mode"
                                checked={displayShowMoreAuto}
                                onChange={() => setDC({ show_more_auto: true, show_more_url: undefined })}
                              />
                              <span className="text-gray-700">Automático (buscar por categoría/subcategoría seleccionada)</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="radio"
                                name="show_more_mode"
                                checked={!displayShowMoreAuto}
                                onChange={() => setDC({ show_more_auto: undefined })}
                              />
                              <span className="text-gray-700">URL manual</span>
                            </label>
                          </div>
                        </div>
                        {!displayShowMoreAuto && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">URL destino</label>
                            <input
                              type="text"
                              value={displayShowMoreUrl}
                              onChange={e => setDC({ show_more_url: e.target.value || undefined })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                              placeholder="#/search?cat=hacienda"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* JSON avanzado colapsable */}
                  <details>
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
