import React, { useEffect, useState } from 'react';
import { Building2, ChevronDown, CheckCircle } from 'lucide-react';
import { getMyCompanies, type MyCompany } from '../../services/empresaService';

interface EmpresaSelectorWidgetProps {
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

/**
 * Widget inline para PublicarAviso.
 * Permite asociar el aviso a una de las empresas del usuario.
 * Se auto-oculta si el usuario no tiene empresas activas.
 */
export const EmpresaSelectorWidget: React.FC<EmpresaSelectorWidgetProps> = ({
  selectedId,
  onChange,
}) => {
  const [companies, setCompanies] = useState<MyCompany[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getMyCompanies().then(all => {
      const active = all.filter(c => c.is_active && c.role === 'owner');
      setCompanies(active);
      setLoaded(true);
    });
  }, []);

  // No renderizar si no hay empresas
  if (!loaded || companies.length === 0) return null;

  const selected = companies.find(c => c.id === selectedId) ?? null;

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
        <span className="text-sm font-semibold text-gray-700">
          ¿Publicar en nombre de una empresa?
        </span>
        <span className="text-xs text-gray-400">(opcional)</span>
      </div>

      {/* Opción: particular */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selectedId === null
            ? 'border-brand-600 bg-brand-600'
            : 'border-gray-300 group-hover:border-brand-400'
        }`}>
          {selectedId === null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <input
          type="radio"
          className="sr-only"
          checked={selectedId === null}
          onChange={() => onChange(null)}
        />
        <span className="text-sm text-gray-700">Publicar como particular</span>
      </label>

      {/* Opciones de empresa */}
      {companies.length <= 3 ? (
        // Lista directa si hay pocas empresas
        companies.map(empresa => (
          <label key={empresa.id} className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selectedId === empresa.id
                ? 'border-brand-600 bg-brand-600'
                : 'border-gray-300 group-hover:border-brand-400'
            }`}>
              {selectedId === empresa.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <input
              type="radio"
              className="sr-only"
              checked={selectedId === empresa.id}
              onChange={() => onChange(empresa.id)}
            />
            <div className="flex items-center gap-2 min-w-0">
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt={empresa.company_name}
                  className="w-5 h-5 rounded object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded bg-brand-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-3 h-3 text-brand-500" />
                </div>
              )}
              <span className="text-sm text-gray-700 truncate">{empresa.company_name}</span>
              {empresa.is_verified && (
                <CheckCircle className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              )}
            </div>
          </label>
        ))
      ) : (
        // Dropdown si hay muchas empresas
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-brand-400 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              {selected ? (
                <>
                  {selected.logo_url ? (
                    <img
                      src={selected.logo_url}
                      alt={selected.company_name}
                      className="w-5 h-5 rounded object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded bg-brand-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-3 h-3 text-brand-500" />
                    </div>
                  )}
                  <span className="truncate text-gray-900">{selected.company_name}</span>
                </>
              ) : (
                <span className="text-gray-500">Seleccioná una empresa...</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedId === null ? 'text-brand-600 font-medium' : 'text-gray-700'}`}
              >
                Publicar como particular
              </button>
              {companies.map(empresa => (
                <button
                  key={empresa.id}
                  type="button"
                  onClick={() => { onChange(empresa.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${selectedId === empresa.id ? 'text-brand-600 font-medium bg-brand-50' : 'text-gray-700'}`}
                >
                  {empresa.logo_url ? (
                    <img src={empresa.logo_url} alt={empresa.company_name} className="w-5 h-5 rounded object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded bg-brand-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-3 h-3 text-brand-500" />
                    </div>
                  )}
                  <span className="truncate">{empresa.company_name}</span>
                  {empresa.is_verified && <CheckCircle className="w-3.5 h-3.5 text-brand-500 shrink-0 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info contextual cuando hay empresa seleccionada */}
      {selected && (
        <p className="text-xs text-gray-500 pl-7">
          El aviso mostrará el botón "Ver Perfil de Empresa" si lo tenés activado en la configuración de la empresa.
        </p>
      )}
    </div>
  );
};
