/**
 * AccountContext — Sprint 7A
 * Estado global de "cuenta activa": personal o una empresa del usuario.
 * Persiste en localStorage. Se resetea al logout.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getMyCompanies, type MyCompany } from '../services/empresaService';

// ── Tipos ──────────────────────────────────────────────────────────────────

export type ActiveAccount =
  | { type: 'personal' }
  | { type: 'empresa'; id: string; name: string; logo: string | null; slug: string };

interface AccountContextValue {
  activeAccount: ActiveAccount;
  companies: MyCompany[];
  loadingCompanies: boolean;
  switchTo: (account: ActiveAccount) => void;
  refreshCompanies: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

const STORAGE_KEY = 'rural24_active_account';

function loadFromStorage(): ActiveAccount {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ActiveAccount;
  } catch {
    // ignorar errores de parse
  }
  return { type: 'personal' };
}

function saveToStorage(account: ActiveAccount) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch {
    // ignorar errores de storage
  }
}

// ── Provider ───────────────────────────────────────────────────────────────

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeAccount, setActiveAccount] = useState<ActiveAccount>({ type: 'personal' });
  const [companies, setCompanies] = useState<MyCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Carga de empresas
  const refreshCompanies = useCallback(async () => {
    if (!user) { setCompanies([]); return; }
    setLoadingCompanies(true);
    try {
      const data = await getMyCompanies();
      setCompanies(data);
      return data;
    } finally {
      setLoadingCompanies(false);
    }
  }, [user]);

  // Inicializar al montar / cambio de usuario
  useEffect(() => {
    if (!user) {
      setActiveAccount({ type: 'personal' });
      setCompanies([]);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    // Cargar empresas y validar cuenta guardada
    (async () => {
      const data = await (async () => {
        setLoadingCompanies(true);
        try {
          const d = await getMyCompanies();
          setCompanies(d);
          return d;
        } finally {
          setLoadingCompanies(false);
        }
      })();

      const saved = loadFromStorage();
      if (saved.type === 'empresa') {
        // Verificar que la empresa guardada todavía existe y está activa
        const still = (data ?? []).find(c => c.id === saved.id && c.is_active);
        if (still) {
          setActiveAccount({ type: 'empresa', id: still.id, name: still.company_name, logo: still.logo_url ?? null, slug: still.slug });
        } else {
          setActiveAccount({ type: 'personal' });
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        setActiveAccount({ type: 'personal' });
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchTo = useCallback((account: ActiveAccount) => {
    setActiveAccount(account);
    saveToStorage(account);
  }, []);

  return (
    <AccountContext.Provider value={{ activeAccount, companies, loadingCompanies, switchTo, refreshCompanies }}>
      {children}
    </AccountContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────

export const useAccount = (): AccountContextValue => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
};
