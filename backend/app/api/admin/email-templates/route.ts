/**
 * GET /api/admin/email-templates
 * Lista todas las plantillas de email (superadmin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { logger } from '@/infrastructure/logger';

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
          .from('email_templates')
          .select('type, subject, variables, description, updated_at, html_content')
          .order('type');

        if (error) {
          logger.error('[email-templates] GET error:', error.message);
          return NextResponse.json({ error: 'Error al obtener plantillas.' }, { status: 500 });
        }

        return NextResponse.json({ data: data ?? [] });
      } catch (err: any) {
        logger.error('[email-templates] GET exception:', err?.message);
        return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
      }
    },
    { roles: ['superadmin'] }
  );
}
