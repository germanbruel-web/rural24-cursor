import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, UserType } from '../../types';

interface DevUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  user_type: UserType;
  email_verified: boolean;
  subscription_status: 'active' | 'inactive' | 'expired';
}

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  devUser: DevUser | null;
  setDevUser: (user: DevUser | null) => void;
  availableUsers: DevUser[];
}

const DEV_USERS: DevUser[] = [
  {
    id: 'dev-superadmin',
    email: 'superadmin@dev.com',
    full_name: 'SuperAdmin Dev',
    role: 'superadmin',
    user_type: 'particular',
    email_verified: true,
    subscription_status: 'active',
  },
  {
    id: 'dev-revendedor',
    email: 'revendedor@dev.com',
    full_name: 'Revendedor Dev',
    role: 'revendedor',
    user_type: 'empresa',
    email_verified: true,
    subscription_status: 'active',
  },
  {
    id: 'dev-free-empresa',
    email: 'empresa@dev.com',
    full_name: 'Free Empresa Dev',
    role: 'free',
    user_type: 'empresa',
    email_verified: true,
    subscription_status: 'inactive',
  },
  {
    id: 'dev-free-particular',
    email: 'free@dev.com',
    full_name: 'Free Particular Dev',
    role: 'free',
    user_type: 'particular',
    email_verified: true,
    subscription_status: 'inactive',
  },
];

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export const DevModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDevMode, setIsDevMode] = useState(false); // DESACTIVADO por defecto - usar usuarios reales
  const [devUser, setDevUser] = useState<DevUser | null>(null);

  // Persistir en localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('devMode');
    const savedUser = localStorage.getItem('devUser');
    
    if (savedMode !== null) {
      setIsDevMode(savedMode === 'true');
    }
    
    if (savedUser) {
      try {
        setDevUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing saved dev user', e);
      }
    }
  }, []);

  const toggleDevMode = () => {
    const newMode = !isDevMode;
    setIsDevMode(newMode);
    localStorage.setItem('devMode', String(newMode));
    
    // Si desactiva dev mode, limpiar usuario
    if (!newMode) {
      setDevUser(null);
      localStorage.removeItem('devUser');
    } else {
      // Si activa dev mode, setear superadmin por defecto
      const defaultUser = DEV_USERS[0];
      setDevUser(defaultUser);
      localStorage.setItem('devUser', JSON.stringify(defaultUser));
    }
  };

  const handleSetDevUser = (user: DevUser | null) => {
    setDevUser(user);
    if (user) {
      localStorage.setItem('devUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('devUser');
    }
  };

  return (
    <DevModeContext.Provider
      value={{
        isDevMode,
        toggleDevMode,
        devUser,
        setDevUser: handleSetDevUser,
        availableUsers: DEV_USERS,
      }}
    >
      {children}
    </DevModeContext.Provider>
  );
};

export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within DevModeProvider');
  }
  return context;
};
