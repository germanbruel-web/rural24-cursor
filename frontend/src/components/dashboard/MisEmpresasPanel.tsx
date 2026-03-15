import React, { useEffect, useState } from 'react';
import {
  Building2, Plus, Eye, EyeOff, BarChart2, CheckCircle,
  Pencil, Trash2, ToggleLeft, ToggleRight, ExternalLink, Loader2
} from 'lucide-react';
import {
  getMyCompanies, toggleEmpresaActiva, deleteEmpresa, getMaxCompaniesAllowed,
  type MyCompany,
} from '../../services/empresaService';
import { EmpresaForm } from './EmpresaForm';

export const MisEmpresasPanel: React.FC = () => {
  const [companies, setCompanies] = useState<MyCompany[]>([]);
  const [maxAllowed, setMaxAllowed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MyCompany | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [data, max] = await Promise.all([getMyCompanies(), getMaxCompaniesAllowed()]);
    setCompanies(data);
    setMaxAllowed(max);
    setLoading(false);
  };

  const handleToggleActiva = async (empresa: MyCompany) => {
    setTogglingId(empresa.id);
    try {
      await toggleEmpresaActiva(empresa.id, !empresa.is_active);
      setCompanies(prev => prev.map(c =>
        c.id === empresa.id ? { ...c, is_active: !c.is_active } : c
      ));
    } catch {
      setError('No se pudo cambiar el estado de la empresa.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (empresa: MyCompany) => {
    if (!window.confirm(`¿Eliminar "${empresa.company_name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(empresa.id);
    try {
      await deleteEmpresa(empresa.id);
      setCompanies(prev => prev.filter(c => c.id !== empresa.id));
    } catch {
      setError('No se pudo eliminar la empresa.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = (saved: MyCompany) => {
    setCompanies(prev => {
      const exists = prev.find(c => c.id === saved.id);
      return exists
        ? prev.map(c => c.id === saved.id ? saved : c)
        : [saved, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const canCreate = companies.filter(c => c.role === 'owner').length < maxAllowed;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-600" />
            Mis Empresas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {companies.length} de {maxAllowed === 99 ? '∞' : maxAllowed} empresa{maxAllowed !== 1 ? 's' : ''} disponibles en tu plan
          </p>
        </div>

        {maxAllowed > 0 && (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            disabled={!canCreate}
            title={canCreate ? undefined : 'Límite de empresas alcanzado. Mejorá tu plan.'}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Nueva empresa
          </button>
        )}
      </div>

      {/* Error inline */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-4 font-semibold">✕</button>
        </div>
      )}

      {/* Plan FREE — upgrade CTA */}
      {maxAllowed === 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-6 text-center">
          <Building2 className="w-12 h-12 text-brand-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Páginas de Empresa</h2>
          <p className="text-gray-600 text-sm mb-4 max-w-md mx-auto">
            Creá tu página de empresa, mostrá tu catálogo y conectá con compradores de todo el país.
            Disponible desde el plan Premium.
          </p>
          <a
            href="#/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Ver planes
          </a>
        </div>
      )}

      {/* Lista de empresas */}
      {maxAllowed > 0 && companies.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Todavía no tenés empresas creadas.</p>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primera empresa
          </button>
        </div>
      )}

      {companies.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {companies.map(empresa => (
            <EmpresaCard
              key={empresa.id}
              empresa={empresa}
              toggling={togglingId === empresa.id}
              deleting={deletingId === empresa.id}
              onEdit={() => { setEditing(empresa); setShowForm(true); }}
              onToggle={() => handleToggleActiva(empresa)}
              onDelete={() => handleDelete(empresa)}
            />
          ))}
        </div>
      )}

      {/* Drawer form */}
      {showForm && (
        <EmpresaForm
          empresa={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

// ── CompletenessBar ─────────────────────────────────────────────────────────

const COMPLETENESS_FIELDS: { key: keyof MyCompany; label: string }[] = [
  { key: 'logo_url',    label: 'Logo' },
  { key: 'cover_url',  label: 'Imagen de portada' },
  { key: 'tagline',    label: 'Eslogan' },
  { key: 'description', label: 'Descripción' },
  { key: 'province',   label: 'Ubicación' },
];

function computeCompleteness(empresa: MyCompany) {
  const filled = COMPLETENESS_FIELDS.filter(f => !!empresa[f.key]);
  return {
    percent: Math.round((filled.length / COMPLETENESS_FIELDS.length) * 100),
    missing: COMPLETENESS_FIELDS.filter(f => !empresa[f.key]).map(f => f.label),
  };
}

const CompletenessBar: React.FC<{ empresa: MyCompany; onEdit: () => void }> = ({ empresa, onEdit }) => {
  const { percent, missing } = computeCompleteness(empresa);
  if (percent === 100) return null;

  const color =
    percent < 40 ? 'bg-red-400' :
    percent < 80 ? 'bg-brand-400' :
    'bg-brand-500';

  return (
    <div className="px-5 pb-4 pt-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">
          Perfil {percent}% completo — falta: {missing.join(', ')}
        </span>
        <button
          onClick={onEdit}
          className="text-xs text-brand-600 hover:underline font-medium"
        >
          Completar
        </button>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

// ── EmpresaCard ─────────────────────────────────────────────────────────────

interface EmpresaCardProps {
  empresa: MyCompany;
  toggling: boolean;
  deleting: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const EmpresaCard: React.FC<EmpresaCardProps> = ({
  empresa, toggling, deleting, onEdit, onToggle, onDelete,
}) => {
  return (
    <div className={`bg-white rounded-xl border transition-all ${
      empresa.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'
    }`}>
      <div className="p-5 flex items-start gap-4">

        {/* Logo / Avatar */}
        <div className="shrink-0">
          {empresa.logo_url ? (
            <img
              src={empresa.logo_url}
              alt={empresa.company_name}
              className="w-14 h-14 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-brand-100 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-brand-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{empresa.company_name}</h3>

            {empresa.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />Verificada
              </span>
            )}

            {!empresa.is_active && (
              <span className="text-xs text-gray-400 font-medium">Inactiva</span>
            )}

            <span className="text-xs text-gray-400">
              Rol: <span className="font-medium text-gray-600">{empresa.role}</span>
            </span>
          </div>

          {empresa.tagline && (
            <p className="text-sm text-gray-500 truncate mb-2">{empresa.tagline}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5" />
              {empresa.ads_count} aviso{empresa.ads_count !== 1 ? 's' : ''} activo{empresa.ads_count !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {empresa.profile_views} vista{empresa.profile_views !== 1 ? 's' : ''}
            </span>
            {empresa.province && <span>{empresa.province}{empresa.city ? ` · ${empresa.city}` : ''}</span>}
            <span className="flex items-center gap-1">
              {empresa.owner_public
                ? <><Eye className="w-3.5 h-3.5 text-brand-500" />Dueño visible</>
                : <><EyeOff className="w-3.5 h-3.5" />Dueño oculto</>
              }
            </span>
          </div>
        </div>

        {/* Acciones — solo owner */}
        {empresa.role === 'owner' && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Ver página pública */}
            <a
              href={`#/empresa/${empresa.slug}`}
              title="Ver página pública"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Editar */}
            <button
              onClick={onEdit}
              title="Editar empresa"
              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Toggle activa */}
            <button
              onClick={onToggle}
              disabled={toggling}
              title={empresa.is_active ? 'Desactivar empresa' : 'Activar empresa'}
              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {toggling
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : empresa.is_active
                  ? <ToggleRight className="w-4 h-4 text-brand-500" />
                  : <ToggleLeft className="w-4 h-4" />
              }
            </button>

            {/* Eliminar */}
            <button
              onClick={onDelete}
              disabled={deleting}
              title="Eliminar empresa"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />
              }
            </button>
          </div>
        )}
      </div>

      {empresa.role === 'owner' && (
        <CompletenessBar empresa={empresa} onEdit={onEdit} />
      )}
    </div>
  );
};
