/**
 * POST /api/auth/resend-verification
 *
 * Reenvía el email de verificación de cuenta para usuarios no confirmados.
 * - Requiere sesión autenticada (Bearer token)
 * - Verifica que el email no esté ya confirmado
 * - Genera nuevo magic link y envía via Zoho (mismo flujo que welcome_verify)
 * - Rate limiting: client-side (localStorage en frontend, max 1 resend)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { sendWelcomeVerifyEmail } from '@/services/emailService';
import { logger } from '@/infrastructure/logger';

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const supabase    = getSupabaseClient();
    const frontendUrl = process.env.FRONTEND_URL || 'https://prod-frontend-uxzm.onrender.com';

    try {
      // 1. Verificar que el email todavía no está confirmado
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(user.id);
      if (authError) throw authError;

      if (authData.user.email_confirmed_at) {
        return NextResponse.json({ error: 'already_confirmed' }, { status: 400 });
      }

      // 2. Generar nuevo magic link de confirmación
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type:    'magiclink',
        email:   user.email,
        options: { redirectTo: `${frontendUrl}/#/auth/confirm` },
      });

      if (linkError || !linkData?.properties?.action_link) {
        throw linkError || new Error('No se pudo generar el link de confirmación');
      }

      // 3. Enviar vía Zoho (reutiliza template welcome_verify de DB o fallback hardcodeado)
      const firstName = user.full_name?.split(' ')[0] ?? '';
      await sendWelcomeVerifyEmail({
        to:               user.email,
        toName:           user.full_name ?? user.email,
        firstName,
        confirmationLink: linkData.properties.action_link,
      });

      logger.info(`[resend-verification] Email reenviado a ${user.email} (userId: ${user.id})`);
      return NextResponse.json({ ok: true });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      logger.error(`[resend-verification] Error para ${user.email}: ${message}`);
      return NextResponse.json(
        { error: 'No se pudo reenviar el email. Intentá de nuevo.' },
        { status: 500 }
      );
    }
  });
}
