/**
 * POST /api/phone/verify
 * Verifica el código OTP enviado al celular.
 * 
 * Body: { mobile: string, code: string }
 * Response: { success: true, message: string }
 * 
 * Validaciones:
 * - Usuario autenticado
 * - El código coincide con el almacenado
 * - No más de 5 intentos (anti brute-force)
 * - Código no expirado (10 minutos)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

const VerifySchema = z.object({
  mobile: z.string().min(10).max(20),
  code: z.string().length(4, 'El código debe ser de 4 dígitos'),
});

const MAX_ATTEMPTS = 5;
const CODE_EXPIRY_MINUTES = 10;

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const parsed = VerifySchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { mobile, code } = parsed.data;
      const supabase = getSupabaseClient();

      // 1. Obtener datos de verificación del usuario
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('mobile, mobile_verification_code, mobile_verification_sent_at, mobile_verification_attempts, mobile_verified')
        .eq('id', user.id)
        .single();

      if (fetchError || !userData) {
        return NextResponse.json(
          { error: 'Usuario no encontrado.' },
          { status: 404 }
        );
      }

      // 2. Si ya está verificado con ese número
      if (userData.mobile_verified && userData.mobile === mobile) {
        return NextResponse.json({
          success: true,
          message: 'Tu celular ya está verificado.',
          alreadyVerified: true,
        });
      }

      // 3. Verificar que hay un código pendiente
      if (!userData.mobile_verification_code || !userData.mobile_verification_sent_at) {
        return NextResponse.json(
          { error: 'No hay un código de verificación pendiente. Solicitá uno nuevo.' },
          { status: 400 }
        );
      }

      // 4. Verificar que el mobile coincide
      if (userData.mobile !== mobile) {
        return NextResponse.json(
          { error: 'El número no coincide con el que se envió el código.' },
          { status: 400 }
        );
      }

      // 5. Verificar intentos
      if ((userData.mobile_verification_attempts || 0) >= MAX_ATTEMPTS) {
        // Limpiar código para forzar re-envío
        await supabase
          .from('users')
          .update({
            mobile_verification_code: null,
            mobile_verification_sent_at: null,
            mobile_verification_attempts: 0,
          })
          .eq('id', user.id);

        return NextResponse.json(
          { error: 'Demasiados intentos. Solicitá un nuevo código.' },
          { status: 429 }
        );
      }

      // 6. Verificar expiración (10 minutos)
      const sentAt = new Date(userData.mobile_verification_sent_at);
      const minutesAgo = (Date.now() - sentAt.getTime()) / 1000 / 60;
      if (minutesAgo > CODE_EXPIRY_MINUTES) {
        await supabase
          .from('users')
          .update({
            mobile_verification_code: null,
            mobile_verification_sent_at: null,
            mobile_verification_attempts: 0,
          })
          .eq('id', user.id);

        return NextResponse.json(
          { error: 'El código expiró. Solicitá uno nuevo.' },
          { status: 410 }
        );
      }

      // 7. Incrementar intentos
      await supabase
        .from('users')
        .update({
          mobile_verification_attempts: (userData.mobile_verification_attempts || 0) + 1,
        })
        .eq('id', user.id);

      // 8. Verificar código
      if (userData.mobile_verification_code !== code) {
        const attemptsLeft = MAX_ATTEMPTS - (userData.mobile_verification_attempts || 0) - 1;
        return NextResponse.json(
          { error: `Código incorrecto. Te quedan ${attemptsLeft} intentos.` },
          { status: 400 }
        );
      }

      // 9. ¡Código correcto! Verificar nuevamente unicidad antes de marcar
      const { data: existingVerified } = await supabase
        .from('users')
        .select('id')
        .eq('mobile', mobile)
        .eq('mobile_verified', true)
        .neq('id', user.id)
        .single();

      if (existingVerified) {
        return NextResponse.json(
          { error: 'Este número ya fue verificado por otro usuario mientras verificabas.' },
          { status: 409 }
        );
      }

      // 10. Marcar como verificado
      const { error: verifyError } = await supabase
        .from('users')
        .update({
          mobile_verified: true,
          mobile_verification_code: null,
          mobile_verification_sent_at: null,
          mobile_verification_attempts: 0,
        })
        .eq('id', user.id);

      if (verifyError) {
        console.error('[phone/verify] Error marking verified:', verifyError);
        return NextResponse.json(
          { error: 'Error al verificar. Intentá de nuevo.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '¡Celular verificado exitosamente!',
      });

    } catch (error) {
      console.error('[phone/verify] Error:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}
