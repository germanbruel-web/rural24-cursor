/**
 * AccountSwitcher — Sprint 7A
 * Dropdown para cambiar entre cuenta personal y empresas del usuario.
 * Se integra en UserMenu (desktop) y HeaderNew mobile.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Building2, User, ChevronDown, Check, Plus } from 'lucide-react';
import { useAccount, type ActiveAccount } from '../../contexts/AccountContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Page } from '../../../App';

interface AccountSwitcherProps {
  onNavigate: (page: Page) => void;
  /** Modo compacto (solo avatar+chevron, sin nombre) */
  compact?: boolean;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ onNavigate, compact = false }) => {
  const { user, profile } = useAuth();
  const { activeAccount, companies, switchTo } = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al clickear fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) return null;

  const ownerCompanies = companies.filter(c => c.role === 'owner' && c.is_active);

  // ── Avatar actual ─────────────────────────────────────────────────────────
  const renderCurrentAvatar = () => {
    if (activeAccount.type === 'empresa' && activeAccount.logo) {
      return (
        <img
          src={activeAccount.logo}
          alt={activeAccount.name}
          className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-600 ring-offset-1"
        />
      );
    }
    if (activeAccount.type === 'empresa') {
      return (
        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center ring-2 ring-brand-600 ring-offset-1">
          <Building2 className="w-4 h-4 text-brand-600" />
        </div>
      );
    }
    // Personal
    if (profile?.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? 'Cuenta personal'}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white shadow-sm">
        {(profile?.full_name?.charAt(0) ?? user.email?.charAt(0) ?? 'U').toUpperCase()}
      </div>
    );
  };

  // ── Nombre en el botón ────────────────────────────────────────────────────
  const currentName = activeAccount.type === 'empresa'
    ? activeAccount.name
    : (profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Yo');

  // ── Handle switch ─────────────────────────────────────────────────────────
  const handleSwitch = (account: ActiveAccount) => {
    switchTo(account);
    setOpen(false);
  };

  const isActive = (account: ActiveAccount) => {
    if (account.type === 'personal' && activeAccount.type === 'personal') return true;
    if (account.type === 'empresa' && activeAccount.type === 'empresa') {
      return account.id === activeAccount.id;
    }
    return false;
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors group"
        title={activeAccount.type === 'empresa' ? activeAccount.name : 'Mi cuenta personal'}
      >
        {renderCurrentAvatar()}

        {!compact && (
          <span className="hidden xl:inline text-sm font-medium text-gray-700 group-hover:text-gray-900 max-w-[90px] truncate">
            {currentName}
          </span>
        )}

        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden">

          {/* Encabezado */}
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Publicar como</p>
          </div>

          <div className="py-1">
            {/* Cuenta personal */}
            <button
              onClick={() => handleSwitch({ type: 'personal' })}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Personal" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                    {(profile?.full_name?.charAt(0) ?? 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name ?? user.email?.split('@')[0] ?? 'Mi cuenta'}
                </p>
                <p className="text-xs text-gray-500">Cuenta personal</p>
              </div>
              {isActive({ type: 'personal' }) && (
                <Check className="w-4 h-4 text-brand-600 shrink-0" />
              )}
            </button>

            {/* Empresas */}
            {ownerCompanies.length > 0 && (
              <>
                <div className="mx-4 my-1 border-t border-gray-100" />
                <div className="px-4 py-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mis empresas</p>
                </div>
                {ownerCompanies.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSwitch({ type: 'empresa', id: c.id, name: c.company_name, logo: c.logo_url ?? null, slug: c.slug })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="shrink-0">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.company_name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-brand-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.company_name}</p>
                      {c.tagline && <p className="text-xs text-gray-500 truncate">{c.tagline}</p>}
                      {!c.tagline && <p className="text-xs text-gray-500">Empresa</p>}
                    </div>
                    {isActive({ type: 'empresa', id: c.id, name: c.company_name, logo: null, slug: c.slug }) && (
                      <Check className="w-4 h-4 text-brand-600 shrink-0" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Footer: Administrar / Crear */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { onNavigate('mis-empresas'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Building2 className="w-4 h-4 text-gray-400" />
              Administrar empresas
            </button>
            <button
              onClick={() => { onNavigate('mis-empresas'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Crear nueva empresa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSwitcher;
