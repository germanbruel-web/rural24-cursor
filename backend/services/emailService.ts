/**
 * Email Service — Rural24
 * Envío via Zoho Mail REST API (HTTPS) — sin SMTP, funciona en Render Free.
 *
 * Variables de entorno requeridas:
 *   ZOHO_CLIENT_ID      — Client ID de la app Self-Client en api-console.zoho.com
 *   ZOHO_CLIENT_SECRET  — Client Secret
 *   ZOHO_REFRESH_TOKEN  — Refresh token (no expira)
 *   ZOHO_ACCOUNT_ID     — ID numérico de la cuenta Zoho Mail
 *   ZOHO_FROM_EMAIL     — info@rural24.com.ar
 */

import { logger } from '@/infrastructure/logger';

const ZOHO_TOKEN_URL   = 'https://accounts.zoho.com/oauth/v2/token';
const ZOHO_MAIL_URL    = 'https://mail.zoho.com/api/accounts';

// ── Cache de access token (expira en 1 hora) ──────────────────
let _accessToken: string | null = null;
let _tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (_accessToken && Date.now() < _tokenExpiresAt - 60_000) {
    return _accessToken;
  }

  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Zoho OAuth no configurado — agregar ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN en Render');
  }

  const params = new URLSearchParams({
    grant_type:    'refresh_token',
    client_id:     ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    refresh_token: ZOHO_REFRESH_TOKEN,
  });

  const res = await fetch(ZOHO_TOKEN_URL, {
    method: 'POST',
    body:   params,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoho token refresh fallido: ${err}`);
  }

  const data = await res.json();
  _accessToken    = data.access_token;
  _tokenExpiresAt = Date.now() + (data.expires_in * 1000);

  logger.info('[Email] Zoho access token renovado');
  return _accessToken!;
}

// ── Tipos ────────────────────────────────────────────────────

export interface FeaturedActivatedData {
  to:        string;
  toName:    string;
  adTitle:   string;
  adSlug:    string;
  expiresAt: string;
}

// ── Template HTML ─────────────────────────────────────────────

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
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <tr>
            <td style="background:#65a30d;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">
                Rural<span style="background:#ffffff;color:#65a30d;border-radius:4px;padding:0 5px;margin-left:2px;">24</span>
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Hola, <strong style="color:#111827;">${d.toName}</strong></p>
              <h2 style="margin:0 0 20px;color:#111827;font-size:20px;font-weight:bold;line-height:1.3;">
                ¡Tu aviso ya está destacado!
              </h2>

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

              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#65a30d;border-radius:8px;">
                    <a href="${adUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                      Ver mi aviso
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                Tu aviso aparecerá en los primeros lugares de búsqueda y en la página de inicio
                hasta la fecha indicada.
              </p>
            </td>
          </tr>

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

// ── Envío ─────────────────────────────────────────────────────

export async function sendFeaturedActivatedEmail(data: FeaturedActivatedData): Promise<void> {
  const accountId   = process.env.ZOHO_ACCOUNT_ID;
  const fromAddress = process.env.ZOHO_FROM_EMAIL || 'info@rural24.com.ar';

  if (!accountId) {
    throw new Error('ZOHO_ACCOUNT_ID no configurado en Render');
  }

  const token = await getAccessToken();

  const body = {
    fromAddress,
    fromName:    'Rural24 - Clasificados',
    toAddress:   data.to,
    subject:     `Tu aviso "${data.adTitle.substring(0, 50)}" ya esta destacado en Rural24`,
    mailFormat:  'html',
    content:     templateFeaturedActivated(data),
  };

  const res = await fetch(`${ZOHO_MAIL_URL}/${accountId}/messages`, {
    method:  'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoho Mail API error ${res.status}: ${err}`);
  }

  logger.info(`[Email] Enviado featured_activated → ${data.to}`);
}

// ── Welcome email ─────────────────────────────────────────────

export interface WelcomeEmailData {
  to:        string;
  toName:    string;
  firstName: string;
}

export interface WelcomeVerifyEmailData {
  to:               string;
  toName:           string;
  firstName:        string;
  confirmationLink: string;
}

function templateWelcome(d: WelcomeEmailData): string {
  const name = d.firstName || d.toName || 'Agricultor';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <tr>
            <td style="background:#65a30d;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">
                Rural<span style="background:#ffffff;color:#65a30d;border-radius:4px;padding:0 5px;margin-left:2px;">24</span>
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Hola, <strong style="color:#111827;">${name}</strong></p>
              <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:bold;line-height:1.3;">
                ¡Bienvenido a Rural24!
              </h2>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
                Ya sos parte de la comunidad de clasificados agrarios más grande de Argentina.
                Publicá tus avisos, encontrá lo que necesitás y conectate con productores de todo el país.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="33%" style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:20px;">🌾</p>
                    <p style="margin:0;font-size:12px;font-weight:bold;color:#111827;">Publicá gratis</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Hacienda, insumos y maquinaria</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:20px;">🔍</p>
                    <p style="margin:0;font-size:12px;font-weight:bold;color:#111827;">Buscá avisos</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Filtrá por provincia y precio</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:20px;">⭐</p>
                    <p style="margin:0;font-size:12px;font-weight:bold;color:#111827;">Destacá</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Aparecé primero en búsquedas</p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#65a30d;border-radius:8px;">
                    <a href="https://rural24.com.ar" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                      Ir a Rural24
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

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

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const accountId   = process.env.ZOHO_ACCOUNT_ID;
  const fromAddress = process.env.ZOHO_FROM_EMAIL || 'info@rural24.com.ar';

  if (!accountId) throw new Error('ZOHO_ACCOUNT_ID no configurado en Render');

  const token = await getAccessToken();

  const res = await fetch(`${ZOHO_MAIL_URL}/${accountId}/messages`, {
    method:  'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      fromAddress,
      fromName:   'Rural24 - Clasificados',
      toAddress:  data.to,
      subject:    `¡Bienvenido a Rural24, ${data.firstName || data.toName}!`,
      mailFormat: 'html',
      content:    templateWelcome(data),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoho Mail API error ${res.status}: ${err}`);
  }

  logger.info(`[Email] Enviado welcome → ${data.to}`);
}

// ── Welcome email con verificación (email/contraseña) ─────────

function templateWelcomeVerify(d: WelcomeVerifyEmailData): string {
  const name = d.firstName || d.toName || 'Agricultor';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <tr>
            <td style="background:#65a30d;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">
                Rural<span style="background:#ffffff;color:#65a30d;border-radius:4px;padding:0 5px;margin-left:2px;">24</span>
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Hola, <strong style="color:#111827;">${name}</strong></p>
              <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:bold;line-height:1.3;">
                ¡Bienvenido a Rural24!
              </h2>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
                Ya sos parte de la comunidad de clasificados agrarios más grande de Argentina.
                Antes de empezar, confirmá tu cuenta haciendo clic en el botón de abajo.
              </p>

              <!-- CTA principal: confirmar cuenta -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#65a30d;border-radius:8px;">
                    <a href="${d.confirmationLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                      Confirmar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso de expiración -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                      <strong>⚠️ Este link es de un solo uso</strong> y expira en 24 horas.<br>
                      Si no confirmás tu cuenta no vas a poder iniciar sesión.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Qué podés hacer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="33%" style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:20px;">🌾</p>
                    <p style="margin:0;font-size:12px;font-weight:bold;color:#111827;">Publicá gratis</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Hacienda, insumos y maquinaria</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:20px;">🔍</p>
                    <p style="margin:0;font-size:12px;font-weight:bold;color:#111827;">Buscá avisos</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Filtrá por provincia y precio</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:20px;">⭐</p>
                    <p style="margin:0;font-size:12px;font-weight:bold;color:#111827;">Destacá</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Aparecé primero en búsquedas</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Si el botón no funciona, copiá este link en tu navegador:<br>
                <a href="${d.confirmationLink}" style="color:#65a30d;word-break:break-all;">${d.confirmationLink}</a>
              </p>
            </td>
          </tr>

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

export async function sendWelcomeVerifyEmail(data: WelcomeVerifyEmailData): Promise<void> {
  const accountId   = process.env.ZOHO_ACCOUNT_ID;
  const fromAddress = process.env.ZOHO_FROM_EMAIL || 'info@rural24.com.ar';

  if (!accountId) throw new Error('ZOHO_ACCOUNT_ID no configurado en Render');

  const token = await getAccessToken();

  const res = await fetch(`${ZOHO_MAIL_URL}/${accountId}/messages`, {
    method:  'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      fromAddress,
      fromName:   'Rural24 - Clasificados',
      toAddress:  data.to,
      subject:    `¡Bienvenido a Rural24! Confirmá tu cuenta, ${data.firstName || data.toName}`,
      mailFormat: 'html',
      content:    templateWelcomeVerify(data),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoho Mail API error ${res.status}: ${err}`);
  }

  logger.info(`[Email] Enviado welcome_verify → ${data.to}`);
}

// ── Verificar configuración ───────────────────────────────────

export async function verifyZohoConfig(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch (error: any) {
    logger.error('[Email] Zoho config inválida:', error.message);
    return false;
  }
}
