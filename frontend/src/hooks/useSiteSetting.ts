/**
 * =====================================================
 * USE SITE SETTINGS HOOK
 * =====================================================
 * Hook para acceder a configuraciones del sitio
 */

import { useState, useEffect } from 'react';
import { getSetting } from '../services/siteSettingsService';

export function useSiteSetting(key: string, defaultValue: string = ''): string {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    let mounted = true;

    const fetchSetting = async () => {
      const settingValue = await getSetting(key);
      if (mounted && settingValue) {
        setValue(settingValue);
      }
    };

    fetchSetting();

    return () => {
      mounted = false;
    };
  }, [key]);

  return value;
}
