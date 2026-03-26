/**
 * POST /api/admin/email-templates/[type]/test
 * Envía un email de prueba usando la plantilla actual (superadmin only).
 * Sustituye variables con datos de muestra.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/infrastructure/auth/guard';
import { sendTestEmail } from '@/services/emailService';
import { logger } from '@/infrastructure/logger';

const VALID_TYPES = ['welcome', 'welcome_verify', 'featured_activated', 'contact_form'] as const;

const TestSchema = z.object({
  to: z.string().email('Email de destino inválido'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  return withAuth(
    request,
    async (user) => {
      try {
        const { type } = await params;

        if (!VALID_TYPES.includes(type as any)) {
          return NextResponse.json(
            { error: `Tipo inválido. Válidos: ${VALID_TYPES.join(', ')}` },
            { status: 400 }
          );
        }

        const body = await request.json();
        const parsed = TestSchema.safeParse(body);

        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Email de destino inválido.' },
            { status: 400 }
          );
        }

        await sendTestEmail(type, parsed.data.to);

        logger.info(`[email-templates] TEST ${type} → ${parsed.data.to} por ${user.email}`);

        return NextResponse.json({
          success: true,
          message: `Email de prueba enviado a ${parsed.data.to}`,
        });
      } catch (err: any) {
        logger.error('[email-templates] TEST exception:', err?.message);
        return NextResponse.json(
          { error: err?.message || 'Error al enviar email de prueba.' },
          { status: 500 }
        );
      }
    },
    { roles: ['superadmin'] }
  );
}
