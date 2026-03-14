import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { getLocalitiesByProvince, type Locality } from '../../../services/v2/locationsService';
import { Card } from '../../molecules/Card';
import type { WizardBlockProps } from '../wizardTypes';

const inp = 'w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400';
const lbl = 'block text-sm font-semibold text-gray-700 mb-2';

interface Props extends Pick<WizardBlockProps,
  'province' | 'setProvince' | 'locality' | 'setLocality' | 'provinces'
> {}

export function LocationBlock({ province, setProvince, locality, setLocality, provinces }: Props) {
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [localities, setLocalities] = useState<Locality[]>([]);

  // Sincronizar selectedProvinceId si province ya viene seteado (modo edición)
  useEffect(() => {
    if (province && provinces.length > 0 && !selectedProvinceId) {
      const found = provinces.find(p => p.name === province);
      if (found) setSelectedProvinceId(found.id);
    }
  }, [province, provinces]);

  useEffect(() => {
    if (!selectedProvinceId) { setLocalities([]); return; }
    getLocalitiesByProvince(selectedProvinceId).then(setLocalities);
  }, [selectedProvinceId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          ¿Dónde está ubicado?
        </h2>
        <p className="text-base sm:text-lg text-gray-600">
          Indicá la ubicación para que los compradores te encuentren
        </p>
      </div>

      <div className="space-y-4">
        <Card variant="default" padding="md">
          <label className={lbl}>
            Provincia <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProvinceId}
            onChange={(e) => {
              const prov = provinces.find(p => p.id === e.target.value);
              setSelectedProvinceId(e.target.value);
              setProvince(prov?.name ?? '');
              setLocality('');
            }}
            className={inp}
          >
            <option value="">Seleccionar provincia</option>
            {provinces.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Card>

        <Card variant="default" padding="md">
          <label className={lbl}>
            Localidad {selectedProvinceId && <span className="text-red-500">*</span>}
          </label>
          {selectedProvinceId ? (
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className={inp}
            >
              <option value="">Seleccionar localidad</option>
              {localities.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          ) : (
            <div className="w-full px-4 py-3 text-base rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed flex items-center">
              Seleccioná primero una provincia
            </div>
          )}
        </Card>
      </div>

      <div className="flex items-start gap-3 p-5 sm:p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm sm:text-base text-blue-900">
          <p className="font-bold mb-2">Tu privacidad es importante</p>
          <p>
            Solo se mostrará la provincia públicamente. Los detalles
            específicos se compartirán solo cuando alguien se contacte con vos.
          </p>
        </div>
      </div>
    </div>
  );
}
