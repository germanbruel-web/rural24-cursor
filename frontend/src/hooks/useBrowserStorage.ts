import { useState, useCallback } from 'react';

type StorageType = 'local' | 'session';

function getStorage(type: StorageType): Storage {
  return type === 'session' ? sessionStorage : localStorage;
}

function readItem<T>(storage: Storage, key: string, defaultValue: T): T {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Hook para leer/escribir valores en localStorage o sessionStorage.
 * Maneja JSON parse/stringify de forma segura con TypeScript generics.
 *
 * @param key         Clave de storage
 * @param defaultValue Valor por defecto si la clave no existe
 * @param storageType 'local' (default) | 'session'
 *
 * @returns [value, setValue, removeValue]
 *
 * @example
 * const [dismissed, setDismissed, clearDismissed] = useBrowserStorage('banner-dismissed', false);
 */
export function useBrowserStorage<T>(
  key: string,
  defaultValue: T,
  storageType: StorageType = 'local',
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const storage = getStorage(storageType);

  const [storedValue, setStoredValue] = useState<T>(() =>
    readItem(storage, key, defaultValue)
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const next = typeof value === 'function'
          ? (value as (prev: T) => T)(prev)
          : value;
        try {
          storage.setItem(key, JSON.stringify(next));
        } catch {
          // Quota exceeded o Safari private mode — no bloquear UI
        }
        return next;
      });
    },
    [key, storage],
  );

  const removeValue = useCallback(() => {
    storage.removeItem(key);
    setStoredValue(defaultValue);
  }, [key, storage, defaultValue]);

  return [storedValue, setValue, removeValue];
}
