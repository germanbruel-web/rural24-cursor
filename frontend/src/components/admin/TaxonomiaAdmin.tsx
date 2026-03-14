// ============================================================
// TAXONOMÍA ADMIN — Sprint 8C
// Gestión visual de 4 niveles: Categoría → Sub → Tipo → Subtipo
// Con toggles ACTIVO / FILTRO, bulk paste, inline edit, preview
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  Plus,
  Check,
  X,
  Filter,
  Eye,
  Upload,
  Edit2,
  FolderOpen,
  Folder,
  Tag,
  Loader2,
  ArrowRight,
  LayoutGrid,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import type { Category, Subcategory } from '../../types/v2';
import { notify } from '../../utils/notifications';

// ============================================================
// TYPES
// ============================================================

interface TaxCategory extends Category {
  is_filter: boolean;
}

interface TaxSub extends Subcategory {
  is_filter: boolean;
}

// ============================================================
// HELPERS
// ============================================================

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const LEVEL_LABELS = ['Subcategorías', 'Tipos', 'Subtipos', 'Variantes'];

// ============================================================
// PREVIEW MODAL — simula wizard Step 1
// ============================================================
const PreviewModal: React.FC<{
  category: TaxCategory;
  allSubs: TaxSub[];
  onClose: () => void;
}> = ({ category, allSubs, onClose }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const l2 = allSubs.filter(s => !s.parent_id && s.is_active);

  function toggle(id: string) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function renderLevel(nodes: TaxSub[], depth = 0): React.ReactNode {
    return nodes.map(node => {
      const children = allSubs.filter(s => s.parent_id === node.id && s.is_active);
      const hasChildren = children.length > 0;
      const isExpanded = expanded.has(node.id);
      const indent = depth * 16;

      return (
        <div key={node.id}>
          <button
            onClick={() => hasChildren ? toggle(node.id) : undefined}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border transition-all mb-1 ${
              hasChildren
                ? 'border-brand-200 hover:border-brand-400 hover:bg-brand-50'
                : 'border-gray-200 hover:border-brand-400 hover:bg-brand-50'
            }`}
            style={{ marginLeft: indent }}
          >
            {hasChildren && (
              <ChevronRight
                className={`w-4 h-4 text-brand-500 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            )}
            {!hasChildren && <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            <span className={`text-sm font-medium ${hasChildren ? 'text-gray-800' : 'text-gray-700'}`}>
              {node.display_name}
            </span>
            {node.is_filter && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">filtro</span>
            )}
          </button>
          {hasChildren && isExpanded && renderLevel(children, depth + 1)}
        </div>
      );
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Vista previa — Wizard Step 1</h3>
            <p className="text-sm text-gray-500 mt-0.5">{category.display_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-3">Subcategorías activas</p>
          {l2.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No hay subcategorías activas</p>
          ) : (
            renderLevel(l2)
          )}
        </div>
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500">
            Nodos con <span className="font-medium text-blue-600">filtro</span> aparecerán en el buscador.
            Solo las hojas (sin hijos) avanzan al Step 2.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CHILDREN TABLE — tabla Excel con toggles inline
// ============================================================
const ChildrenTable: React.FC<{
  children: TaxSub[];
  levelLabel: string;
  canDrillIn: boolean;
  onDrillIn: (sub: TaxSub) => void;
  onToggleActive: (sub: TaxSub) => void;
  onToggleFilter: (sub: TaxSub) => void;
  onStartEdit: (sub: TaxSub) => void;
  onDelete: (sub: TaxSub) => void;
  editingId: string | null;
  editValue: string;
  onEditChange: (v: string) => void;
  onEditSave: (sub: TaxSub) => void;
  onEditCancel: () => void;
}> = ({
  children,
  levelLabel,
  canDrillIn,
  onDrillIn,
  onToggleActive,
  onToggleFilter,
  onStartEdit,
  onDelete,
  editingId,
  editValue,
  onEditChange,
  onEditSave,
  onEditCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  if (children.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay {levelLabel.toLowerCase()} aún</p>
        <p className="text-xs mt-1">Usá "+ Nueva" o "Bulk Paste" para agregar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-full">
              Nombre
            </th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
              Activo
            </th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
              Filtro
            </th>
            {canDrillIn && (
              <th className="py-2 px-3 w-8"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {children.map(sub => (
            <tr
              key={sub.id}
              className={`border-b border-gray-50 hover:bg-gray-50 group transition-colors ${!sub.is_active ? 'opacity-50' : ''}`}
            >
              {/* Nombre */}
              <td className="py-2 px-3">
                {editingId === sub.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={e => onEditChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') onEditSave(sub);
                        if (e.key === 'Escape') onEditCancel();
                      }}
                      className="flex-1 px-2 py-1 border border-brand-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button onClick={() => onEditSave(sub)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={onEditCancel} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{sub.display_name}</span>
                    <span className="hidden group-hover:block text-xs text-gray-400">({sub.slug})</span>
                    <div className="hidden group-hover:flex items-center gap-0.5 ml-auto">
                      <button
                        onClick={() => onStartEdit(sub)}
                        className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(sub)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </td>

              {/* Activo */}
              <td className="py-2 px-3 text-center">
                <button
                  onClick={() => onToggleActive(sub)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${sub.is_active ? 'bg-brand-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${sub.is_active ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </td>

              {/* Filtro */}
              <td className="py-2 px-3 text-center">
                <button
                  onClick={() => onToggleFilter(sub)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    sub.is_filter
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  {sub.is_filter ? 'Sí' : 'No'}
                </button>
              </td>

              {/* Drill in */}
              {canDrillIn && (
                <td className="py-2 px-3">
                  <button
                    onClick={() => onDrillIn(sub)}
                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                    title={`Ver hijos de "${sub.display_name}"`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// BULK PASTE PANEL
// ============================================================
const BulkPastePanel: React.FC<{
  text: string;
  parsed: string[];
  saving: boolean;
  onChange: (text: string) => void;
  onParse: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ text, parsed, saving, onChange, onParse, onSave, onCancel }) => (
  <div className="border border-dashed border-brand-300 rounded-xl p-4 bg-brand-50/30 space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
      <Upload className="w-4 h-4" />
      Bulk Paste — una opción por línea
    </div>
    <textarea
      value={text}
      onChange={e => {
        onChange(e.target.value);
        onParse(e.target.value);
      }}
      placeholder={'Agrícola de tracción doble\nAgrícola de tracción simple\nOruga\nArticulado\n...'}
      rows={8}
      className="w-full px-3 py-2 text-sm border border-brand-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono resize-y"
    />
    {parsed.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {parsed.slice(0, 10).map((item, i) => (
          <span key={i} className="px-2 py-0.5 bg-white border border-brand-200 text-brand-700 text-xs rounded">
            {item}
          </span>
        ))}
        {parsed.length > 10 && (
          <span className="px-2 py-0.5 text-gray-500 text-xs">+{parsed.length - 10} más</span>
        )}
      </div>
    )}
    <div className="flex items-center gap-3">
      <button
        onClick={onSave}
        disabled={parsed.length === 0 || saving}
        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Importar {parsed.length > 0 ? `${parsed.length} ítems` : ''}
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 text-gray-600 hover:bg-gray-100 text-sm font-medium rounded-lg transition-colors"
      >
        Cancelar
      </button>
    </div>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
export const TaxonomiaAdmin: React.FC = () => {
  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [allSubs, setAllSubs] = useState<TaxSub[]>([]);
  const [navStack, setNavStack] = useState<TaxSub[]>([]);
  const [loadingCat, setLoadingCat] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // New single item
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [savingNew, setSavingNew] = useState(false);
  const newInputRef = useRef<HTMLInputElement>(null);

  // Bulk paste
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkParsed, setBulkParsed] = useState<string[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // New category
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Edit category
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatValue, setEditCatValue] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (showNewForm) setTimeout(() => newInputRef.current?.focus(), 50);
  }, [showNewForm]);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    setCategories(data || []);
  }

  async function selectCategory(catId: string) {
    if (selectedCatId === catId) return;
    setSelectedCatId(catId);
    setNavStack([]);
    setShowBulk(false);
    setShowNewForm(false);
    setEditingId(null);
    setLoadingCat(true);
    const { data } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', catId)
      .order('sort_order', { ascending: true });
    setAllSubs(data || []);
    setLoadingCat(false);
  }

  // ── Derived ─────────────────────────────────────────────
  const currentParentId = navStack.length > 0 ? navStack[navStack.length - 1].id : null;
  const currentChildren = allSubs.filter(s =>
    currentParentId ? s.parent_id === currentParentId : !s.parent_id
  );
  const currentLevelLabel = LEVEL_LABELS[navStack.length] ?? 'Ítems';
  const selectedCat = categories.find(c => c.id === selectedCatId);
  // Cap at L4 (L1=cat, L2=sub, L3=tipo, L4=subtipo)
  const canDrillIn = navStack.length < 3;

  // ── Navigation ──────────────────────────────────────────
  function navigateInto(sub: TaxSub) {
    setNavStack(prev => [...prev, sub]);
    setShowBulk(false);
    setShowNewForm(false);
    setEditingId(null);
  }

  function navigateTo(idx: number) {
    setNavStack(prev => prev.slice(0, idx));
    setShowBulk(false);
    setShowNewForm(false);
    setEditingId(null);
  }

  // ── Subcategory toggles ──────────────────────────────────
  async function toggleActive(sub: TaxSub) {
    const newVal = !sub.is_active;
    const { error } = await supabase.from('subcategories').update({ is_active: newVal }).eq('id', sub.id);
    if (!error) setAllSubs(prev => prev.map(s => s.id === sub.id ? { ...s, is_active: newVal } : s));
  }

  async function toggleFilter(sub: TaxSub) {
    const newVal = !sub.is_filter;
    const { error } = await supabase.from('subcategories').update({ is_filter: newVal }).eq('id', sub.id);
    if (!error) setAllSubs(prev => prev.map(s => s.id === sub.id ? { ...s, is_filter: newVal } : s));
  }

  // ── Inline edit subcategory ──────────────────────────────
  function startEdit(sub: TaxSub) {
    setEditingId(sub.id);
    setEditValue(sub.display_name);
  }

  async function saveEdit(sub: TaxSub) {
    if (!editValue.trim()) return;
    const slug = toSlug(editValue);
    const { error } = await supabase
      .from('subcategories')
      .update({ display_name: editValue.trim(), slug, name: slug })
      .eq('id', sub.id);
    if (!error) {
      setAllSubs(prev => prev.map(s =>
        s.id === sub.id ? { ...s, display_name: editValue.trim(), slug, name: slug } : s
      ));
    }
    setEditingId(null);
  }

  // ── Delete subcategory ───────────────────────────────────
  async function deleteSub(sub: TaxSub) {
    const tieneHijos = allSubs.some(s => s.parent_id === sub.id);
    if (tieneHijos) {
      notify.error(`"${sub.display_name}" tiene ítems hijos. Eliminá primero los hijos.`);
      return;
    }
    if (!window.confirm(`¿Eliminar "${sub.display_name}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('subcategories').delete().eq('id', sub.id);
    if (!error) {
      setAllSubs(prev => prev.filter(s => s.id !== sub.id));
      notify.success(`"${sub.display_name}" eliminado`);
    } else {
      notify.error('Error: ' + error.message);
    }
  }

  // ── Create single ────────────────────────────────────────
  async function createNew() {
    if (!newDisplayName.trim() || !selectedCatId) return;
    setSavingNew(true);
    const parentSlug = navStack.length > 0 ? navStack[navStack.length - 1].slug : null;
    const base = toSlug(newDisplayName);
    const slug = parentSlug ? `${parentSlug}-${base}` : base;
    const { data, error } = await supabase
      .from('subcategories')
      .insert({
        category_id: selectedCatId,
        parent_id: currentParentId,
        name: slug,
        display_name: newDisplayName.trim(),
        slug,
        is_active: true,
        is_filter: false,
        sort_order: currentChildren.length,
      })
      .select()
      .single();
    if (!error && data) {
      setAllSubs(prev => [...prev, data]);
      notify.success(`"${data.display_name}" creado`);
    } else {
      notify.error('Error: ' + error?.message);
    }
    setNewDisplayName('');
    setShowNewForm(false);
    setSavingNew(false);
  }

  // ── Bulk paste ───────────────────────────────────────────
  function parseBulk(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    setBulkParsed(lines);
  }

  async function saveBulk() {
    if (!selectedCatId || bulkParsed.length === 0) return;
    setBulkSaving(true);
    const parentSlug = navStack.length > 0 ? navStack[navStack.length - 1].slug : null;
    const seen = new Set<string>();
    const rows = bulkParsed
      .map((line, i) => {
        const base = toSlug(line);
        // Prefixar con el slug del padre para evitar colisión (category_id, name) en L3+
        const slug = parentSlug ? `${parentSlug}-${base}` : base;
        return {
          category_id: selectedCatId,
          parent_id: currentParentId,
          name: slug,
          display_name: line,
          slug,
          is_active: true,
          is_filter: false,
          sort_order: currentChildren.length + i,
        };
      })
      .filter(row => {
        if (seen.has(row.slug)) return false;
        seen.add(row.slug);
        return true;
      });
    const { data, error } = await supabase
      .from('subcategories')
      .upsert(rows, { onConflict: 'category_id,name', ignoreDuplicates: false })
      .select();
    if (!error && data) {
      // Merge por id: evita duplicados cuando el upsert actualiza rows existentes
      setAllSubs(prev => {
        const map = new Map(prev.map(s => [s.id, s]));
        data.forEach(s => map.set(s.id, s));
        return Array.from(map.values());
      });
      notify.success(`${data.length} ítems importados`);
    } else {
      notify.error('Error al importar: ' + error?.message);
    }
    setBulkText('');
    setBulkParsed([]);
    setShowBulk(false);
    setBulkSaving(false);
  }

  // ── Category toggles ─────────────────────────────────────
  async function toggleCatActive(cat: TaxCategory) {
    const newVal = !cat.is_active;
    const { error } = await supabase.from('categories').update({ is_active: newVal }).eq('id', cat.id);
    if (!error) setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newVal } : c));
  }

  async function toggleCatFilter(cat: TaxCategory) {
    const newVal = !cat.is_filter;
    const { error } = await supabase.from('categories').update({ is_filter: newVal }).eq('id', cat.id);
    if (!error) setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_filter: newVal } : c));
  }

  // ── Create category ──────────────────────────────────────
  async function createCategory() {
    if (!newCatName.trim()) return;
    const slug = toSlug(newCatName);
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: slug, display_name: newCatName.trim(), slug, is_active: true, sort_order: categories.length })
      .select()
      .single();
    if (!error && data) {
      setCategories(prev => [...prev, data]);
      notify.success(`Categoría "${data.display_name}" creada`);
    } else {
      notify.error('Error: ' + error?.message);
    }
    setNewCatName('');
    setShowNewCat(false);
  }

  // ── Edit category name ───────────────────────────────────
  async function saveCatEdit(cat: TaxCategory) {
    if (!editCatValue.trim()) return;
    const slug = toSlug(editCatValue);
    const { error } = await supabase
      .from('categories')
      .update({ display_name: editCatValue.trim(), slug, name: slug })
      .eq('id', cat.id);
    if (!error) {
      setCategories(prev => prev.map(c =>
        c.id === cat.id ? { ...c, display_name: editCatValue.trim(), slug, name: slug } : c
      ));
    }
    setEditingCatId(null);
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Taxonomía</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {categories.length} categorías · gestión de 4 niveles
          </p>
        </div>
      </div>

      <div className="flex gap-4 min-h-0" style={{ minHeight: 600 }}>

        {/* ── LEFT: Category list ─────────────────────────────── */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Categorías</span>
            <button
              onClick={() => setShowNewCat(true)}
              className="p-1 text-brand-600 hover:bg-brand-50 rounded transition-colors"
              title="Nueva categoría"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* New category inline */}
          {showNewCat && (
            <div className="p-2 border-b border-brand-100 bg-brand-50/30">
              <input
                autoFocus
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') createCategory();
                  if (e.key === 'Escape') { setShowNewCat(false); setNewCatName(''); }
                }}
                placeholder="Nombre de la categoría..."
                className="w-full px-2 py-1.5 text-sm border border-brand-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex gap-1 mt-1.5">
                <button onClick={createCategory} className="flex-1 py-1 bg-brand-600 text-white text-xs font-semibold rounded hover:bg-brand-500">
                  Crear
                </button>
                <button onClick={() => { setShowNewCat(false); setNewCatName(''); }} className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-xs rounded">
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1 p-1">
            {categories.map(cat => {
              const isSelected = selectedCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all mb-0.5 ${
                    isSelected ? 'bg-brand-600 text-white' : 'hover:bg-gray-50 text-gray-800'
                  }`}
                  onClick={() => selectCategory(cat.id)}
                >
                  {isSelected
                    ? <FolderOpen className="w-4 h-4 flex-shrink-0 opacity-80" />
                    : <Folder className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  }

                  {editingCatId === cat.id ? (
                    <input
                      autoFocus
                      value={editCatValue}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setEditCatValue(e.target.value)}
                      onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === 'Enter') saveCatEdit(cat);
                        if (e.key === 'Escape') setEditingCatId(null);
                      }}
                      className="flex-1 min-w-0 px-1 py-0.5 text-sm bg-white text-gray-900 border border-brand-400 rounded focus:outline-none"
                    />
                  ) : (
                    <span className={`flex-1 text-sm font-medium truncate ${!cat.is_active ? 'opacity-40' : ''}`}>
                      {cat.display_name}
                    </span>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {cat.is_filter && !isSelected && (
                      <Filter className="w-3 h-3 text-blue-400" />
                    )}
                    {isSelected && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); setEditingCatId(cat.id); setEditCatValue(cat.display_name); }}
                          className="p-0.5 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Editar nombre"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleCatFilter(cat); }}
                          className="p-0.5 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title={cat.is_filter ? 'Quitar filtro' : 'Activar filtro'}
                        >
                          <Filter className={`w-3 h-3 ${cat.is_filter ? 'opacity-100' : 'opacity-40'}`} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleCatActive(cat); }}
                          className="p-0.5 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title={cat.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {cat.is_active
                            ? <Check className="w-3 h-3 text-green-300" />
                            : <X className="w-3 h-3 text-red-300" />
                          }
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Children panel ────────────────────────────── */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-w-0">

          {!selectedCatId ? (
            <div className="flex-1 flex items-center justify-center text-center p-12">
              <div>
                <Tag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Seleccioná una categoría</p>
                <p className="text-gray-300 text-sm mt-1">para ver y gestionar su taxonomía</p>
              </div>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-2 p-3 border-b border-gray-100 flex-wrap">

                {/* Breadcrumb */}
                <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
                  <button
                    onClick={() => navigateTo(0)}
                    className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {selectedCat?.display_name}
                  </button>
                  {navStack.map((node, i) => (
                    <React.Fragment key={node.id}>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      <button
                        onClick={() => navigateTo(i + 1)}
                        className="text-sm font-medium text-brand-600 hover:text-brand-800 hover:underline truncate max-w-32"
                        title={node.display_name}
                      >
                        {node.display_name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                {/* Level badge */}
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-medium flex-shrink-0">
                  {currentLevelLabel}
                </span>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setShowNewForm(f => !f); setShowBulk(false); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      showNewForm ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nueva
                  </button>
                  <button
                    onClick={() => { setShowBulk(f => !f); setShowNewForm(false); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      showBulk ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Bulk Paste
                  </button>
                  {navStack.length === 0 && (
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                  )}
                </div>
              </div>

              {/* New item form */}
              {showNewForm && (
                <div className="px-4 py-3 border-b border-brand-100 bg-brand-50/20 flex items-center gap-2">
                  <input
                    ref={newInputRef}
                    value={newDisplayName}
                    onChange={e => setNewDisplayName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') createNew();
                      if (e.key === 'Escape') { setShowNewForm(false); setNewDisplayName(''); }
                    }}
                    placeholder={`Nombre del/la ${currentLevelLabel.slice(0, -1).toLowerCase()}...`}
                    className="flex-1 px-3 py-2 text-sm border border-brand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={createNew}
                    disabled={!newDisplayName.trim() || savingNew}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Agregar
                  </button>
                  <button
                    onClick={() => { setShowNewForm(false); setNewDisplayName(''); }}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bulk paste */}
              {showBulk && (
                <div className="px-4 pt-3 pb-4 border-b border-blue-100">
                  <BulkPastePanel
                    text={bulkText}
                    parsed={bulkParsed}
                    saving={bulkSaving}
                    onChange={setBulkText}
                    onParse={parseBulk}
                    onSave={saveBulk}
                    onCancel={() => { setShowBulk(false); setBulkText(''); setBulkParsed([]); }}
                  />
                </div>
              )}

              {/* Children table */}
              <div className="flex-1 overflow-auto p-3">
                {loadingCat ? (
                  <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Cargando...</span>
                  </div>
                ) : (
                  <ChildrenTable
                    children={currentChildren}
                    levelLabel={currentLevelLabel}
                    canDrillIn={canDrillIn}
                    onDrillIn={navigateInto}
                    onToggleActive={toggleActive}
                    onToggleFilter={toggleFilter}
                    onStartEdit={startEdit}
                    onDelete={deleteSub}
                    editingId={editingId}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onEditSave={saveEdit}
                    onEditCancel={() => setEditingId(null)}
                  />
                )}
              </div>

              {/* Footer stats */}
              <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                <span>{currentChildren.length} ítems</span>
                <span>{currentChildren.filter(s => s.is_active).length} activos</span>
                <span>{currentChildren.filter(s => s.is_filter).length} con filtro</span>
                {canDrillIn && currentChildren.length > 0 && (
                  <span className="text-gray-300">· click → para entrar al nivel siguiente</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedCat && (
        <PreviewModal
          category={selectedCat}
          allSubs={allSubs}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};
