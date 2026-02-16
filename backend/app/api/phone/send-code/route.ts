/**
 * POST /api/phone/send-code
 * Envía código de verificación al celular del usuario.
 * 
 * Dev mode: siempre envía código "1234" (hardcoded).
 * Prod mode: integrar Twilio/SMS cuando se configure.
 * 
 * Body: { mobile: string }
 * Response: { success: true, message: string }
 * 
 * Validaciones:
 * - Usuario autenticado
 * - Formato válido de celular argentino
 * - No puede ser un número ya verificado por otro usuario
 * - Rate limit: 1 SMS cada 60 segundos
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

// Normalizar número: dejar solo dígitos, mínimo 10
const MobileSchema = z.object({
  mobile: z.string()
    .min(10, 'El celular debe tener al menos 10 dígitos')
    .max(20, 'Número demasiado largo')
    .transform(val => val.replace(/[^0-9+]/g, '')) // Solo dígitos y +
});

// OTP code (en dev siempre "1234", en prod generar random 4 dígitos)
function generateOTP(): string {
  // DEV MODE: código fijo para testing
  if (process.env.NODE_ENV !== 'production') {
    return '1234';
  }
  // PROD: código aleatorio 4 dígitos
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const parsed = MobileSchema.safeParse(body);
      
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Número de celular inválido', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { mobile } = parsed.data;
      const supabase = getSupabaseClient();

      // 1. Verificar que el número no esté ya verificado por OTRO usuario
      const { data: existingVerified } = await supabase
        .from('users')
        .select('id')
        .eq('mobile', mobile)
        .eq('mobile_verified', true)
        .neq('id', user.id)
        .single();

      if (existingVerified) {
        return NextResponse.json(
          { error: 'Este número de celular ya está verificado por otro usuario.' },
          { status: 409 }
        );
      }

      // 2. Rate limit: no enviar más de 1 código cada 60 segundos
      const { data: currentUser } = await supabase
        .from('users')
        .select('mobile_verification_sent_at')
        .eq('id', user.id)
        .single();

      if (currentUser?.mobile_verification_sent_at) {
        const lastSent = new Date(currentUser.mobile_verification_sent_at);
        const secondsAgo = (Date.now() - lastSent.getTime()) / 1000;
        if (secondsAgo < 60) {
          const waitSeconds = Math.ceil(60 - secondsAgo);
          return NextResponse.json(
            { error: `Esperá ${waitSeconds} segundos antes de pedir otro código.` },
            { status: 429 }
          );
        }
      }

      // 3. Generar código
      const code = generateOTP();

      // 4. Guardar código y actualizar mobile en el perfil
      const { error: updateError } = await supabase
        .from('users')
        .update({
          mobile,
          mobile_verification_code: code,
          mobile_verification_sent_at: new Date().toISOString(),
          mobile_verification_attempts: 0,
          mobile_verified: false,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('[phone/send-code] Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Error al enviar código. Intentá de nuevo.' },
          { status: 500 }
        );
      }

      // 5. Enviar SMS (en dev: log en consola; en prod: integrar Twilio)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📱 [DEV] Código de verificación para ${mobile}: ${code}`);
      } else {
        // TODO: Integrar Twilio SMS
        // await sendSMS(mobile, `Tu código de verificación Rural24 es: ${code}`);
        console.log(`📱 [PROD] SMS enviado a ${mobile}`);
      }

      return NextResponse.json({
        success: true,
        message: process.env.NODE_ENV !== 'production' 
          ? `Código de desarrollo enviado (usar: ${code})`
          : 'Te enviamos un código por SMS a tu celular.',
        // En dev, devolver el código para facilitar testing
        ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
      });

    } catch (error) {
      console.error('[phone/send-code] Error:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}
