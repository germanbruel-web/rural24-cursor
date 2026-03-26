/**
 * PUT /api/admin/email-templates/[type]
 * Actualiza subject y html_content de una plantilla (superadmin only).
 * Invalida la caché en memoria del emailService.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { invalidateTemplateCache } from '@/services/emailService';
import { logger } from '@/infrastructure/logger';

const VALID_TYPES = ['welcome', 'welcome_verify', 'featured_activated', 'contact_form'] as const;

const UpdateSchema = z.object({
  subject:      z.string().min(1).max(300),
  html_content: z.string().min(1),
});

export async function PUT(
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
        const parsed = UpdateSchema.safeParse(body);

        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Datos inválidos.', details: parsed.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const supabase = getSupabaseClient();

        const { error } = await supabase
          .from('email_templates')
          .update({
            subject:      parsed.data.subject,
            html_content: parsed.data.html_content,
          })
          .eq('type', type);

        if (error) {
          logger.error(`[email-templates] PUT ${type} error:`, error.message);
          return NextResponse.json({ error: 'Error al actualizar plantilla.' }, { status: 500 });
        }

        // Invalidar caché para que el próximo envío use la versión nueva
        invalidateTemplateCache(type);

        logger.info(`[email-templates] PUT ${type} — actualizado por ${user.email}`);

        return NextResponse.json({ success: true });
      } catch (err: any) {
        logger.error('[email-templates] PUT exception:', err?.message);
        return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
      }
    },
    { roles: ['superadmin'] }
  );
}
