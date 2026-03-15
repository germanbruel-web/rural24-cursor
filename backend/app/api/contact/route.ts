/**
 * POST /api/contact
 *
 * Formulario institucional de contacto (sin auth requerida).
 * Acepta multipart/form-data con hasta 3 imágenes adjuntas (≤3MB c/u).
 * Tipos: soporte | sugerencias | publicidad
 *
 * TODO: integrar sistema de email cuando se defina el proveedor.
 * Configurar: CONTACT_EMAIL en variables de entorno del backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

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

    // ── TODO: enviar email cuando se defina el proveedor de correo ──────────
    // Configurar env var CONTACT_EMAIL con el destino (ej: hola@rural24.com.ar)
    // Opciones a evaluar: Resend, SendGrid, Nodemailer + SMTP
    //
    // Estructura sugerida del email:
    //   Asunto: [RURAL24] ${TIPO_LABELS[tipo]} de ${nombre}
    //   Adjuntos: images.map(f => ({ filename: f.name, content: Buffer.from(await f.arrayBuffer()) }))
    // ────────────────────────────────────────────────────────────────────────

    console.log(
      `[contact] Nueva consulta:\n` +
      `  Tipo: ${TIPO_LABELS[tipo]}\n` +
      `  De: ${nombre} <${email}>\n` +
      `  Teléfono: ${telefono ?? '-'}\n` +
      `  Adjuntos: ${images.length > 0 ? images.map(f => `${f.name} (${(f.size / 1024).toFixed(0)}KB)`).join(', ') : 'ninguno'}\n` +
      `  Mensaje: ${mensaje.substring(0, 200)}${mensaje.length > 200 ? '...' : ''}`
    );

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
