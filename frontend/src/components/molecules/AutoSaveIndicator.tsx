/**
 * AutoSaveIndicator - Visual feedback de guardado automático
 */

import React, { useState, useEffect } from 'react';
import { Check, Cloud, AlertCircle } from 'lucide-react';

interface AutoSaveIndicatorProps {
  lastSaved: number | null;
  error?: string | null;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ lastSaved, error }) => {
  const [timeSince, setTimeSince] = useState('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeSince = () => {
      const seconds = Math.floor((Date.now() - lastSaved) / 1000);
      
      if (seconds < 5) {
        setTimeSince('Ahora');
      } else if (seconds < 60) {
        setTimeSince(`${seconds}s`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeSince(`${minutes}m`);
      }
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 5000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!lastSaved) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400 px-2 py-1" title="Sin cambios">
        <Cloud className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sin cambios</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-brand-500 bg-brand-50 px-2 py-1 rounded" title={`Guardado hace ${timeSince}`}>
      <Check className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="hidden sm:inline">{timeSince}</span>
    </div>
  );
};
