import { useState, useEffect } from 'react';
import { getOptionListItemsByName } from '../services/v2/optionListsService';

// Cache de módulo: evita re-fetches entre renders y entre instancias del componente
const _cache = new Map<string, Record<string, string>>();

/**
 * Retorna un mapa { value → label } para una option_list de la DB.
 * - Carga asíncrona con cache de módulo (no re-fetchea en el mismo ciclo de vida de la app)
 * - Mientras carga: retorna {} — el consumidor debe usar `labels[val] || val` como fallback
 *
 * @param listName  Nombre/slug de la lista en la tabla option_lists
 */
export function useOptionListLabels(listName: string): Record<string, string> {
  const [labels, setLabels] = useState<Record<string, string>>(
    () => _cache.get(listName) ?? {}
  );

  useEffect(() => {
    if (_cache.has(listName)) return;
    getOptionListItemsByName(listName).then(items => {
      const map = Object.fromEntries(items.map(i => [i.value, i.label]));
      _cache.set(listName, map);
      setLabels(map);
    }).catch(() => {
      // Si la lista no existe en DB, deja el map vacío — el fallback || val aplica
      _cache.set(listName, {});
    });
  }, [listName]);

  return labels;
}
