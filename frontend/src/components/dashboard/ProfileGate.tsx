// ============================================================================
// PROFILE GATE — Sprint 7B
// ============================================================================
// Gate bloqueante: para publicar en subcategorías tipo "Servicios" el usuario
// debe tener al menos un perfil de empresa registrado en Rural24.
// Si no tiene empresa → muestra este panel (reemplaza el contenido del step).
// Si su plan no permite crear empresa (FREE) → muestra CTA de upgrade.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Building2, ArrowRight, Star } from 'lucide-react';
import { getMaxCompaniesAllowed } from '../../services/empresaService';
import type { MyCompany } from '../../services/empresaService';
import { EmpresaForm } from './EmpresaForm';

interface ProfileGateProps {
  /** Nombre de la subcategoría seleccionada (para mensaje contextual) */
  subcategoryDisplayName?: string;
  /** Callback cuando la empresa fue creada exitosamente */
  onEmpresaCreated: (empresa: MyCompany) => void;
}

export function ProfileGate({ subcategoryDisplayName, onEmpresaCreated }: ProfileGateProps) {
  const [canCreate, setCanCreate] = useState<boolean | null>(null); // null = cargando
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getMaxCompaniesAllowed().then((max) => setCanCreate(max > 0));
  }, []);

  const contextLabel = subcategoryDisplayName
    ? `publicar en ${subcategoryDisplayName}`
    : 'ofrecer servicios en Rural24';

  return (
    <>
      <div className="py-8 sm:py-12 flex flex-col items-center text-center gap-6">
        {/* Ícono */}
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-brand-600" />
        </div>

        {/* Título y descripción */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            Necesitás un perfil de empresa
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Para {contextLabel} es obligatorio tener un perfil de empresa en Rural24.
            Tu perfil aparecerá vinculado a los avisos que publiques.
          </p>
        </div>

        {/* Loading */}
        {canCreate === null && (
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        )}

        {/* CTA — puede crear empresa */}
        {canCreate === true && (
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold rounded-xl transition-colors"
            >
              <Building2 className="w-5 h-5" />
              Crear mi perfil de empresa
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-400">
              Solo toma unos minutos. Podés editarlo después.
            </p>
          </div>
        )}

        {/* CTA — plan FREE, no puede crear empresa */}
        {canCreate === false && (
          <div className="space-y-4 w-full max-w-sm">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                <Star className="w-4 h-4" />
                Función exclusiva Premium
              </div>
              <p className="text-sm text-amber-700">
                Tu plan actual no incluye la creación de perfiles de empresa.
                Upgradear a Premium te permite publicar servicios, crear tu empresa y destacar avisos.
              </p>
            </div>
            <button
              onClick={() => window.location.hash = '#/upgrade'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
            >
              <Star className="w-5 h-5" />
              Ver planes Premium
            </button>
          </div>
        )}
      </div>

      {/* EmpresaForm — drawer reutilizado */}
      {showForm && (
        <EmpresaForm
          empresa={null}
          onClose={() => setShowForm(false)}
          onSaved={(empresa) => {
            setShowForm(false);
            onEmpresaCreated(empresa);
          }}
        />
      )}
    </>
  );
}
