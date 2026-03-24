/**
 * Email Service — Rural24
 * Transporte SMTP via Zoho Mail (Plan Forever Free).
 * Usa nodemailer — sin SDKs propietarios.
 *
 * Variables de entorno requeridas:
 *   SMTP_HOST   smtp.zoho.com
 *   SMTP_PORT   465
 *   SMTP_USER   info@rural24.com.ar
 *   SMTP_PASS   contraseña de la cuenta Zoho
 */

import nodemailer from 'nodemailer';
import { logger } from '@/infrastructure/logger';

// ── Transporte ────────────────────────────────────────────────

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST  || 'smtp.zoho.com',
    port:   parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // SSL en puerto 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,       // reutiliza conexiones
    maxConnections: 3,
    rateDelta: 1000,  // máx 1 email/seg (límite Zoho)
    rateLimit: 1,
  });

  return _transporter;
}

// ── Tipos ────────────────────────────────────────────────────

export interface FeaturedActivatedData {
  to:        string;
  toName:    string;
  adTitle:   string;
  adSlug:    string;
  expiresAt: string;
}

// ── Templates ─────────────────────────────────────────────────

function templateFeaturedActivated(d: FeaturedActivatedData): string {
  const expires = new Date(d.expiresAt).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const adUrl = `https://rural24.com.ar/#/ad/${d.adSlug}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu aviso está destacado</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:#65a30d;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.3px;">
                Rural<span style="background:#ffffff;color:#65a30d;border-radius:4px;padding:0 5px;margin-left:2px;">24</span>
              </h1>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Hola, <strong style="color:#111827;">${d.toName}</strong></p>
              <h2 style="margin:0 0 20px;color:#111827;font-size:20px;font-weight:bold;line-height:1.3;">
                ¡Tu aviso ya está destacado!
              </h2>

              <!-- Card del aviso -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Aviso destacado</p>
                    <p style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#111827;">${d.adTitle}</p>
                    <p style="margin:0;font-size:13px;color:#6b7280;">
                      Activo hasta: <strong style="color:#374151;">${expires}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#65a30d;border-radius:8px;">
                    <a href="${adUrl}"
                       style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                      Ver mi aviso
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                Tu aviso aparecerá en los primeros lugares de búsqueda y en la página de inicio
                hasta la fecha indicada. Si tenés alguna duda, respondé este correo.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                Rural24 — Clasificados Agrarios de Argentina<br>
                <a href="https://rural24.com.ar" style="color:#65a30d;text-decoration:none;">rural24.com.ar</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Funciones de envío ────────────────────────────────────────

export async function sendFeaturedActivatedEmail(data: FeaturedActivatedData): Promise<boolean> {
  const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!smtpConfigured) {
    logger.warn('[Email] SMTP no configurado — email omitido (configurar SMTP_USER + SMTP_PASS)');
    return false;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from:    `"Rural24" <${process.env.SMTP_USER}>`,
      to:      data.to,
      subject: `✅ Tu aviso "${data.adTitle.substring(0, 50)}" ya está destacado`,
      html:    templateFeaturedActivated(data),
    });
    logger.info(`[Email] Enviado featured_activated → ${data.to}`);
    return true;
  } catch (error: any) {
    logger.error(`[Email] Error enviando a ${data.to}:`, error.message);
    return false;
  }
}

// ── Verificar conexión SMTP ───────────────────────────────────

export async function verifySMTPConnection(): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;
  try {
    await getTransporter().verify();
    logger.info('[Email] Conexión SMTP verificada OK');
    return true;
  } catch (error: any) {
    logger.error('[Email] Error verificando SMTP:', error.message);
    return false;
  }
}
