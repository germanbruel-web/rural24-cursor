/**
 * POST /api/empleo-contact
 *
 * Consulta de empleo sin login requerido.
 * Notifica al publicador del aviso por email via Zoho.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { sendEmpleoContactEmail } from '@/services/emailService';
import { logger } from '@/infrastructure/logger';

const BodySchema = z.object({
  adId:    z.string().uuid('ID de aviso inválido'),
  celular: z.string().min(6, 'El celular es obligatorio').max(30).trim(),
  email:   z.string().email('Email inválido').max(200).trim().optional().or(z.literal('')),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(1000).trim(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { adId, celular, email, mensaje } = parsed.data;
    const supabase = getSupabaseClient();

    // Buscar el aviso y su dueño
    const { data: ad, error: adErr } = await supabase
      .from('ads')
      .select('id, title, user_id, status')
      .eq('id', adId)
      .single();

    if (adErr || !ad) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 });
    }
    if (ad.status !== 'active') {
      return NextResponse.json({ error: 'El aviso ya no está activo' }, { status: 410 });
    }

    // Buscar email del publicador (service_role puede leer auth.users via tabla users)
    const { data: userRow } = await supabase
      .from('users')
      .select('email')
      .eq('id', ad.user_id)
      .single();

    if (!userRow?.email) {
      logger.warn(`[empleo-contact] No se encontró email para user ${ad.user_id}`);
      return NextResponse.json({ error: 'No se pudo contactar al publicador' }, { status: 500 });
    }

    logger.info(`[empleo-contact] Consulta para ad ${adId} → ${userRow.email}`);

    sendEmpleoContactEmail({
      to:      userRow.email,
      adTitle: ad.title,
      celular,
      email:   email || undefined,
      mensaje,
    }).catch(err => {
      logger.error('[empleo-contact] Error enviando email:', err);
    });

    return NextResponse.json({ success: true, message: '¡Mensaje enviado! El empleador recibirá tu contacto.' });

  } catch (error) {
    logger.error('[empleo-contact] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
