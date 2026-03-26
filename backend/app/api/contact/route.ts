/**
 * POST /api/contact
 *
 * Formulario institucional de contacto (sin auth requerida).
 * Acepta multipart/form-data con hasta 3 imágenes adjuntas (≤3MB c/u).
 * Tipos: soporte | sugerencias | publicidad
 *
 * Notificación: envía email a CONTACT_EMAIL (default: info@rural24.com.ar) via Zoho.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactEmail } from '@/services/emailService';
import { logger } from '@/infrastructure/logger';

const MAX_FILES     = 3;
const MAX_SIZE_MB   = 3;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const TIPO_LABELS: Record<string, string> = {
  soporte:     'Soporte',
  sugerencias: 'Sugerencia',
  publicidad:  'Consulta Publicidad',
};

const FieldsSchema = z.object({
  tipo: z.enum(['soporte', 'sugerencias', 'publicidad'], {
    errorMap: () => ({ message: 'Tipo de consulta inválido' }),
  }),
  nombre:   z.string().min(2, 'El nombre es obligatorio').max(100).trim(),
  email:    z.string().email('Email inválido').max(200).trim(),
  telefono: z.string().max(30).trim().optional(),
  mensaje:  z.string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(2000, 'El mensaje no puede superar 2000 caracteres')
    .trim(),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // ── Extraer campos de texto ───────────────────────────────────────────
    const fields = {
      tipo:     formData.get('tipo'),
      nombre:   formData.get('nombre'),
      email:    formData.get('email'),
      telefono: formData.get('telefono') || undefined,
      mensaje:  formData.get('mensaje'),
    };

    const parsed = FieldsSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tipo, nombre, email, telefono, mensaje } = parsed.data;

    // ── Validar adjuntos ─────────────────────────────────────────────────
    const attachments = formData.getAll('adjuntos') as File[];
    const images = attachments.filter(f => f instanceof File && f.size > 0);

    if (images.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES} imágenes adjuntas.` },
        { status: 400 }
      );
    }

    for (const img of images) {
      if (img.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `"${img.name}" supera los ${MAX_SIZE_MB}MB permitidos.` },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(img.type)) {
        return NextResponse.json(
          { error: `"${img.name}" no es un formato de imagen válido (JPG, PNG, WEBP, GIF).` },
          { status: 400 }
        );
      }
    }

    logger.info(
      `[contact] Nueva consulta: ${TIPO_LABELS[tipo]} de ${nombre} <${email}> (${images.length} adjuntos)`
    );

    // ── Notificación por email (fire-and-forget: no bloquea la respuesta) ──
    sendContactEmail({
      tipo,
      tipoLabel: TIPO_LABELS[tipo],
      nombre,
      email,
      telefono,
      mensaje,
      adjuntos: images.length,
    }).catch(err => {
      logger.error('[contact] Error enviando email de notificación:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Tu mensaje fue recibido. Te responderemos a la brevedad.',
    });

  } catch (error) {
    console.error('[contact] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
