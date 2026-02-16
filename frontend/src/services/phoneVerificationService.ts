/**
 * Phone Verification Service
 * Servicio para verificación de celular vía OTP.
 */

import { supabase } from './supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No hay sesión activa');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
  devCode?: string; // Solo en dev
  error?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  alreadyVerified?: boolean;
  error?: string;
}

/**
 * Enviar código de verificación al celular
 */
export async function sendVerificationCode(mobile: string): Promise<SendCodeResponse> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE}/api/phone/send-code`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mobile }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      message: data.error || 'Error al enviar código',
      error: data.error,
    };
  }

  return data;
}

/**
 * Verificar código OTP
 */
export async function verifyCode(mobile: string, code: string): Promise<VerifyCodeResponse> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE}/api/phone/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mobile, code }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      message: data.error || 'Error al verificar código',
      error: data.error,
    };
  }

  return data;
}
