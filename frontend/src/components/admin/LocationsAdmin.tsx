// ============================================================
// LOCATIONS ADMIN — Sprint 5A
// ============================================================
// Panel admin para gestionar provincias y localidades desde DB.
// Permite agregar, editar y desactivar localidades sin tocar código.
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Loader2, AlertCircle, Check, X } from 'lucide-react';
import {
  getProvinces,
  getLocalitiesByProvince,
  createLocality,
  updateLocality,
  deleteLocality,
  toggleLocality,
  nameToSlug,
  type Province,
  type Locality,
} from '../../services/v2/locationsService';
import { notify } from '../../utils/notifications';

// ─── FILA DE LOCALIDAD ────────────────────────────────────────

function LocalityRow({
  loc,
  provinceId,
  onChanged,
}: {
  loc: Locality;
  provinceId: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(loc.name);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateLocality(loc.id, name.trim());
      notify.success('Localidad actualizada');
      setEditing(false);
      onChanged();
    } catch (e: any) {
      notify.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar "${loc.name}"?`)) return;
    try {
      await deleteLocality(loc.id, provinceId);
      notify.success('Localidad eliminada');
      onChanged();
    } catch (e: any) {
      notify.error(e.message || 'Error al eliminar');
    }
  };

  const toggle = async () => {
    try {
      await toggleLocality(loc.id, !loc.is_active, provinceId);
      onChanged();
    } catch (e: any) {
      notify.error(e.message || 'Error');
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${loc.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
      {editing ? (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
          <button onClick={save} disabled={saving} className="p-1 text-brand-600 hover:text-brand-800">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button onClick={() => { setEditing(false); setName(loc.name); }} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={toggle}
            title={loc.is_active ? 'Desactivar' : 'Activar'}
            className={`w-2 h-2 rounded-full flex-shrink-0 ${loc.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
          />
          <span
            className="flex-1 text-sm text-gray-800 cursor-pointer hover:text-brand-600"
            onClick={() => setEditing(true)}
          >
            {loc.name}
          </span>
          <span className="text-xs text-gray-400 font-mono">{loc.slug}</span>
          <button onClick={remove} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

// ─── SECCIÓN DE PROVINCIA ─────────────────────────────────────

function ProvinceSection({ province }: { province: Province }) {
  const [open, setOpen] = useState(false);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLocalitiesByProvince(province.id);
      setLocalities(data);
    } finally {
      setLoading(false);
    }
  }, [province.id]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const addLocality = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createLocality({
        province_id: province.id,
        name: newName.trim(),
        slug: nameToSlug(newName.trim()),
      });
      notify.success('Localidad agregada');
      setNewName('');
      setAdding(false);
      load();
    } catch (e: any) {
      notify.error(e.message || 'Error al agregar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header provincia */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm">{province.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {localities.length > 0 ? `${localities.filter((l) => l.is_active).length} activas` : '—'}
          </span>
          {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {/* Localidades */}
      {open && (
        <div className="p-3 space-y-2 bg-white">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          ) : (
            <>
              {localities.map((loc) => (
                <LocalityRow key={loc.id} loc={loc} provinceId={province.id} onChanged={load} />
              ))}
              {localities.length === 0 && !adding && (
                <p className="text-sm text-gray-400 text-center py-2">Sin localidades aún</p>
              )}

              {/* Agregar */}
              {adding ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addLocality(); if (e.key === 'Escape') setAdding(false); }}
                    placeholder="Nombre de la localidad..."
                    className="flex-1 text-sm border border-brand-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                  <button onClick={addLocality} disabled={saving} className="px-3 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 disabled:opacity-40">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
                  </button>
                  <button onClick={() => setAdding(false)} className="p-2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 mt-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar localidad
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PANEL PRINCIPAL ──────────────────────────────────────────

export function LocationsAdmin() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch((e) => setError(e.message || 'Error al cargar provincias'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = provinces.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <p className="text-red-700 text-sm">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Ubicaciones</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Gestioná las localidades disponibles por provincia. Los cambios se reflejan inmediatamente en el wizard de publicación.
        </p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar provincia..."
        className="w-full max-w-sm px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <div className="space-y-2">
        {filtered.map((province) => (
          <ProvinceSection key={province.id} province={province} />
        ))}
      </div>
    </div>
  );
}
