import React, { useState, useCallback } from 'react';
import { supabase } from '../../../../services/supabaseClient';
import { deleteFormTemplate } from '../../../../services/v2/formFieldsService';
import { notify } from '../../../../utils/notifications';
import type { Plantilla, ModoSeleccion } from '../types';

export interface UseFormTemplateReturn {
  plantilla: Plantilla | null;
  cargandoPlant: boolean;
  modo: ModoSeleccion;
  setModo: React.Dispatch<React.SetStateAction<ModoSeleccion>>;
  setPlantilla: React.Dispatch<React.SetStateAction<Plantilla | null>>;
  cargarPlantilla: (modo: ModoSeleccion, catId: string, subId: string | null) => Promise<void>;
  crearPlantilla: (params: CrearPlantillaParams) => Promise<void>;
  eliminarPlantilla: (params: EliminarPlantillaParams) => Promise<void>;
}

export interface CrearPlantillaParams {
  catSlug: string;
  catId: string;
  catDisplayName: string;
  subSlug?: string;
  subId?: string;
  subDisplayName?: string;
  esGlobal: boolean;
}

export interface EliminarPlantillaParams {
  plantilla: Plantilla;
  hojaId?: string;
  onSubsConVarianteUpdate: (hojaId: string) => void;
}

export function useFormTemplate(): UseFormTemplateReturn {
  const [plantilla,     setPlantilla]     = useState<Plantilla | null>(null);
  const [cargandoPlant, setCargandoPlant] = useState(false);
  const [modo,          setModo]          = useState<ModoSeleccion>('global');

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

  const crearPlantilla = useCallback(async (params: CrearPlantillaParams) => {
    const { catSlug, catId, catDisplayName, subSlug, subId, subDisplayName, esGlobal } = params;
    const nombre = esGlobal
      ? `${catSlug.replace(/-/g, '_')}_global`
      : subSlug!.replace(/-/g, '_');
    const nombreMostrado = esGlobal
      ? `${catDisplayName} — Global`
      : subDisplayName!;
    try {
      const { data, error } = await supabase
        .from('form_templates_v2')
        .upsert({
          name:           nombre,
          display_name:   nombreMostrado,
          category_id:    catId,
          subcategory_id: esGlobal ? null : subId!,
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
  }, []);

  const eliminarPlantilla = useCallback(async (params: EliminarPlantillaParams) => {
    const { plantilla, hojaId, onSubsConVarianteUpdate } = params;
    if (!plantilla) return;
    if (!window.confirm(`¿Eliminar la variante "${plantilla.display_name}" y todos sus campos? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteFormTemplate(plantilla.id);
      setPlantilla(null);
      if (hojaId) {
        onSubsConVarianteUpdate(hojaId);
      }
      notify.success('Variante eliminada');
    } catch (e: any) {
      notify.error(e?.message ?? 'Error al eliminar');
    }
  }, []);

  return {
    plantilla,
    cargandoPlant,
    modo,
    setModo,
    setPlantilla,
    cargarPlantilla,
    crearPlantilla,
    eliminarPlantilla,
  };
}
