import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { UserRole } from '../types/v2';
import { useDevMode } from './DevModeContext';
import { logger } from '../utils/logger';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  mobile?: string;
  mobile_verified?: boolean;
  province?: string;
  location?: string;
  role: UserRole;
  user_type?: 'particular' | 'empresa';
  plan_name?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  // Campos unificados de perfil profesional
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  services?: string;
  privacy_mode?: 'public' | 'private';
  profile_views?: number;
  profile_contacts_received?: number;
  // Ubicación extendida
  domicilio?: string;
  calle?: string;
  altura?: string;
  piso_dpto?: string;
  codigo_postal?: string;
  // Facturación
  cuit?: string;
  billing_same_address?: boolean;
  billing_address?: string;
  billing_localidad?: string;
  billing_provincia?: string;
  billing_codigo_postal?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data?: any }>;
  signUp: (email: string, password: string, fullName?: string, userType?: string, phone?: string, mobile?: string, province?: string, location?: string) => Promise<{ error: Error | null; data?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDevMode, devUser } = useDevMode();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Refrescar perfil cuando el usuario vuelve al tab (detecta cambios de rol por el admin)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) loadUserProfile(session.user.id);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, subscription_plans(name, display_name)')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('[AuthContext] Error loading profile:', error.message);
        if (error.code === 'PGRST116') {
          logger.warn('[AuthContext] Perfil no encontrado, creando por defecto...');
          await createDefaultProfile(userId);
        }
      } else {
        const planData = data.subscription_plans as { name: string; display_name: string } | null;
        const profileWithPlan = {
          ...data,
          plan_name: planData?.display_name || planData?.name || 'Free',
          subscription_plans: undefined,
        };
        logger.debug('[AuthContext] Perfil cargado — role:', data.role, '| plan:', profileWithPlan.plan_name);
        setProfile(profileWithPlan);
      }
    } catch (error) {
      logger.error('[AuthContext] Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar el perfil manualmente (usado en OAuth callback)
  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    } else {
      // Si no hay user, obtener de la sesión actual
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user?.id) {
        setUser(currentSession.user);
        setSession(currentSession);
        await loadUserProfile(currentSession.user.id);
      }
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.user?.email || '',
          role: 'free',
        })
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      logger.error('[AuthContext] Error creating default profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error, data };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string, userType: string = 'particular', phone?: string, mobile?: string, province?: string, location?: string) => {
    try {
      logger.debug('[AuthContext] signUp:', { userType, province });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/#/auth/confirm`,
        },
      });

      if (error) {
        logger.error('[AuthContext] Error en auth.signUp:', error.message);
        return { error, data: null };
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone: phone || null,
          mobile: mobile || null,
          province: province || null,
          location: location || null,
          user_type: userType,
          role: 'free',
          email_verified: false,
        }).select().single();

        if (profileError) {
          logger.error('[AuthContext] Error creando perfil en users:', profileError.message);
        }
      }

      return { error, data };
    } catch (error) {
      logger.error('[AuthContext] Error en signUp:', error);
      return { error: error as Error, data: null };
    }
  };

  const signOut = async () => {
    try {
      if (isDevMode) {
        localStorage.removeItem('devMode');
        localStorage.removeItem('devUser');
        window.location.reload();
        return;
      }
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      logger.error('[AuthContext] Error al cerrar sesión:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user?.id) {
        return { error: new Error('Usuario no autenticado') };
      }

      const { error, data } = await supabase
        .from('users')
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
          mobile: updates.mobile,
          province: updates.province,
          location: updates.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        logger.error('[AuthContext] Error actualizando usuario:', error.message);
        return { error };
      }

      if (data) {
        setProfile(prev => prev ? { ...prev, ...data } : null);
      }

      return { error: null };
    } catch (error) {
      logger.error('[AuthContext] Error en updateProfile:', error);
      return { error: error as Error };
    }
  };

  // En modo desarrollo, usar devUser como profile
  const effectiveProfile = isDevMode && devUser ? {
    id: devUser.id,
    email: devUser.email,
    full_name: devUser.full_name,
    role: devUser.role,
    email_verified: devUser.email_verified,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : profile;

  useEffect(() => {
    logger.debug('[AuthContext] Estado efectivo:', {
      isDevMode,
      role: effectiveProfile?.role,
      hasProfile: !!effectiveProfile,
    });
  }, [isDevMode, devUser, profile, effectiveProfile]);

  // En modo desarrollo, crear un usuario fake para devUser
  const effectiveUser = isDevMode && devUser ? {
    id: devUser.id,
    email: devUser.email,
    app_metadata: {},
    user_metadata: { full_name: devUser.full_name },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User : user;

  const isAdmin = effectiveProfile?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        profile: effectiveProfile,
        session,
        loading: isDevMode ? false : loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshProfile,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
