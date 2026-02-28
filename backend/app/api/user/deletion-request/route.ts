/**
 * POST /api/user/deletion-request
 *
 * Registra una solicitud de eliminación de cuenta.
 * NO elimina la cuenta — el superadmin la procesa manualmente.
 *
 * Body: { reason: string }
 * Response: { success: true, requestId: string }
 *
 * Validaciones:
 * - Usuario autenticado
 * - Motivo mínimo 10 caracteres
 * - No puede tener ya una solicitud pendiente/en proceso
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

const DeletionRequestSchema = z.object({
  reason: z.string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(1000, 'El motivo no puede superar 1000 caracteres')
    .trim(),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const parsed = DeletionRequestSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { reason } = parsed.data;
      const supabase = getSupabaseClient();

      // 1. Verificar que no exista ya una solicitud pendiente o en proceso
      const { data: existing } = await supabase
        .from('deletion_requests')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          {
            error: 'Ya tenés una solicitud de eliminación pendiente.',
            existingRequestId: existing.id,
          },
          { status: 409 }
        );
      }

      // 2. Obtener email del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      // 3. Insertar solicitud
      const { data: newRequest, error: insertError } = await supabase
        .from('deletion_requests')
        .insert({
          user_id: user.id,
          user_email: userData?.email ?? user.email ?? '',
          reason,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[deletion-request] Error inserting:', insertError);
        return NextResponse.json(
          { error: 'Error al registrar la solicitud. Intentá de nuevo.' },
          { status: 500 }
        );
      }

      // 4. Notificación interna al superadmin (log + tabla notifications si existe)
      console.log(
        `🗑️ [deletion-request] Nueva solicitud de baja:\n` +
        `  Usuario: ${userData?.full_name ?? 'N/A'} <${userData?.email ?? user.email}>\n` +
        `  ID: ${user.id}\n` +
        `  Request ID: ${newRequest.id}\n` +
        `  Motivo: ${reason.substring(0, 100)}${reason.length > 100 ? '...' : ''}`
      );

      // Intento best-effort de insertar notificación interna (tabla opcional)
      try {
        await supabase.from('admin_notifications').insert({
          type: 'deletion_request',
          title: `Solicitud de baja: ${userData?.email ?? user.email}`,
          body: reason.substring(0, 200),
          metadata: { user_id: user.id, request_id: newRequest.id },
          is_read: false,
        });
      } catch {
        // La tabla puede no existir todavía — no bloquear el flujo
      }

      return NextResponse.json({
        success: true,
        requestId: newRequest.id,
        message: 'Tu solicitud fue registrada. El equipo la revisará en los próximos días hábiles.',
      });

    } catch (error) {
      console.error('[deletion-request] Error:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}

/**
 * GET /api/user/deletion-request
 * Verifica si el usuario tiene una solicitud pendiente.
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('deletion_requests')
      .select('id, status, created_at, reason')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  });
}
