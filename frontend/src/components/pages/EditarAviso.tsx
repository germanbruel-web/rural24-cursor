import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft, X, AlertTriangle } from 'lucide-react';
import { hasSensitiveContent, scanAttributesForSensitive } from '../../utils/formatters';
import { useEditarAviso } from '../../hooks/useEditarAviso';
import { SimpleImageUploader } from '../SimpleImageUploader/SimpleImageUploader';
import { DynamicFormLoader } from '../forms/DynamicFormLoader';
import { CategorySelector } from './publicar-aviso/CategorySelector';
import { getCategories, getSubcategories } from '../../services/v2/formsService';
import type { Category, Subcategory } from '../../types/v2';
import type { MyCompany } from '../../services/empresaService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface EditarAvisoProps {
  adId: string;
  isSuperadmin?: boolean;
  onBack?: () => void;
}

interface Province {
  id: string;
  name: string;
  slug: string;
}

interface Locality {
  id: string;
  name: string;
  slug: string;
  province_id: string;
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function EditarAviso({ adId, isSuperadmin = false, onBack }: EditarAvisoProps) {
  const state = useEditarAviso(adId);

  // Validación de contenido sensible (tiempo real)
  const titleSensitive    = useMemo(() => hasSensitiveContent(state.title), [state.title]);
  const descSensitive     = useMemo(() => hasSensitiveContent(state.description), [state.description]);
  const attrSensitive     = useMemo(() => scanAttributesForSensitive(state.attributeValues), [state.attributeValues]);
  const hasSensitiveAny   = titleSensitive || descSensitive || attrSensitive;

  function handleBack() {
    if (state.hasChanges) {
      if (!window.confirm('Tenés cambios sin guardar. ¿Querés salir de todas formas?')) return;
    }
    (onBack || (() => window.history.back()))();
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [openSections, setOpenSections] = useState({
    categoria: true,
    fotos: true,
    detalles: true,
    ubicacion: true,
    precio: true,
    estado: true,
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [expandedL2Sub, setExpandedL2Sub] = useState('');
  const [showProfileGate, setShowProfileGate] = useState(false);
  const [pendingSubcategoryName, setPendingSubcategoryName] = useState('');

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
    loadProvinces();
  }, []);

  useEffect(() => {
    if (state.province) {
      const matched = provinces.find(p => p.name === state.province || p.slug === state.province || p.id === state.province);
      if (matched) loadLocalitiesFor(matched.id);
    }
  }, [state.province, provinces]);

  useEffect(() => {
    if (state.ad?.subcategory_id) {
      setSelectedSubcategory(state.ad.subcategory_id);
    }
    if (state.ad?.category_id) {
      setSelectedCategory(state.ad.category_id);
      getSubcategories(state.ad.category_id).then(setSubcategories);
    }
  }, [state.ad?.subcategory_id, state.ad?.category_id]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (state.hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state.hasChanges]);

  useEffect(() => {
    if (state.saveSuccess && state.ad) {
      const dest = state.ad.slug || state.ad.id;
      window.location.hash = `#/ad/${dest}`;
    }
  }, [state.saveSuccess, state.ad]);

  async function loadProvinces() {
    try {
      const res = await fetch(`${API_URL}/api/config/locations?type=provinces`);
      const data = await res.json();
      setProvinces(data.provinces || []);
    } catch {
      // silencioso
    }
  }

  async function loadLocalitiesFor(provinceId: string) {
    setLoadingLocalities(true);
    try {
      const res = await fetch(`${API_URL}/api/config/locations?type=localities&province_id=${provinceId}`);
      const data = await res.json();
      setLocalities(data.localities || []);
    } catch {
      setLocalities([]);
    } finally {
      setLoadingLocalities(false);
    }
  }

  function handleProvinceChange(value: string) {
    state.setProvince(value);
    state.setLocality('');
    setLocalities([]);
    const matched = provinces.find(p => p.name === value || p.id === value);
    if (matched) loadLocalitiesFor(matched.id);
  }

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const subcategoriesForModal = subcategories;

  function handleCategorySelected(sub: Subcategory, _isServicio: boolean) {
    const subName = sub.display_name;
    const catName = categories.find(c => c.id === selectedCategory)?.display_name || '';

    let path = '';
    if (sub.parent_id) {
      const parent = subcategoriesForModal.find(s => s.id === sub.parent_id);
      path = [catName, parent?.display_name, subName].filter(Boolean).join(' > ');
    } else {
      path = [catName, subName].filter(Boolean).join(' > ');
    }

    setShowCategoryModal(false);
    state.handleCategoryChange(sub.id, path);
    setSelectedSubcategory(sub.id);
  }

  function openCategoryModal() {
    setShowCategoryModal(true);
  }

  function handleCategoryModalClose() {
    setShowCategoryModal(false);
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4 p-6">
        <p className="text-red-600 text-center">{state.error}</p>
        <button
          onClick={onBack || (() => window.history.back())}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          Volver
        </button>
      </div>
    );
  }

  const saveButton = (
    <button
      onClick={state.handleSave}
      disabled={!state.hasChanges || state.saving || hasSensitiveAny}
      title={hasSensitiveAny ? 'Hay datos de contacto en los campos' : undefined}
      className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {state.saving ? 'Guardando...' : 'Guardar'}
    </button>
  );

  const sectionCategoria = (
    <Section title="Categoría" open={openSections.categoria} onToggle={() => toggleSection('categoria')}>
      <div className="pt-2 space-y-3">
        {state.categoryPath ? (
          <p className="text-sm text-gray-700 font-medium">{state.categoryPath}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Sin categoría seleccionada</p>
        )}
        <button
          type="button"
          onClick={openCategoryModal}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium underline-offset-2 hover:underline"
        >
          Cambiar categoría
        </button>
      </div>
    </Section>
  );

  const sectionFotos = (
    <Section title="Fotos" open={openSections.fotos} onToggle={() => toggleSection('fotos')}>
      <div className="pt-2">
        <SimpleImageUploader
          maxFiles={8}
          folder="ads"
          onImagesChange={state.setImages}
          existingImages={state.images}
        />
      </div>
    </Section>
  );

  const sectionDetalles = (
    <Section title="Detalles" open={openSections.detalles} onToggle={() => toggleSection('detalles')}>
      <div className="pt-2 space-y-2">
        {attrSensitive && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            Uno o más campos tienen datos de contacto. Removelos antes de guardar.
          </div>
        )}
        {state.subcategoryId ? (
          <DynamicFormLoader
            subcategoryId={state.subcategoryId}
            categoryId={state.ad?.category_id}
            values={state.attributeValues}
            onChange={(name, value) =>
              state.setAttributeValues({ ...state.attributeValues, [name]: value })
            }
          />
        ) : (
          <p className="text-sm text-gray-500">Seleccioná una subcategoría primero.</p>
        )}
      </div>
    </Section>
  );

  const sectionUbicacion = (
    <Section title="Ubicación" open={openSections.ubicacion} onToggle={() => toggleSection('ubicacion')}>
      <div className="pt-2 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
          <select
            value={state.province}
            onChange={e => handleProvinceChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Seleccioná una provincia</option>
            {provinces.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
          <select
            value={state.locality}
            onChange={e => state.setLocality(e.target.value)}
            disabled={localities.length === 0 || loadingLocalities}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          >
            <option value="">
              {loadingLocalities ? 'Cargando...' : localities.length === 0 ? 'Seleccioná una provincia primero' : 'Seleccioná una localidad'}
            </option>
            {localities.map(l => (
              <option key={l.id} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>
    </Section>
  );

  const sectionPrecio = (
    <Section title="Precio y descripción" open={openSections.precio} onToggle={() => toggleSection('precio')}>
      <div className="pt-2 space-y-4">
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm font-medium text-gray-700">Título</label>
            <span className="text-xs text-gray-400">{state.title.length}/200</span>
          </div>
          <input
            type="text"
            value={state.title}
            onChange={e => state.setTitle(e.target.value)}
            maxLength={200}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${titleSensitive ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-brand-500'}`}
          />
          {titleSensitive && (
            <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              No podés incluir datos de contacto (teléfono, email, links o redes).
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <span className="text-xs text-gray-400">{state.description.length}/2000</span>
          </div>
          <textarea
            value={state.description}
            onChange={e => state.setDescription(e.target.value)}
            maxLength={2000}
            rows={5}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${descSensitive ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-brand-500'}`}
          />
          {descSensitive && (
            <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              No podés incluir datos de contacto (teléfono, email, links o redes).
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="negotiable"
            type="checkbox"
            checked={state.priceNegotiable}
            onChange={e => state.setPriceNegotiable(e.target.checked)}
            className="accent-brand-600"
          />
          <label htmlFor="negotiable" className="text-sm text-gray-700">Precio a convenir</label>
        </div>

        {!state.priceNegotiable && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
              <input
                type="number"
                value={state.price}
                onChange={e => state.setPrice(e.target.value)}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select
                value={state.currency}
                onChange={e => state.setCurrency(e.target.value as 'ARS' | 'USD')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </Section>
  );

  const statusColors: Record<string, string> = {
    active: 'border-green-400 focus:ring-green-400',
    paused: 'border-amber-400 focus:ring-amber-400',
    sold: 'border-brand-400 focus:ring-brand-400',
    deleted: 'border-red-400 focus:ring-red-400',
  };

  const sectionEstado = isSuperadmin ? (
    <Section title="Estado" open={openSections.estado} onToggle={() => toggleSection('estado')}>
      <div className="pt-2">
        <select
          value={state.status}
          onChange={e => state.setStatus(e.target.value)}
          className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${statusColors[state.status] || 'border-gray-300 focus:ring-brand-500'}`}
        >
          <option value="active">Activo</option>
          <option value="paused">Pausado</option>
          <option value="sold">Vendido</option>
          <option value="deleted">Eliminado</option>
        </select>
      </div>
    </Section>
  ) : null;

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header sticky */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-600 hover:text-brand-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Volver</span>
          </button>

          <h1 className="flex-1 text-base font-bold text-gray-900 truncate">Editar aviso</h1>

          {state.hasChanges && (
            <span className="hidden sm:inline-flex text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full shrink-0">
              Cambios sin guardar
            </span>
          )}

          {saveButton}
        </header>

        {state.hasChanges && (
          <div className="sm:hidden mx-4 mt-3 text-xs font-medium bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-center">
            Cambios sin guardar
          </div>
        )}

        {state.saveError && (
          <div className="mx-4 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {state.saveError}
          </div>
        )}

        {/* Layout mobile (< lg) */}
        <div className="lg:hidden px-4 mt-4 space-y-3">
          {sectionCategoria}
          {sectionFotos}
          {sectionDetalles}
          {sectionUbicacion}
          {sectionPrecio}
          {sectionEstado}
        </div>

        {/* Layout desktop (>= lg) */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 max-w-6xl mx-auto px-6 mt-6">
          <div className="col-span-5 space-y-4">
            {sectionCategoria}
            {sectionDetalles}
            {sectionUbicacion}
          </div>
          <div className="col-span-7 space-y-4">
            {sectionFotos}
            {sectionPrecio}
            {sectionEstado}
          </div>
        </div>
      </div>

      {/* Modal CategorySelector */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-lg max-h-[80vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={handleCategoryModalClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-gray-900 mb-4 pr-8">Cambiar categoría</h2>
            <CategorySelector
              categories={categories}
              subcategories={subcategoriesForModal}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              showProfileGate={showProfileGate}
              pendingSubcategoryName={pendingSubcategoryName}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                setSelectedSubcategory('');
                setExpandedL2Sub('');
                getSubcategories(catId).then(setSubcategories);
              }}
              onSelectLeaf={(sub, isServicio) => {
                if (state.attributeValues && Object.keys(state.attributeValues).length > 0) {
                  if (!window.confirm('Los atributos del formulario se van a resetear. ¿Continuar?')) return;
                }
                handleCategorySelected(sub, isServicio);
              }}
              onClearCategory={() => {
                setSelectedCategory('');
                setSelectedSubcategory('');
                setExpandedL2Sub('');
              }}
              onProfileGateEmpresaCreated={(_empresa: MyCompany) => {
                setShowProfileGate(false);
              }}
              onShowProfileGate={(name: string) => {
                setPendingSubcategoryName(name);
                setShowProfileGate(true);
              }}
              initialExpandedL2Sub={expandedL2Sub}
            />
          </div>
        </div>
      )}
    </>
  );
}
