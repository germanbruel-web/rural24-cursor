import { supabase } from './supabaseClient';
import { getPlanByName } from './subscriptionService';

/**
 * 📋 Datos de registro - PERSONA
 */
export interface RegisterPersonaInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  mobile?: string;
}

/**
 * 🏢 Datos de registro - EMPRESA
 */
export interface RegisterEmpresaInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  mobile?: string;
  companyName: string;
  cuit: string;
  website?: string;
}

/**
 * ✅ Resultado del registro
 */
export interface RegisterResult {
  success: boolean;
  userId?: string;
  needsVerification?: boolean;
  error?: string;
  errorCode?: 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'INVALID_CUIT' | 'UNKNOWN';
}

/**
 * ✍️ Validar CUIT argentino (básico)
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
 * 🎨 Formatear CUIT con guiones (XX-XXXXXXXX-X)
 */
export function formatCUIT(cuit: string): string {
  const cleaned = cuit.replace(/[-\s]/g, '');
  if (cleaned.length !== 11) return cuit;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
}

/**
 * 👤 Registrar usuario PERSONA
 * - Asigna plan FREE por defecto
 * - Envía email de verificación
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
    const freePlan = await getPlanByName('FREE');
    if (!freePlan) {
      console.error('❌ Plan FREE no encontrado - debe ejecutar migration 007');
      return {
        success: false,
        error: 'Configuración de planes no encontrada',
        errorCode: 'UNKNOWN',
      };
    }

    // 3. ACTUALIZAR PERFIL EN USERS
    const { error: profileError } = await supabase
      .from('users')
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: `${input.firstName} ${input.lastName}`,
        phone: input.phone || null,
        mobile: input.mobile || null,
        account_type: 'persona',
        subscription_plan_id: freePlan.id,
        email_verified: false, // Se verifica al hacer click en el email
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('❌ Error actualizando perfil:', profileError);
      // No retornar error aquí - el usuario se creó correctamente
    }

    console.log('✅ Usuario PERSONA registrado:', authData.user.id);
    return {
      success: true,
      userId: authData.user.id,
      needsVerification: true,
    };
    
  } catch (error: any) {
    console.error('❌ Exception en registerPersona:', error);
    return {
      success: false,
      error: error.message || 'Error al registrar usuario',
      errorCode: 'UNKNOWN',
    };
  }
}

/**
 * 🏢 Registrar usuario EMPRESA
 * - Asigna plan FREE por defecto
 * - Estado: pending_verification
 * - Envía email de verificación
 */
export async function registerEmpresa(input: RegisterEmpresaInput): Promise<RegisterResult> {
  try {
    // 1. VALIDAR CUIT
    if (!validateCUIT(input.cuit)) {
      return {
        success: false,
        error: 'CUIT inválido. Debe tener 11 dígitos (formato: XX-XXXXXXXX-X)',
        errorCode: 'INVALID_CUIT',
      };
    }

    const formattedCUIT = formatCUIT(input.cuit);

    // 2. CREAR USUARIO EN AUTH
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          account_type: 'empresa',
          company_name: input.companyName,
          cuit: formattedCUIT,
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

    // 3. OBTENER PLAN FREE
    const freePlan = await getPlanByName('FREE');
    if (!freePlan) {
      console.error('❌ Plan FREE no encontrado - debe ejecutar migration 007');
      return {
        success: false,
        error: 'Configuración de planes no encontrada',
        errorCode: 'UNKNOWN',
      };
    }

    // 4. ACTUALIZAR PERFIL EN USERS CON DATOS DE EMPRESA
    const { error: profileError } = await supabase
      .from('users')
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: `${input.firstName} ${input.lastName}`,
        phone: input.phone || null,
        mobile: input.mobile || null,
        account_type: 'empresa',
        company_name: input.companyName,
        cuit: formattedCUIT,
        website: input.website || null,
        verification_status: 'pending_verification',
        subscription_plan_id: freePlan.id,
        email_verified: false,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('❌ Error actualizando perfil empresa:', profileError);
      // No retornar error aquí - el usuario se creó correctamente
    }

    console.log('✅ Usuario EMPRESA registrado:', authData.user.id);
    return {
      success: true,
      userId: authData.user.id,
      needsVerification: true,
    };
    
  } catch (error: any) {
    console.error('❌ Exception en registerEmpresa:', error);
    return {
      success: false,
      error: error.message || 'Error al registrar empresa',
      errorCode: 'UNKNOWN',
    };
  }
}
