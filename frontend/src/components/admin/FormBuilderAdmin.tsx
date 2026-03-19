import React, { useState, useEffect } from 'react';
import {
  Globe,
  FileText,
  Layers,
  Wrench,
  ClipboardList,
  Sliders,
  MapPin,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { getOptionLists } from '../../services/v2/optionListsService';
import type { OptionList } from '../../services/v2/optionListsService';
import { notify } from '../../utils/notifications';
import { OptionListsTab } from './OptionListsTab';
import { WizardConfigPanel } from './WizardConfigPanel';
import { LocationsAdmin } from './LocationsAdmin';
import { useCategoryTree } from './form-builder/hooks/useCategoryTree';
import { useFormTemplate } from './form-builder/hooks/useFormTemplate';
import { CategoryTree } from './form-builder/components/CategoryTree';
import { FieldList } from './form-builder/components/FieldList';
import type { CatNode, SubNode } from './form-builder/types';

type AdminTab = 'formularios' | 'listas' | 'wizard' | 'ubicaciones';

export function FormBuilderAdmin() {
  const [activeTab,      setActiveTab]      = useState<AdminTab>('formularios');
  const [listasOpciones, setListasOpciones] = useState<OptionList[]>([]);

  const tree = useCategoryTree();
  const form = useFormTemplate();

  useEffect(() => {
    (async () => {
      tree.setCargandoCats(true);
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, display_name, slug, icon, sort_order')
          .eq('is_active', true)
          .order('sort_order');
        if (error) throw error;
        tree.setCategorias(data ?? []);
      } catch {
        notify.error('Error cargando categorías');
      } finally {
        tree.setCargandoCats(false);
      }
    })();
    getOptionLists().then(setListasOpciones).catch(console.error);
  }, []);

  const handleSeleccionarCategoria = (cat: CatNode) => {
    tree.seleccionarCategoria(cat, (c) => {
      form.setModo('global');
      form.cargarPlantilla('global', c.id, null);
    });
  };

  const handleSeleccionarGlobal = () => {
    tree.seleccionarGlobal(form.modo, () => {
      form.setModo('global');
      if (tree.catSeleccionada) form.cargarPlantilla('global', tree.catSeleccionada.id, null);
    });
  };

  const handleSeleccionarHoja = (sub: SubNode) => {
    tree.seleccionarHoja(sub, form.modo, (s) => {
      form.setModo('variante');
      if (tree.catSeleccionada) form.cargarPlantilla('variante', tree.catSeleccionada.id, s.id);
    });
  };

  const handleCrearPlantilla = async () => {
    if (!tree.catSeleccionada) return;
    await form.crearPlantilla({
      catSlug:        tree.catSeleccionada.slug,
      catId:          tree.catSeleccionada.id,
      catDisplayName: tree.catSeleccionada.display_name,
      subSlug:        tree.hojaSeleccionada?.slug,
      subId:          tree.hojaSeleccionada?.id,
      subDisplayName: tree.hojaSeleccionada?.display_name,
      esGlobal:       form.modo === 'global',
    });
  };

  const handleEliminarPlantilla = async () => {
    if (!form.plantilla) return;
    await form.eliminarPlantilla({
      plantilla: form.plantilla,
      hojaId:    tree.hojaSeleccionada?.id,
      onSubsConVarianteUpdate: (hojaId) => {
        tree.setSubsConVariante((prev) => {
          const next = new Set(prev);
          next.delete(hojaId);
          return next;
        });
      },
    });
  };

  const migasDePan = () => {
    const cat = tree.catSeleccionada;
    if (!cat) return '';
    if (form.modo === 'global') return `${cat.display_name} › Formulario Global`;
    if (!tree.hojaSeleccionada) return cat.display_name;
    if (tree.hojaSeleccionada.parent_id) {
      const padre = tree.subcategorias.find((s) => s.id === tree.hojaSeleccionada!.parent_id);
      return `${cat.display_name} › ${padre?.display_name ?? '...'} › ${tree.hojaSeleccionada.display_name}`;
    }
    return `${cat.display_name} › ${tree.hojaSeleccionada.display_name}`;
  };

  const tituloPanel = () => {
    const cat = tree.catSeleccionada;
    if (!cat) return '';
    if (form.modo === 'global') return `Formulario Global — ${cat.display_name}`;
    return tree.hojaSeleccionada?.display_name ?? '';
  };

  return (
    <div className="flex flex-col bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Barra de tabs */}
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

      {/* Contenido del tab activo */}
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

          {/* Panel izquierdo: árbol */}
          <CategoryTree
            categorias={tree.categorias}
            subcategorias={tree.subcategorias}
            cargandoCats={tree.cargandoCats}
            cargandoSubs={tree.cargandoSubs}
            catSeleccionada={tree.catSeleccionada}
            expandidosL2={tree.expandidosL2}
            hojaSeleccionada={tree.hojaSeleccionada}
            modo={form.modo}
            l2={tree.l2}
            hijosDeL2={tree.hijosDeL2}
            tieneHijos={tree.tieneHijos}
            onSeleccionarCategoria={handleSeleccionarCategoria}
            onSeleccionarGlobal={handleSeleccionarGlobal}
            onSeleccionarHoja={handleSeleccionarHoja}
            onAlternarL2={tree.alternarL2}
          />

          {/* Panel derecho: editor */}
          <div className="flex-1 overflow-y-auto">
            {!tree.catSeleccionada ? (
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
                <div className="mb-5">
                  <p className="text-xs text-gray-500 mb-1">{migasDePan()}</p>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">{tituloPanel()}</h2>
                    {form.modo === 'global' ? (
                      <span className="flex items-center gap-1 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                        <Globe className="w-3 h-3" /> Global
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        <FileText className="w-3 h-3" /> Variante
                      </span>
                    )}
                  </div>
                  {form.modo === 'global' && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      Los campos de este formulario se muestran en el paso de características para <strong>todas</strong> las subcategorías de {tree.catSeleccionada.display_name}.
                    </p>
                  )}
                </div>

                <FieldList
                  plantilla={form.plantilla}
                  cargando={form.cargandoPlant}
                  modo={form.modo}
                  categoriaGlobal={tree.catSeleccionada.display_name}
                  onCrearPlantilla={handleCrearPlantilla}
                  onEliminarPlantilla={handleEliminarPlantilla}
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
