import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { UserRole } from '../types';
import { useDevMode } from './DevModeContext';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  mobile?: string;
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

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('📥 Cargando perfil para usuario:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*, subscription_plans(name, display_name)')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error loading profile:', error);
        // Si no existe perfil, crear uno por defecto
        if (error.code === 'PGRST116') {
          console.log('⚠️ Perfil no encontrado, creando uno por defecto...');
          await createDefaultProfile(userId);
        }
      } else {
        // Extraer el nombre del plan del JOIN
        const planData = data.subscription_plans as { name: string; display_name: string } | null;
        const profileWithPlan = {
          ...data,
          plan_name: planData?.display_name || planData?.name || 'Free',
          subscription_plans: undefined // Limpiar el objeto anidado
        };
        console.log('✅ Perfil cargado completo:', JSON.stringify(profileWithPlan, null, 2));
        console.log('📝 full_name:', data.full_name);
        console.log('📝 email:', data.email);
        console.log('📝 role:', data.role);
        console.log('📝 plan_name:', profileWithPlan.plan_name);
        setProfile(profileWithPlan);
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
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
      console.error('Error creating default profile:', error);
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
      console.log('🔐 Iniciando registro:', { email, fullName, userType, phone, mobile, province, location });
      
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
        console.error('❌ Error en auth.signUp:', error);
        return { error, data: null };
      }

      if (data.user) {
        console.log('✅ Usuario creado en auth:', data.user.id);
        
        // Crear perfil de usuario con phone, mobile, province y location
        const { data: profileData, error: profileError } = await supabase.from('users').insert({
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
          console.error('Error creando perfil en users:', profileError);
        } else {
          console.log('Perfil creado en users:', profileData);
        }
      }

      return { error, data };
    } catch (error) {
      console.error('❌ Error en signUp:', error);
      return { error: error as Error, data: null };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      
      // Limpiar DevMode si está activo
      if (isDevMode) {
        console.log('🔧 Desactivando DevMode...');
        localStorage.removeItem('devMode');
        localStorage.removeItem('devUser');
        window.location.reload(); // Recargar para limpiar contextos
        return;
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
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
        console.error('❌ Usuario no autenticado');
        return { error: new Error('Usuario no autenticado') };
      }

      console.log('📝 Actualizando usuario:', user.id, updates);

      // Actualizar en la tabla users
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
        console.error('❌ Error actualizando usuario:', error);
        return { error };
      }

      if (data) {
        console.log('✅ Usuario actualizado:', data);
        // Actualizar el estado local del profile
        setProfile(prev => prev ? { ...prev, ...data } : null);
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Error en updateProfile:', error);
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

  // DEBUG: Log para ver qué profile se está usando
  useEffect(() => {
    console.log('👤 AuthContext - Estado efectivo:', {
      isDevMode,
      hasDevUser: !!devUser,
      devUserName: devUser?.full_name,
      hasRealProfile: !!profile,
      realProfileName: profile?.full_name,
      effectiveName: effectiveProfile?.full_name,
      effectiveEmail: effectiveProfile?.email
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

  const isAdmin = effectiveProfile?.role === 'revendedor' || effectiveProfile?.role === 'superadmin';

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
