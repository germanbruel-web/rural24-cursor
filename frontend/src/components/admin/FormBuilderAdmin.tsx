// ============================================================
// CONSTRUCTOR DE FORMULARIOS — Sprint 8A
// ============================================================
// Panel izquierdo: árbol de categorías (3 niveles)
//   - Cada categoría padre tiene un "Formulario Global"
//   - Cada subcategoría hoja tiene un "Formulario Variante"
// Panel derecho: editor de campos
//
// Jerarquía de formularios:
//   Global [Categoría]  → campos comunes a TODAS las subcategorías
//   Variante [Subcategoría] → campos adicionales específicos
//   El wizard de alta aplica Global + Variante en orden
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  Check,
  X,
  AlertCircle,
  FileText,
  Globe,
  Layers,
  Hash,
  AlignLeft,
  List,
  CheckSquare,
  Sliders,
  Type,
  Zap,
  Tag,
  Star,
  GripVertical,
  Info,
  Handshake,
  Tractor,
  Leaf,
  Warehouse,
  Briefcase,
  Building2,
  Package,
  Wrench,
  Home,
  Fish,
  Wheat,
  Beef,
  Sprout,
  ClipboardList,
  MapPin,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  handshake: <Handshake className="w-4 h-4" />,
  tractor: <Tractor className="w-4 h-4" />,
  leaf: <Leaf className="w-4 h-4" />,
  seedling: <Sprout className="w-4 h-4" />,
  sprout: <Sprout className="w-4 h-4" />,
  warehouse: <Warehouse className="w-4 h-4" />,
  briefcase: <Briefcase className="w-4 h-4" />,
  building: <Building2 className="w-4 h-4" />,
  building2: <Building2 className="w-4 h-4" />,
  package: <Package className="w-4 h-4" />,
  wrench: <Wrench className="w-4 h-4" />,
  home: <Home className="w-4 h-4" />,
  fish: <Fish className="w-4 h-4" />,
  wheat: <Wheat className="w-4 h-4" />,
  cow: <Beef className="w-4 h-4" />,
  beef: <Beef className="w-4 h-4" />,
};
import { supabase } from '../../services/supabaseClient';
import {
  getFormFields,
  createFormField,
  updateFormField,
  deleteFormField,
  deleteFormTemplate,
  moveFieldUp,
  moveFieldDown,
} from '../../services/v2/formFieldsService';
import { getOptionLists } from '../../services/v2/optionListsService';
import type { OptionList } from '../../services/v2/optionListsService';
import { notify } from '../../utils/notifications';
import type { FormFieldV2 } from '../../types/v2';
import { OptionListsTab } from './OptionListsTab';
import { WizardConfigPanel } from './WizardConfigPanel';
import { LocationsAdmin } from './LocationsAdmin';

type AdminTab = 'formularios' | 'listas' | 'wizard' | 'ubicaciones';

// ─── TIPOS ────────────────────────────────────────────────────

interface CatNode {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  icon?: string;
  sort_order: number;
}

interface SubNode {
  id: string;
  category_id: string;
  parent_id: string | null;
  name: string;
  display_name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

interface Plantilla {
  id: string;
  name: string;
  display_name: string;
  category_id: string | null;
  subcategory_id: string | null;
}

// Modo de selección: global = formulario de categoría padre; variante = formulario de subcategoría
type ModoSeleccion = 'global' | 'variante';

type CampoExtendido = FormFieldV2 & { option_list_id?: string | null };
type TipoCampo = FormFieldV2['field_type'];

// ─── CONSTANTES ───────────────────────────────────────────────

const TIPOS_CAMPO: { valor: TipoCampo; etiqueta: string; icono: React.ReactNode }[] = [
  { valor: 'text',         etiqueta: 'Texto corto',     icono: <Type className="w-3.5 h-3.5" /> },
  { valor: 'number',       etiqueta: 'Número',          icono: <Hash className="w-3.5 h-3.5" /> },
  { valor: 'textarea',     etiqueta: 'Texto largo',     icono: <AlignLeft className="w-3.5 h-3.5" /> },
  { valor: 'select',       etiqueta: 'Selector',        icono: <List className="w-3.5 h-3.5" /> },
  { valor: 'autocomplete', etiqueta: 'Autocompletar',   icono: <Zap className="w-3.5 h-3.5" /> },
  { valor: 'checkbox',     etiqueta: 'Sí / No',         icono: <CheckSquare className="w-3.5 h-3.5" /> },
  { valor: 'range',        etiqueta: 'Rango',           icono: <Sliders className="w-3.5 h-3.5" /> },
  { valor: 'tags',         etiqueta: 'Etiquetas',       icono: <Tag className="w-3.5 h-3.5" /> },
  { valor: 'features',     etiqueta: 'Características', icono: <Star className="w-3.5 h-3.5" /> },
];

function etiquetaTipo(t: TipoCampo) {
  return TIPOS_CAMPO.find((f) => f.valor === t)?.etiqueta ?? t;
}
function iconoTipo(t: TipoCampo) {
  return TIPOS_CAMPO.find((f) => f.valor === t)?.icono ?? <Type className="w-3.5 h-3.5" />;
}

// ─── EDITOR DE CAMPO (inline) ─────────────────────────────────

interface EditorCampoProps {
  inicial?: CampoExtendido | null;
  listasOpciones: OptionList[];
  onGuardar: (datos: Partial<CampoExtendido>) => Promise<void>;
  onCancelar: () => void;
}

function EditorCampo({ inicial, listasOpciones, onGuardar, onCancelar }: EditorCampoProps) {
  const [etiqueta,    setEtiqueta]    = useState(inicial?.field_label ?? '');
  const [tipo,        setTipo]        = useState<TipoCampo>(inicial?.field_type ?? 'text');
  const [obligatorio, setObligatorio] = useState(inicial?.is_required ?? false);
  const [ancho,       setAncho]       = useState(inicial?.field_width ?? 'full');
  const [textoEjemplo, setTextoEjemplo] = useState(inicial?.placeholder ?? '');
  const [ayuda,       setAyuda]       = useState(inicial?.help_text ?? '');
  const [listaOpcionesId, setListaOpcionesId] = useState<string>(inicial?.option_list_id ?? '');
  const [guardando,   setGuardando]   = useState(false);

  const necesitaOpciones = tipo === 'select' || tipo === 'autocomplete';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!etiqueta.trim()) return;
    setGuardando(true);
    try {
      await onGuardar({
        field_label:    etiqueta.trim(),
        field_type:     tipo,
        is_required:    obligatorio,
        field_width:    ancho as FormFieldV2['field_width'],
        placeholder:    textoEjemplo.trim() || null,
        help_text:      ayuda.trim() || null,
        option_list_id: necesitaOpciones ? (listaOpcionesId || null) : null,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-brand-50 border border-brand-200 rounded-lg p-4 space-y-3">
      {/* Etiqueta + Tipo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Etiqueta del campo *</label>
          <input
            type="text"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            placeholder="Ej: Año de fabricación"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de campo</label>
          <select
            value={tipo}
            onChange={(e) => { setTipo(e.target.value as TipoCampo); setListaOpcionesId(''); }}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {TIPOS_CAMPO.map((ft) => (
              <option key={ft.valor} value={ft.valor}>{ft.etiqueta}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de opciones (solo para selector/autocompletar) */}
      {necesitaOpciones && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Lista de opciones predefinidas</label>
          <select
            value={listaOpcionesId}
            onChange={(e) => setListaOpcionesId(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">— Ingresar opciones manualmente —</option>
            {listasOpciones.map((ol) => (
              <option key={ol.id} value={ol.id}>{ol.display_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Ancho + Obligatorio */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Ancho:</span>
          {(['full', 'half', 'third'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setAncho(w)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                ancho === w
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-gray-300 text-gray-600 hover:border-brand-400'
              }`}
            >
              {w === 'full' ? 'Completo' : w === 'half' ? 'Mitad' : 'Tercio'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700 ml-auto">
          <input
            type="checkbox"
            checked={obligatorio}
            onChange={(e) => setObligatorio(e.target.checked)}
            className="rounded border-gray-300 text-brand-500"
          />
          Obligatorio
        </label>
      </div>

      {/* Texto ejemplo + Ayuda */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Texto de ejemplo</label>
          <input
            type="text"
            value={textoEjemplo}
            onChange={(e) => setTextoEjemplo(e.target.value)}
            placeholder="Ej: 2022"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Texto de ayuda</label>
          <input
            type="text"
            value={ayuda}
            onChange={(e) => setAyuda(e.target.value)}
            placeholder="Ej: Ingresá el año de fabricación"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancelar}
          className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100"
        >
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando || !etiqueta.trim()}
          className="flex items-center gap-1 text-sm px-3 py-1.5 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
        >
          {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {inicial ? 'Guardar cambios' : 'Agregar campo'}
        </button>
      </div>
    </form>
  );
}

// ─── PANEL DE CAMPOS ──────────────────────────────────────────

interface PanelCamposProps {
  plantilla: Plantilla | null;
  cargando: boolean;
  modo: ModoSeleccion;
  categoriaGlobal?: string;           // nombre de la categoría (para variante)
  onCrearPlantilla: () => Promise<void>;
  onEliminarPlantilla: () => Promise<void>;
  listasOpciones: OptionList[];
}

function PanelCampos({ plantilla, cargando, modo, categoriaGlobal, onCrearPlantilla, onEliminarPlantilla, listasOpciones }: PanelCamposProps) {
  const [campos,      setCampos]      = useState<CampoExtendido[]>([]);
  const [cargandoCampos, setCargandoCampos] = useState(false);
  const [editandoId,  setEditandoId]  = useState<string | 'nuevo' | null>(null);

  // Recargar campos cuando cambia la plantilla
  useEffect(() => {
    if (!plantilla) { setCampos([]); return; }
    setCargandoCampos(true);
    setEditandoId(null);
    getFormFields(plantilla.id)
      .then(setCampos)
      .catch(console.error)
      .finally(() => setCargandoCampos(false));
  }, [plantilla?.id]);

  const recargar = async () => {
    if (!plantilla) return;
    const f = await getFormFields(plantilla.id);
    setCampos(f);
  };

  const handleAgregar = async (datos: Partial<CampoExtendido>) => {
    if (!plantilla) return;
    const siguienteOrden = campos.length > 0 ? Math.max(...campos.map((f) => f.display_order)) + 1 : 0;
    await createFormField(plantilla.id, datos as any, siguienteOrden);
    await recargar();
    setEditandoId(null);
    notify.success('Campo agregado');
  };

  const handleActualizar = async (campoId: string, datos: Partial<CampoExtendido>) => {
    await updateFormField(campoId, datos as any);
    await recargar();
    setEditandoId(null);
    notify.success('Campo actualizado');
  };

  const handleEliminar = async (campoId: string) => {
    if (!window.confirm('¿Eliminar este campo?')) return;
    await deleteFormField(campoId);
    setCampos((prev) => prev.filter((f) => f.id !== campoId));
    notify.success('Campo eliminado');
  };

  const handleSubir = async (campoId: string) => {
    await moveFieldUp(campoId, campos);
    await recargar();
  };
  const handleBajar = async (campoId: string) => {
    await moveFieldDown(campoId, campos);
    await recargar();
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  // Sin plantilla → ofrecer crear
  if (!plantilla) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-2">
          {modo === 'global'
            ? 'Esta categoría no tiene formulario global todavía.'
            : 'Esta subcategoría no tiene variante de formulario todavía.'}
        </p>
        {modo === 'variante' && categoriaGlobal && (
          <p className="text-xs text-gray-400 mb-2">
            Al crear la variante, el formulario global de <strong>{categoriaGlobal}</strong> se aplicará automáticamente.
          </p>
        )}
        <button
          onClick={onCrearPlantilla}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {modo === 'global' ? 'Crear formulario global' : 'Crear variante'}
        </button>
        <p className="text-xs text-gray-400 mt-3 italic">
          Si ya existía un formulario con este nombre, se reasignará automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Barra info plantilla */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Nombre interno:</span>
          <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{plantilla.name}</code>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            {campos.length} campo{campos.length !== 1 ? 's' : ''}
          </span>
          {modo === 'variante' && (
            <button
              onClick={onEliminarPlantilla}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
              title="Eliminar esta variante y todos sus campos"
            >
              <Trash2 className="w-3 h-3" />
              Eliminar variante
            </button>
          )}
        </div>
      </div>

      {/* Aviso para variante: hereda global */}
      {modo === 'variante' && categoriaGlobal && (
        <div className="flex items-start gap-2 mb-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            El formulario global de <strong>{categoriaGlobal}</strong> se carga primero.
            Estos campos se muestran <strong>además</strong> de los campos globales.
          </p>
        </div>
      )}

      {/* Lista de campos */}
      <div className="space-y-2 mb-4">
        {campos.length === 0 && editandoId !== 'nuevo' && (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            Sin campos todavía. Agregá el primero.
          </p>
        )}

        {cargandoCampos ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          </div>
        ) : (
          campos.map((campo, idx) => (
            <div key={campo.id}>
              {editandoId === campo.id ? (
                <EditorCampo
                  inicial={campo}
                  listasOpciones={listasOpciones}
                  onGuardar={(datos) => handleActualizar(campo.id, datos)}
                  onCancelar={() => setEditandoId(null)}
                />
              ) : (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 group hover:border-brand-200 transition-colors">
                  <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" />
                  <span className="text-gray-400 flex-shrink-0">{iconoTipo(campo.field_type)}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800">{campo.field_label}</span>
                    <span className="ml-2 text-xs text-gray-400">{etiquetaTipo(campo.field_type)}</span>
                    {campo.is_required && (
                      <span className="ml-1.5 text-xs text-red-500 font-semibold">*</span>
                    )}
                    {campo.field_width !== 'full' && (
                      <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1 rounded">
                        {campo.field_width === 'half' ? 'Mitad' : 'Tercio'}
                      </span>
                    )}
                  </div>
                  {/* Acciones — visibles al pasar el mouse */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSubir(campo.id)}
                      disabled={idx === 0}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      title="Subir"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleBajar(campo.id)}
                      disabled={idx === campos.length - 1}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      title="Bajar"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditandoId(campo.id)}
                      className="p-1 rounded text-gray-400 hover:text-brand-600"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEliminar(campo.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Editor nuevo campo */}
        {editandoId === 'nuevo' && (
          <EditorCampo
            listasOpciones={listasOpciones}
            onGuardar={handleAgregar}
            onCancelar={() => setEditandoId(null)}
          />
        )}
      </div>

      {/* Botón agregar */}
      {editandoId !== 'nuevo' && (
        <button
          onClick={() => setEditandoId('nuevo')}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar campo
        </button>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────

export function FormBuilderAdmin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('formularios');

  // ── Estado del árbol ──
  const [categorias,      setCategorias]      = useState<CatNode[]>([]);
  const [subcategorias,   setSubcategorias]   = useState<SubNode[]>([]);
  const [subsConVariante, setSubsConVariante] = useState<Set<string>>(new Set());
  const [cargandoCats,    setCargandoCats]    = useState(true);
  const [cargandoSubs,    setCargandoSubs]    = useState(false);

  const [catSeleccionada,  setCatSeleccionada]  = useState<CatNode | null>(null);
  const [expandidosL2,     setExpandidosL2]     = useState<Set<string>>(new Set());
  const [hojaSeleccionada, setHojaSeleccionada] = useState<SubNode | null>(null);

  // Modo: 'global' = formulario de la categoría padre; 'variante' = formulario de subcategoría
  const [modo, setModo] = useState<ModoSeleccion>('global');

  // ── Estado del formulario activo ──
  const [plantilla,      setPlantilla]      = useState<Plantilla | null>(null);
  const [cargandoPlant,  setCargandoPlant]  = useState(false);
  const [listasOpciones, setListasOpciones] = useState<OptionList[]>([]);

  // ── Cargar categorías al montar ──
  useEffect(() => {
    (async () => {
      setCargandoCats(true);
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, display_name, slug, icon, sort_order')
          .eq('is_active', true)
          .order('sort_order');
        if (error) throw error;
        setCategorias(data ?? []);
      } catch {
        notify.error('Error cargando categorías');
      } finally {
        setCargandoCats(false);
      }
    })();
    getOptionLists().then(setListasOpciones).catch(console.error);
  }, []);

  // ── Cargar subcategorías al seleccionar categoría ──
  const seleccionarCategoria = useCallback(async (cat: CatNode) => {
    if (catSeleccionada?.id === cat.id) {
      // Toggle: colapsar si ya está seleccionada
      setCatSeleccionada(null);
      setHojaSeleccionada(null);
      setExpandidosL2(new Set());
      setSubcategorias([]);
      return;
    }
    setCatSeleccionada(cat);
    setHojaSeleccionada(null);
    setExpandidosL2(new Set());
    setSubcategorias([]);
    setSubsConVariante(new Set());
    // Selección inicial: formulario global de esta categoría
    setModo('global');
    cargarPlantilla('global', cat.id, null);
    setCargandoSubs(true);
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, category_id, parent_id, name, display_name, slug, sort_order, is_active')
        .eq('category_id', cat.id)
        .order('sort_order');
      if (error) throw error;
      const subs = data ?? [];
      setSubcategorias(subs);

      // Detectar L2 con variante asignada pero que tienen hijos L3 (variante huérfana)
      const subIds = subs.map((s) => s.id);
      if (subIds.length > 0) {
        const { data: variantes } = await supabase
          .from('form_templates_v2')
          .select('subcategory_id')
          .in('subcategory_id', subIds);
        const idsConVariante = new Set<string>(
          (variantes ?? []).map((v) => v.subcategory_id).filter(Boolean)
        );
        setSubsConVariante(idsConVariante);
      }
    } catch {
      notify.error('Error cargando subcategorías');
    } finally {
      setCargandoSubs(false);
    }
  }, [catSeleccionada]);

  // ── Cargar plantilla según modo y contexto ──
  const cargarPlantilla = useCallback(async (
    modo: ModoSeleccion,
    catId: string,
    subId: string | null
  ) => {
    setCargandoPlant(true);
    setPlantilla(null);
    try {
      let query = supabase
        .from('form_templates_v2')
        .select('id, name, display_name, category_id, subcategory_id, is_active');

      if (modo === 'global') {
        query = query.eq('category_id', catId).is('subcategory_id', null);
      } else {
        query = query.eq('subcategory_id', subId!);
      }

      const { data } = await query.maybeSingle();

      // Si existe pero está inactiva, activarla — el admin edita solo templates activos
      if (data && (data as any).is_active === false) {
        await supabase.from('form_templates_v2').update({ is_active: true }).eq('id', data.id);
      }

      setPlantilla(data ?? null);
    } catch {
      notify.error('Error cargando formulario');
    } finally {
      setCargandoPlant(false);
    }
  }, []);

  // ── Seleccionar hoja (variante) ──
  const seleccionarHoja = useCallback((sub: SubNode) => {
    if (hojaSeleccionada?.id === sub.id && modo === 'variante') return;
    setHojaSeleccionada(sub);
    setModo('variante');
    if (catSeleccionada) cargarPlantilla('variante', catSeleccionada.id, sub.id);
  }, [hojaSeleccionada, modo, catSeleccionada, cargarPlantilla]);

  // ── Seleccionar modo global (click en "Formulario Global") ──
  const seleccionarGlobal = useCallback(() => {
    if (modo === 'global' && !hojaSeleccionada) return;
    setHojaSeleccionada(null);
    setModo('global');
    if (catSeleccionada) cargarPlantilla('global', catSeleccionada.id, null);
  }, [modo, hojaSeleccionada, catSeleccionada, cargarPlantilla]);

  // ── Crear nueva plantilla (upsert por nombre para reparar templates huérfanos) ──
  const crearPlantilla = async () => {
    if (!catSeleccionada) return;
    const esGlobal = modo === 'global';
    const nombre = esGlobal
      ? `${catSeleccionada.slug.replace(/-/g, '_')}_global`
      : hojaSeleccionada!.slug.replace(/-/g, '_');
    const nombreMostrado = esGlobal
      ? `${catSeleccionada.display_name} — Global`
      : hojaSeleccionada!.display_name;
    try {
      // Upsert por name: si ya existe (huérfano de categoría renombrada), reasigna category_id
      const { data, error } = await supabase
        .from('form_templates_v2')
        .upsert({
          name:           nombre,
          display_name:   nombreMostrado,
          category_id:    catSeleccionada.id,
          subcategory_id: esGlobal ? null : hojaSeleccionada!.id,
          is_active:      true,
        }, { onConflict: 'name' })
        .select('id, name, display_name, category_id, subcategory_id')
        .single();
      if (error) throw error;
      setPlantilla(data);
      notify.success('Formulario listo');
    } catch (e: any) {
      notify.error(e?.message ?? 'Error creando formulario');
    }
  };

  // ── Eliminar plantilla variante ──
  const eliminarPlantilla = async () => {
    if (!plantilla) return;
    if (!window.confirm(`¿Eliminar la variante "${plantilla.display_name}" y todos sus campos? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteFormTemplate(plantilla.id);
      setPlantilla(null);
      // Actualizar subsConVariante quitando el id eliminado
      if (hojaSeleccionada) {
        setSubsConVariante((prev) => {
          const next = new Set(prev);
          next.delete(hojaSeleccionada.id);
          return next;
        });
      }
      notify.success('Variante eliminada');
    } catch (e: any) {
      notify.error(e?.message ?? 'Error al eliminar');
    }
  };

  // ── Árbol: helpers ──
  const l2 = subcategorias.filter((s) => s.parent_id === null);
  const hijosDeL2 = (parentId: string) => subcategorias.filter((s) => s.parent_id === parentId);
  const tieneHijos = (id: string) => subcategorias.some((s) => s.parent_id === id);

  const alternarL2 = (id: string) => {
    setExpandidosL2((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Migas de pan ──
  const migasDePan = () => {
    if (!catSeleccionada) return '';
    if (modo === 'global') return `${catSeleccionada.display_name} › Formulario Global`;
    if (!hojaSeleccionada) return catSeleccionada.display_name;
    if (hojaSeleccionada.parent_id) {
      const padre = subcategorias.find((s) => s.id === hojaSeleccionada.parent_id);
      return `${catSeleccionada.display_name} › ${padre?.display_name ?? '...'} › ${hojaSeleccionada.display_name}`;
    }
    return `${catSeleccionada.display_name} › ${hojaSeleccionada.display_name}`;
  };

  const tituloPanel = () => {
    if (!catSeleccionada) return '';
    if (modo === 'global') return `Formulario Global — ${catSeleccionada.display_name}`;
    return hojaSeleccionada?.display_name ?? '';
  };

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Barra de tabs ── */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-gray-200 bg-white shrink-0">
        {([
          { key: 'formularios', label: 'Constructor',        icon: <Wrench        className="w-4 h-4" /> },
          { key: 'listas',      label: 'Listas de Opciones', icon: <ClipboardList className="w-4 h-4" /> },
          { key: 'wizard',      label: 'Wizard',             icon: <Sliders       className="w-4 h-4" /> },
          { key: 'ubicaciones', label: 'Ubicaciones',        icon: <MapPin        className="w-4 h-4" /> },
        ] as { key: AdminTab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Contenido del tab activo ── */}
      {activeTab === 'listas' ? (
        <div className="flex-1 overflow-y-auto p-6">
          <OptionListsTab />
        </div>
      ) : activeTab === 'wizard' ? (
        <div className="flex-1 overflow-y-auto p-6">
          <WizardConfigPanel />
        </div>
      ) : activeTab === 'ubicaciones' ? (
        <div className="flex-1 overflow-y-auto p-6">
          <LocationsAdmin />
        </div>
      ) : (
    <div className="flex bg-gray-50 overflow-hidden flex-1">

      {/* ══ PANEL IZQUIERDO: Árbol ══ */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Categorías y formularios</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cada categoría tiene un formulario global + variantes por subcategoría
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {cargandoCats ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          ) : (
            categorias.map((cat) => {
              const esCatActiva = catSeleccionada?.id === cat.id;
              return (
                <div key={cat.id}>
                  {/* Fila categoría padre */}
                  <button
                    onClick={() => seleccionarCategoria(cat)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors ${
                      esCatActiva ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat.icon && <span className="text-base leading-none">{CATEGORY_ICON_MAP[cat.icon] ?? cat.icon}</span>}
                    <span className="flex-1 truncate">{cat.display_name}</span>
                    {esCatActiva && cargandoSubs
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                      : <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${esCatActiva ? 'rotate-90' : ''}`} />
                    }
                  </button>

                  {/* Árbol expandido de esta categoría */}
                  {esCatActiva && !cargandoSubs && (
                    <div className="ml-2 border-l border-gray-100 pl-1">

                      {/* Entrada "Formulario Global" */}
                      <button
                        onClick={seleccionarGlobal}
                        className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs transition-colors rounded ${
                          modo === 'global'
                            ? 'bg-brand-100 text-brand-700 font-semibold'
                            : 'text-brand-600 hover:bg-brand-50'
                        }`}
                      >
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        <span>Formulario global</span>
                      </button>

                      {/* Divisor */}
                      {l2.length > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1">
                          <Layers className="w-3 h-3 text-gray-300" />
                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Variantes</span>
                        </div>
                      )}

                      {/* Subcategorías nivel 2 */}
                      {l2.map((sub2) => {
                        const hijos = hijosDeL2(sub2.id);
                        const expandido = expandidosL2.has(sub2.id);
                        const esHoja = !tieneHijos(sub2.id);
                        const seleccionado = hojaSeleccionada?.id === sub2.id && modo === 'variante';

                        return (
                          <div key={sub2.id}>
                            <button
                              onClick={() => {
                                if (esHoja) seleccionarHoja(sub2);
                                else alternarL2(sub2.id);
                              }}
                              className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs transition-colors rounded ${
                                seleccionado
                                  ? 'bg-brand-100 text-brand-700 font-semibold'
                                  : esHoja
                                    ? 'text-gray-600 hover:bg-gray-50'
                                    : 'text-gray-700 hover:bg-gray-50'
                              } ${!sub2.is_active ? 'opacity-40' : ''}`}
                            >
                              {!esHoja
                                ? expandido
                                  ? <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
                                  : <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-400" />
                                : <FileText className="w-3 h-3 flex-shrink-0 text-gray-300" />
                              }
                              <span className="flex-1 truncate">{sub2.display_name}</span>
                              {!sub2.is_active && <span className="text-gray-400">·</span>}
                            </button>

                            {/* Nivel 3: entrada "Formulario de [L2]" + hojas L3 */}
                            {!esHoja && expandido && (
                              <div className="ml-4">
                                {/* Entrada formulario del L2 (campos comunes a todos sus tipos) */}
                                <button
                                  onClick={() => seleccionarHoja(sub2)}
                                  className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs transition-colors rounded ${
                                    hojaSeleccionada?.id === sub2.id && modo === 'variante'
                                      ? 'bg-brand-100 text-brand-700 font-semibold'
                                      : 'text-brand-600 hover:bg-brand-50'
                                  }`}
                                >
                                  <Globe className="w-3 h-3 flex-shrink-0" />
                                  <span className="flex-1 truncate italic">Formulario de {sub2.display_name}</span>
                                </button>

                                {/* Hojas L3 */}
                                {hijos.map((sub3) => {
                                  const sel3 = hojaSeleccionada?.id === sub3.id && modo === 'variante';
                                  return (
                                    <button
                                      key={sub3.id}
                                      onClick={() => seleccionarHoja(sub3)}
                                      className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs transition-colors rounded ${
                                        sel3
                                          ? 'bg-brand-100 text-brand-700 font-semibold'
                                          : 'text-gray-500 hover:bg-gray-50'
                                      } ${!sub3.is_active ? 'opacity-40' : ''}`}
                                    >
                                      <FileText className="w-3 h-3 flex-shrink-0 text-gray-300" />
                                      <span className="flex-1 truncate">{sub3.display_name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {l2.length === 0 && (
                        <p className="px-4 py-2 text-xs text-gray-400 italic">Sin subcategorías</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ══ PANEL DERECHO: Editor ══ */}
      <div className="flex-1 overflow-y-auto">
        {!catSeleccionada ? (
          /* Estado vacío inicial */
          <div className="flex flex-col items-center justify-center h-full text-center py-16 px-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-700 mb-2">Seleccioná una categoría</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Elegí una categoría para ver su formulario global, o expandila y seleccioná una subcategoría para editar su variante.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-6">

            {/* Migas de pan + título */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-1">{migasDePan()}</p>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{tituloPanel()}</h2>
                {modo === 'global' ? (
                  <span className="flex items-center gap-1 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                    <Globe className="w-3 h-3" /> Global
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    <FileText className="w-3 h-3" /> Variante
                  </span>
                )}
              </div>

              {/* Descripción del modo */}
              {modo === 'global' && (
                <p className="text-xs text-gray-500 mt-1.5">
                  Los campos de este formulario se muestran en el paso de características para <strong>todas</strong> las subcategorías de {catSeleccionada.display_name}.
                </p>
              )}
            </div>

            {/* Panel de campos */}
            <PanelCampos
              plantilla={plantilla}
              cargando={cargandoPlant}
              modo={modo}
              categoriaGlobal={catSeleccionada.display_name}
              onCrearPlantilla={crearPlantilla}
              onEliminarPlantilla={eliminarPlantilla}
              listasOpciones={listasOpciones}
            />
          </div>
        )}
      </div>
    </div>
    )}
  </div>
  );
}
