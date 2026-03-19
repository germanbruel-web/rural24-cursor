import React, { useState, useCallback } from 'react';
import { supabase } from '../../../../services/supabaseClient';
import { notify } from '../../../../utils/notifications';
import type { CatNode, SubNode, ModoSeleccion } from '../types';

export interface UseCategoryTreeReturn {
  categorias: CatNode[];
  subcategorias: SubNode[];
  subsConVariante: Set<string>;
  cargandoCats: boolean;
  cargandoSubs: boolean;
  catSeleccionada: CatNode | null;
  expandidosL2: Set<string>;
  hojaSeleccionada: SubNode | null;
  setCategorias: React.Dispatch<React.SetStateAction<CatNode[]>>;
  setCargandoCats: React.Dispatch<React.SetStateAction<boolean>>;
  seleccionarCategoria: (cat: CatNode, onCategoriaCargada: (cat: CatNode) => void) => Promise<void>;
  seleccionarHoja: (sub: SubNode, modo: ModoSeleccion, onHojaSeleccionada: (sub: SubNode) => void) => void;
  seleccionarGlobal: (modo: ModoSeleccion, onGlobalSeleccionado: () => void) => void;
  alternarL2: (id: string) => void;
  setSubsConVariante: React.Dispatch<React.SetStateAction<Set<string>>>;
  l2: SubNode[];
  hijosDeL2: (parentId: string) => SubNode[];
  tieneHijos: (id: string) => boolean;
}

export function useCategoryTree(): UseCategoryTreeReturn {
  const [categorias,      setCategorias]      = useState<CatNode[]>([]);
  const [subcategorias,   setSubcategorias]   = useState<SubNode[]>([]);
  const [subsConVariante, setSubsConVariante] = useState<Set<string>>(new Set());
  const [cargandoCats,    setCargandoCats]    = useState(true);
  const [cargandoSubs,    setCargandoSubs]    = useState(false);
  const [catSeleccionada,  setCatSeleccionada]  = useState<CatNode | null>(null);
  const [expandidosL2,     setExpandidosL2]     = useState<Set<string>>(new Set());
  const [hojaSeleccionada, setHojaSeleccionada] = useState<SubNode | null>(null);

  const seleccionarCategoria = useCallback(async (
    cat: CatNode,
    onCategoriaCargada: (cat: CatNode) => void
  ) => {
    if (catSeleccionada?.id === cat.id) {
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
    onCategoriaCargada(cat);

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

  const seleccionarHoja = useCallback((
    sub: SubNode,
    modo: ModoSeleccion,
    onHojaSeleccionada: (sub: SubNode) => void
  ) => {
    if (hojaSeleccionada?.id === sub.id && modo === 'variante') return;
    setHojaSeleccionada(sub);
    onHojaSeleccionada(sub);
  }, [hojaSeleccionada]);

  const seleccionarGlobal = useCallback((
    modo: ModoSeleccion,
    onGlobalSeleccionado: () => void
  ) => {
    if (modo === 'global' && !hojaSeleccionada) return;
    setHojaSeleccionada(null);
    onGlobalSeleccionado();
  }, [hojaSeleccionada]);

  const alternarL2 = useCallback((id: string) => {
    setExpandidosL2((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const l2 = subcategorias.filter((s) => s.parent_id === null);
  const hijosDeL2 = (parentId: string) => subcategorias.filter((s) => s.parent_id === parentId);
  const tieneHijos = (id: string) => subcategorias.some((s) => s.parent_id === id);

  return {
    categorias,
    subcategorias,
    subsConVariante,
    cargandoCats,
    cargandoSubs,
    catSeleccionada,
    expandidosL2,
    hojaSeleccionada,
    setCategorias,
    setCargandoCats,
    seleccionarCategoria,
    seleccionarHoja,
    seleccionarGlobal,
    alternarL2,
    setSubsConVariante,
    l2,
    hijosDeL2,
    tieneHijos,
  };
}
