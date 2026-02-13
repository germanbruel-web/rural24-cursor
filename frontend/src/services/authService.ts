import { supabase } from './supabaseClient';
import { getPlanByName } from './subscriptionService';

/**
 * Datos de registro - PERSONA
 */
export interface RegisterPersonaInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  // mobile eliminado - un solo campo de teléfono
}

/**
 * Datos de registro - EMPRESA
 */
export interface RegisterEmpresaInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  companyName: string;
  // CUIT eliminado - se puede agregar después en el perfil
}

/**
 * Resultado del registro
 */
export interface RegisterResult {
  success: boolean;
  userId?: string;
  needsVerification?: boolean;
  error?: string;
  errorCode?: 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'INVALID_CUIT' | 'RATE_LIMIT' | 'UNKNOWN';
}

/**
 * Validar CUIT argentino (basico)
 */
export function validateCUIT(cuit: string): boolean {
  // Remover guiones y espacios
  const cleaned = cuit.replace(/[-\s]/g, '');
  
  // Debe tener exactamente 11 dígitos
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }
  
  // Validar que no sea todo el mismo dígito
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }
  
  // TODO: Agregar validación completa del dígito verificador si es necesario
  return true;
}

/**
 * Formatear CUIT con guiones (XX-XXXXXXXX-X)
 */
export function formatCUIT(cuit: string): string {
  const cleaned = cuit.replace(/[-\s]/g, '');
  if (cleaned.length !== 11) return cuit;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
}

/**
 * Registrar usuario PERSONA
 * - Asigna plan FREE por defecto
 * - Envia email de verificacion
 */
export async function registerPersona(input: RegisterPersonaInput): Promise<RegisterResult> {
  try {
    // 1. CREAR USUARIO EN AUTH
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          account_type: 'persona',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      console.error('❌ Error en signUp:', authError);
      
      let errorCode: 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'UNKNOWN' = 'UNKNOWN';
      if (authError.message?.toLowerCase().includes('already registered')) {
        errorCode = 'EMAIL_EXISTS';
      } else if (authError.message?.toLowerCase().includes('password')) {
        errorCode = 'WEAK_PASSWORD';
      }
      
      return {
        success: false,
        error: authError.message,
        errorCode,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'No se pudo crear el usuario',
        errorCode: 'UNKNOWN',
      };
    }

    // 2. OBTENER PLAN FREE
    const freePlan = await getPlanByName('free');
    if (!freePlan) {
      console.error('❌ Plan free no encontrado - debe ejecutar migration 007');
      return {
        success: false,
        error: 'Configuración de planes no encontrada',
        errorCode: 'UNKNOWN',
      };
    }

    // 3. CREAR/ACTUALIZAR PERFIL EN USERS
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: `${input.firstName} ${input.lastName}`,
        phone: input.phone || null,
        account_type: 'persona',
        user_type: 'particular',
        subscription_plan_id: freePlan.id,
        role: 'free',
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (profileError) {
      console.error('Error actualizando perfil:', profileError);
    }

    console.log('Usuario PERSONA registrado:', authData.user.id);
    return {
      success: true,
      userId: authData.user.id,
      needsVerification: true,
    };
    
  } catch (error: any) {
    console.error('Exception en registerPersona:', error);
    return {
      success: false,
      error: error.message || 'Error al registrar usuario',
      errorCode: 'UNKNOWN',
    };
  }
}

/**
 * Registrar usuario EMPRESA
 * - Asigna plan FREE por defecto
 * - Envia email de verificacion
 * - CUIT y datos adicionales se completan en el perfil
 */
export async function registerEmpresa(input: RegisterEmpresaInput): Promise<RegisterResult> {
  try {
    // 1. CREAR USUARIO EN AUTH
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          account_type: 'empresa',
          company_name: input.companyName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      console.error('Error en signUp empresa:', authError);
      
      let errorCode: 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'UNKNOWN' = 'UNKNOWN';
      if (authError.message?.toLowerCase().includes('already registered')) {
        errorCode = 'EMAIL_EXISTS';
      } else if (authError.message?.toLowerCase().includes('password')) {
        errorCode = 'WEAK_PASSWORD';
      }
      
      return {
        success: false,
        error: authError.message,
        errorCode,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'No se pudo crear el usuario',
        errorCode: 'UNKNOWN',
      };
    }

    // 2. OBTENER PLAN FREE
    const freePlan = await getPlanByName('free');
    if (!freePlan) {
      console.error('Plan free no encontrado - debe ejecutar migration 007');
      return {
        success: false,
        error: 'Configuración de planes no encontrada',
        errorCode: 'UNKNOWN',
      };
    }

    // 3. CREAR/ACTUALIZAR PERFIL EN USERS CON DATOS DE EMPRESA
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: `${input.firstName} ${input.lastName}`,
        phone: input.phone || null,
        account_type: 'empresa',
        user_type: 'empresa',
        display_name: input.companyName,
        subscription_plan_id: freePlan.id,
        role: 'free',
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (profileError) {
      console.error('Error actualizando perfil empresa:', profileError);
    }

    console.log('Usuario EMPRESA registrado:', authData.user.id);
    return {
      success: true,
      userId: authData.user.id,
      needsVerification: true,
    };
    
  } catch (error: any) {
    console.error('Exception en registerEmpresa:', error);
    return {
      success: false,
      error: error.message || 'Error al registrar empresa',
      errorCode: 'UNKNOWN',
    };
  }
}
