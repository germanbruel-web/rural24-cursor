/**
 * Content Validator - Anti-Fraude para Títulos y Descripciones
 * Detecta intentos de incluir información de contacto
 */

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  blockedPattern?: string;
}

/**
 * Patrones de contacto no permitidos
 */
const CONTACT_PATTERNS = {
  // Teléfonos (múltiples formatos internacionales)
  phone: [
    /\d{10,}/g, // 10+ dígitos seguidos
    /(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g, // Formatos: +54 11 1234-5678, (011) 1234-5678
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // 123-456-7890
    /whatsapp|wsp|wp|wapp/gi,
    /\btelefono\b|\bteléfono\b|\btel\b|\bcelular\b|\bcel\b/gi, // Word boundaries para evitar falsos positivos
  ],
  
  // Emails
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    /\b[a-z0-9]+\s*@\s*[a-z]+\s*\.\s*[a-z]{2,}/gi, // espacios entre @ y .
    /arroba|aroba/gi,
  ],
  
  // URLs y sitios web
  url: [
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/gi,
    /www\.[a-zA-Z0-9-]+\.[a-z]{2,}/gi,
    /\b[a-z0-9-]+\.(com|net|org|ar|info|biz|io|co)\b/gi,
    /punto\s*com|punto\s*ar|punto\s*net/gi,
  ],
  
  // Redes sociales
  social: [
    /facebook\.com|fb\.com|instagram\.com|twitter\.com|linkedin\.com/gi,
    /seguime|seguinos|seguir en|contactame por/gi,
  ],
  
  // Evasión común (números con espacios/letras)
  evasion: [
    /\d\s+\d\s+\d\s+\d/g, // 1 2 3 4 5 6 7 8 (números separados)
    /[0-9]{2,}\s*[a-z]+\s*[0-9]{2,}/gi, // 11 cuatro 5678
  ],
};

/**
 * Valida que el contenido no contenga información de contacto
 */
export function validateNoContactInfo(text: string, fieldName: string = 'texto'): ValidationResult {
  const normalized = text.toLowerCase().trim();
  
  // Verificar cada categoría de patrones
  for (const [category, patterns] of Object.entries(CONTACT_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = normalized.match(pattern);
      if (matches && matches.length > 0) {
        const blockedText = matches[0];
        return {
          isValid: false,
          reason: getBlockReason(category, blockedText),
          blockedPattern: category,
        };
      }
    }
  }
  
  return { isValid: true };
}

/**
 * Obtener mensaje de error amigable según el tipo de bloqueo
 */
function getBlockReason(category: string, blockedText: string): string {
  const messages: Record<string, string> = {
    phone: '❌ No se permiten números de teléfono en el título/descripción. Usa el botón de contacto oficial.',
    email: '❌ No se permiten emails en el título/descripción. Los compradores te contactarán por el sistema.',
    url: '❌ No se permiten URLs o sitios web en el título/descripción.',
    social: '❌ No se permiten enlaces a redes sociales. Usa el sistema de contacto.',
    evasion: '❌ Detectamos un intento de evadir el filtro de contactos. Por favor, usa solo texto descriptivo.',
  };
  
  return messages[category] || '❌ Contenido no permitido detectado.';
}

/**
 * Sanitizar texto removiendo caracteres peligrosos pero manteniendo puntuación normal
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios → 1 espacio
    .replace(/[<>]/g, ''); // Remover < > para evitar HTML
}
