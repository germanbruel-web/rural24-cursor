// ============================================================
// OPTION LISTS TAB — Sprint 4A
// ============================================================
// Gestión de catálogos de opciones reutilizables.
// UI: tabla principal + drawer lateral para editar ítems +
// bulk import por texto plano.
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Search,
  List,
  Loader2,
  X,
  ChevronRight,
  Save,
  AlertCircle,
  Globe,
  Tag,
  ClipboardList,
  Edit2,
  Check,
} from 'lucide-react';
import {
  getOptionLists,
  getOptionListItems,
  createOptionList,
  updateOptionList,
  deleteOptionList,
  addOptionListItem,
  updateOptionListItem,
  deleteOptionListItem,
  bulkUpsertItems,
  replaceAllItems,
  parseBulkText,
  type OptionList,
  type OptionListItem,
  type CreateOptionListInput,
} from '../../services/v2/optionListsService';
import { getCategories } from '../../services/v2/formsService';
import { notify } from '../../utils/notifications';
import type { Category } from '../../types/v2';

// ─── SCOPE BADGE ──────────────────────────────────────────────

function ScopeBadge({ list }: { list: OptionList }) {
  if (list.scope === 'global') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
        <Globe className="w-3 h-3" />
        Global
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
      <Tag className="w-3 h-3" />
      {list.category_name || 'Categoría'}
    </span>
  );
}

// ─── MODAL: CREAR / EDITAR LISTA ─────────────────────────────

interface ListFormModalProps {
  categories: Category[];
  editing?: OptionList | null;
  onClose: () => void;
  onSaved: () => void;
}

function ListFormModal({ categories, editing, onClose, onSaved }: ListFormModalProps) {
  const [displayName, setDisplayName] = useState(editing?.display_name || '');
  const [scope, setScope] = useState<'global' | 'category'>(editing?.scope || 'global');
  const [categoryId, setCategoryId] = useState(editing?.category_id || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateOptionList(editing.id, {
          display_name: displayName,
          scope,
          category_id: scope === 'category' ? categoryId || null : null,
          description,
        });
        notify.success('Lista actualizada');
      } else {
        await createOptionList({
          display_name: displayName,
          scope,
          category_id: scope === 'category' ? categoryId || null : null,
          description,
        } as CreateOptionListInput);
        notify.success('Lista creada');
      }
      onSaved();
    } catch (err: any) {
      notify.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">
            {editing ? 'Editar lista' : 'Nueva lista de opciones'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la lista *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ej: Razas Bovinas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alcance</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setScope('global')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  scope === 'global'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Globe className="w-4 h-4" />
                Global
              </button>
              <button
                type="button"
                onClick={() => setScope('category')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  scope === 'category'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Tag className="w-4 h-4" />
                Por categoría
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {scope === 'global'
                ? 'Disponible en todas las categorías (ej: Provincias, Combustibles)'
                : 'Específica de una categoría (ej: Razas Bovinas para Ganadería)'}
            </p>
          </div>

          {scope === 'category' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría asociada
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
              >
                <option value="">Sin categoría específica</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.display_name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para qué se usa esta lista..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={!displayName.trim() || saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Guardar cambios' : 'Crear lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DRAWER: EDITAR ÍTEMS ─────────────────────────────────────

interface ItemsDrawerProps {
  list: OptionList;
  onClose: () => void;
  onItemsChanged: () => void;
}

function ItemsDrawer({ list, onClose, onItemsChanged }: ItemsDrawerProps) {
  const [items, setItems] = useState<OptionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'list' | 'bulk'>('list');

  // Add single item
  const [newLabel, setNewLabel] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Bulk import
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState<'add' | 'replace'>('add');
  const [bulkParsed, setBulkParsed] = useState<Array<{ value: string; label: string }>>([]);
  const [savingBulk, setSavingBulk] = useState(false);

  // Edit item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOptionListItems(list.id);
      setItems(data);
    } catch {
      notify.error('Error al cargar ítems');
    } finally {
      setLoading(false);
    }
  }, [list.id]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    setBulkParsed(parseBulkText(bulkText));
  }, [bulkText]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAddingItem(true);
    try {
      const newItem = await addOptionListItem(list.id, {
        value: newLabel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        label: newLabel.trim(),
        sort_order: items.length,
      });
      setItems((prev) => [...prev, newItem]);
      setNewLabel('');
      onItemsChanged();
    } catch (err: any) {
      notify.error(err.message || 'Error al agregar ítem');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (item: OptionListItem) => {
    if (!window.confirm(`¿Eliminar "${item.label}"?`)) return;
    try {
      await deleteOptionListItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onItemsChanged();
    } catch {
      notify.error('Error al eliminar ítem');
    }
  };

  const handleSaveEdit = async (item: OptionListItem) => {
    if (!editLabel.trim()) return;
    try {
      const updated = await updateOptionListItem(item.id, { label: editLabel.trim() });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, label: updated.label } : i));
      setEditingItemId(null);
    } catch {
      notify.error('Error al guardar');
    }
  };

  const handleBulkSave = async () => {
    if (bulkParsed.length === 0) return;
    setSavingBulk(true);
    try {
      if (bulkMode === 'replace') {
        await replaceAllItems(list.id, bulkParsed);
        notify.success(`Lista reemplazada con ${bulkParsed.length} ítems`);
      } else {
        const result = await bulkUpsertItems(list.id, bulkParsed, items.length);
        notify.success(`${result.inserted} nuevos, ${result.updated} actualizados`);
      }
      setBulkText('');
      await loadItems();
      onItemsChanged();
    } catch (err: any) {
      notify.error(err.message || 'Error en bulk import');
    } finally {
      setSavingBulk(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="drawer-enter fixed inset-y-0 right-0 z-50 w-[90vw] sm:w-[480px] flex flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <h3 className="font-bold text-gray-900 truncate">{list.display_name}</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {items.length} ítem{items.length !== 1 ? 's' : ''}
              {list.description && ` · ${list.description}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white flex-shrink-0">
          {(['list', 'bulk'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-brand-700 border-b-2 border-brand-600 bg-brand-50/50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'list' ? 'Lista de ítems' : 'Importar en masa'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'list' && (
            <div className="p-4 space-y-3">
              {/* Add single item */}
              <form onSubmit={handleAddItem} className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Nueva opción..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={!newLabel.trim() || addingItem}
                  className="px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1 text-sm font-medium"
                >
                  {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Agregar
                </button>
              </form>

              {/* Items list */}
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Cargando...
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <List className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No hay ítems. Agregá el primero arriba o usá "Importar en masa".</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 bg-white group hover:bg-gray-50">
                      {editingItemId === item.id ? (
                        <>
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="flex-1 px-2 py-1 border border-brand-400 rounded text-sm focus:ring-1 focus:ring-brand-600"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item);
                              if (e.key === 'Escape') setEditingItemId(null);
                            }}
                          />
                          <button onClick={() => handleSaveEdit(item)}
                            className="p-1 text-brand-600 hover:text-brand-700">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingItemId(null)}
                            className="p-1 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-400 font-mono">{item.value}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingItemId(item.id); setEditLabel(item.label); }}
                              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'bulk' && (
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 space-y-1">
                <p className="font-semibold">Formato de importación:</p>
                <p>• Una opción por línea: <code className="bg-blue-100 px-1 rounded">Aberdeen Angus</code></p>
                <p>• Con valor explícito: <code className="bg-blue-100 px-1 rounded">aberdeen-angus|Aberdeen Angus</code></p>
                <p>• Las líneas que empiezan con # son ignoradas</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Opciones a importar</label>
                  {bulkText && (
                    <span className="text-xs text-gray-500">
                      {bulkParsed.length} ítem{bulkParsed.length !== 1 ? 's' : ''} detectado{bulkParsed.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Aberdeen Angus&#10;Hereford&#10;Shorthorn&#10;Brahman&#10;..."
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm font-mono resize-none"
                />
              </div>

              {/* Preview */}
              {bulkParsed.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Preview ({bulkParsed.length} ítems)
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                    {bulkParsed.slice(0, 20).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-3 py-2">
                        <span className="text-sm text-gray-800">{item.label}</span>
                        <span className="text-xs text-gray-400 font-mono ml-auto">{item.value}</span>
                      </div>
                    ))}
                    {bulkParsed.length > 20 && (
                      <div className="px-3 py-2 text-xs text-gray-400 text-center">
                        ... y {bulkParsed.length - 20} más
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mode selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Modo de importación</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkMode('add')}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      bulkMode === 'add'
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Agregar a lista existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode('replace')}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      bulkMode === 'replace'
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Reemplazar toda la lista
                  </button>
                </div>
                {bulkMode === 'replace' && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Esto eliminará los {items.length} ítems actuales y los reemplazará
                  </p>
                )}
              </div>

              <button
                onClick={handleBulkSave}
                disabled={bulkParsed.length === 0 || savingBulk}
                className="w-full px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingBulk
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />}
                {bulkMode === 'replace' ? 'Reemplazar lista' : `Importar ${bulkParsed.length} ítems`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────

export function OptionListsTab() {
  const [lists, setLists] = useState<OptionList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'category'>('all');

  const [showCreate, setShowCreate] = useState(false);
  const [editingList, setEditingList] = useState<OptionList | null>(null);
  const [drawerList, setDrawerList] = useState<OptionList | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, lsts] = await Promise.all([
        getCategories(),
        getOptionLists(),
      ]);
      setCategories(cats);
      setLists(lsts);
    } catch {
      notify.error('Error al cargar listas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = lists.filter((l) => {
    const matchSearch = !search || l.display_name.toLowerCase().includes(search.toLowerCase());
    const matchScope = filterScope === 'all' || l.scope === filterScope;
    return matchSearch && matchScope;
  });

  const handleDelete = async (list: OptionList) => {
    if (!window.confirm(
      `¿Eliminar la lista "${list.display_name}" con todos sus ${list.item_count ?? 0} ítems?\n\n` +
      (list.used_in_fields
        ? `ATENCIÓN: Esta lista está siendo referenciada en ${list.used_in_fields} campo(s) de formularios.`
        : 'Esta acción no se puede deshacer.')
    )) return;

    try {
      await deleteOptionList(list.id);
      notify.success('Lista eliminada');
      setLists((prev) => prev.filter((l) => l.id !== list.id));
    } catch (err: any) {
      notify.error(err.message || 'Error al eliminar');
    }
  };

  const handleItemsChanged = async () => {
    // Refrescar solo los counts
    const updated = await getOptionLists();
    setLists(updated);
    if (drawerList) {
      const refreshed = updated.find((l) => l.id === drawerList.id);
      if (refreshed) setDrawerList(refreshed);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Listas de Opciones</h2>
          <p className="text-sm text-gray-500">
            {lists.length} lista{lists.length !== 1 ? 's' : ''} — catálogos reutilizables para campos de formularios
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva lista
        </button>
      </div>

      {/* Nota informativa */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <div>
          <strong>¿Para qué sirven?</strong> En lugar de repetir las mismas 200 razas bovinas en cada campo "Raza",
          creás una lista una vez y los campos de formularios la referencian. Si actualizás la lista, todos los campos
          la ven actualizada automáticamente.
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
            placeholder="Buscar listas..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
          />
        </div>
        <select
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
        >
          <option value="all">Todos los alcances</option>
          <option value="global">Solo globales</option>
          <option value="category">Solo por categoría</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando listas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">
              {lists.length === 0 ? 'No hay listas creadas' : 'Ninguna coincide con los filtros'}
            </p>
            {lists.length === 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Crear la primera
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lista</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Alcance</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ítems</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">En uso</th>
                  <th className="px-4 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((list) => (
                  <tr key={list.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{list.display_name}</p>
                        {list.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{list.description}</p>
                        )}
                        <p className="text-xs text-gray-400 font-mono">{list.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ScopeBadge list={list} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-gray-700 tabular-nums">
                        {list.item_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {list.used_in_fields ? (
                        <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                          {list.used_in_fields} campo{list.used_in_fields > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Editar ítems */}
                        <button
                          onClick={() => setDrawerList(list)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                          title="Editar ítems"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ítems</span>
                        </button>
                        {/* Editar lista */}
                        <button
                          onClick={() => setEditingList(list)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Editar lista"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Eliminar */}
                        <button
                          onClick={() => handleDelete(list)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <ListFormModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); loadData(); }}
        />
      )}
      {editingList && (
        <ListFormModal
          categories={categories}
          editing={editingList}
          onClose={() => setEditingList(null)}
          onSaved={() => { setEditingList(null); loadData(); }}
        />
      )}

      {/* Items Drawer */}
      {drawerList && (
        <ItemsDrawer
          list={drawerList}
          onClose={() => setDrawerList(null)}
          onItemsChanged={handleItemsChanged}
        />
      )}
    </div>
  );
}
