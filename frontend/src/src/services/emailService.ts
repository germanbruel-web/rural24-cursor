import { supabase } from './supabaseClient';

/**
 * Email service para notificaciones de contacto
 * TODO: Integrar con Resend, SendGrid u otro proveedor
 */

interface EmailContactNotification {
  toEmail: string;
  toName: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  adTitle: string;
  adId: string;
  receivedCount: number;
}

/**
 * Enviar notificación por email cuando alguien contacta al vendedor
 * Para usuarios FREE: Solo primeros 5 contactos incluyen datos completos
 */
export async function sendContactNotificationEmail(data: EmailContactNotification): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const isOverLimit = data.receivedCount >= 5;

    // Para implementar con Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    
    if (isOverLimit) {
      // Email #6+: Mensaje de upgrade sin datos del comprador
      console.log('📧 [EMAIL] Enviando notificación de límite alcanzado a:', data.toEmail);
      console.log(`
        Para: ${data.toEmail}
        Asunto: ⚠️ Límite de contactos alcanzado - Upgrade a Premium
        
        Hola ${data.toName},
        
        Has recibido ${data.receivedCount} contactos para tu aviso "${data.adTitle}".
        
        🎯 Actualiza a Premium para:
        - Recibir contactos ilimitados
        - Ver todos los datos de los interesados
        - Destacar tus avisos
        
        [Botón: Actualizar a Premium]
        
        ¿Preguntas? Escríbenos a soporte@agrobuscador.com
      `);
      
      // TODO: Implementar envío real
      // await resend.emails.send({ ... });
      
    } else {
      // Primeros 5 contactos: Email completo con datos
      console.log('📧 [EMAIL] Enviando notificación de contacto a:', data.toEmail);
      console.log(`
        Para: ${data.toEmail}
        Asunto: 💬 Nuevo contacto para "${data.adTitle}"
        
        Hola ${data.toName},
        
        ¡Tienes un nuevo contacto interesado en tu aviso "${data.adTitle}"!
        
        📋 Datos del interesado:
        • Nombre: ${data.senderName}
        • Email: ${data.senderEmail}
        ${data.senderPhone ? `• Teléfono: ${data.senderPhone}` : ''}
        
        💬 Mensaje:
        "${data.message}"
        
        Responde directamente a este email o contacta al interesado.
        
        ---
        Contactos recibidos: ${data.receivedCount}/5 (cuenta FREE)
        ${data.receivedCount >= 4 ? '⚠️ Estás cerca del límite. Considera actualizar a Premium.' : ''}
      `);
      
      // TODO: Implementar envío real
      // await resend.emails.send({ ... });
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: 'Error al enviar notificación' };
  }
}

/**
 * Plantilla HTML para email (opcional, para cuando se integre el servicio real)
 */
export function getContactEmailTemplate(data: EmailContactNotification, isOverLimit: boolean): string {
  if (isOverLimit) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a135; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #16a135; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Límite de Contactos Alcanzado</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${data.toName}</strong>,</p>
            
            <p>Has recibido <strong>${data.receivedCount} contactos</strong> para tu aviso "<strong>${data.adTitle}</strong>".</p>
            
            <div class="warning">
              <strong>💎 Actualiza a Premium para:</strong>
              <ul>
                <li>✓ Recibir contactos ilimitados</li>
                <li>✓ Ver todos los datos de los interesados</li>
                <li>✓ Destacar tus avisos en búsquedas</li>
                <li>✓ Publicar avisos ilimitados</li>
              </ul>
            </div>
            
            <center>
              <a href="https://agrobuscador.com/premium" class="button">Actualizar a Premium</a>
            </center>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              ¿Preguntas? Escríbenos a <a href="mailto:soporte@agrobuscador.com">soporte@agrobuscador.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a135; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .message-box { background: #e8f5e9; border-left: 4px solid #16a135; padding: 15px; margin: 15px 0; }
        .counter { text-align: center; padding: 10px; background: #fff3cd; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 Nuevo Contacto</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${data.toName}</strong>,</p>
          
          <p>¡Tienes un nuevo contacto interesado en tu aviso <strong>"${data.adTitle}"</strong>!</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">📋 Datos del Interesado:</h3>
            <p><strong>Nombre:</strong> ${data.senderName}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.senderEmail}">${data.senderEmail}</a></p>
            ${data.senderPhone ? `<p><strong>Teléfono:</strong> ${data.senderPhone}</p>` : ''}
          </div>
          
          <div class="message-box">
            <h3 style="margin-top: 0;">💬 Mensaje:</h3>
            <p style="white-space: pre-wrap;">${data.message}</p>
          </div>
          
          <p><strong>¿Cómo responder?</strong><br>
          Responde directamente a este email o contacta al interesado usando los datos de arriba.</p>
          
          ${data.receivedCount >= 4 ? `
            <div class="counter">
              ⚠️ <strong>Contactos recibidos: ${data.receivedCount}/5</strong><br>
              <small>Estás cerca del límite. <a href="https://agrobuscador.com/premium">Considera actualizar a Premium</a>.</small>
            </div>
          ` : `
            <div class="counter">
              <small>Contactos recibidos: ${data.receivedCount}/5 (cuenta FREE)</small>
            </div>
          `}
        </div>
      </div>
    </body>
    </html>
  `;
}
