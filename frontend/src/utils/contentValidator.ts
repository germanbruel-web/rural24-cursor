/**
 * Content Validator - Anti-Fraude Frontend
 * Validación en tiempo real para Título y Descripción
 * 
 * @author GitHub Copilot
 * @date 2026-01-05
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: 'number' | 'at-symbol' | 'domain' | 'phone' | 'multiple';
  blockedPattern?: string;
}

/**
 * TLDs (Top Level Domains) prohibidos
 */
const BLOCKED_TLDS = [
  'com', 'net', 'org', 'ar', 'io', 'co', 'info', 'biz', 'me', 'tv',
  'app', 'dev', 'edu', 'gov', 'mil', 'int', 'xyz', 'online', 'site',
  'store', 'tech', 'club', 'shop', 'blog', 'news', 'pro', 'mobi',
];

/**
 * Palabras clave relacionadas con contacto
 */
const CONTACT_KEYWORDS = [
  'whatsapp', 'wsp', 'wp', 'wapp',
  'telefono', 'teléfono', 'tel', 'celular', 'cel',
  'contacto', 'llamar', 'llamame', 'llamá',
  'mensaje', 'escribir', 'escribime', 'escribí',
];

/**
 * Regex Patterns
 */
const PATTERNS = {
  // Números: cualquier dígito
  numbers: /\d/,
  
  // Símbolo @
  atSymbol: /@/,
  
  // Dominios web: palabra.tld
  domain: new RegExp(`\\b[a-z0-9-]+\\.(${BLOCKED_TLDS.join('|')})\\b`, 'i'),
  
  // Teléfonos (10+ dígitos)
  phone: /\d{10,}/,
  
  // URLs completas
  url: /https?:\/\//i,
  
  // Combinación sospechosa: número + palabra de contacto
  suspiciousCombination: new RegExp(
    `(${CONTACT_KEYWORDS.join('|')}).*\\d|\\d.*(${CONTACT_KEYWORDS.join('|')})`,
    'gi'
  ),
};

/**
 * Mensajes de error personalizados
 */
const ERROR_MESSAGES = {
  number: 'No se permiten números en este campo',
  atSymbol: 'No se permite el símbolo @ (correos electrónicos)',
  domain: 'No se permiten sitios web o dominios',
  phone: 'No se permiten números de teléfono',
  multiple: 'Se detectó información de contacto no permitida',
};

/**
 * Validar contenido contra reglas anti-fraude
 * 
 * @param text - Texto a validar
 * @param fieldName - Nombre del campo (para contexto)
 * @returns ValidationResult con estado y mensaje de error
 */
export function validateContent(
  text: string,
  fieldName: 'title' | 'description' = 'title'
): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { isValid: true };
  }

  const normalized = text.trim();

  // 1. Detectar URLs completas (http/https)
  if (PATTERNS.url.test(normalized)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.domain,
      errorType: 'domain',
      blockedPattern: normalized.match(PATTERNS.url)?.[0],
    };
  }

  // 2. Detectar dominios (ejemplo.com)
  const domainMatch = normalized.match(PATTERNS.domain);
  if (domainMatch) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.domain,
      errorType: 'domain',
      blockedPattern: domainMatch[0],
    };
  }

  // 3. Detectar símbolo @ (emails)
  if (PATTERNS.atSymbol.test(normalized)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.atSymbol,
      errorType: 'at-symbol',
      blockedPattern: '@',
    };
  }

  // 4. Detectar teléfonos (10+ dígitos consecutivos)
  const phoneMatch = normalized.match(PATTERNS.phone);
  if (phoneMatch) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.phone,
      errorType: 'phone',
      blockedPattern: phoneMatch[0],
    };
  }

  // 5. Detectar números simples (SOLO si hay combinación sospechosa)
  if (PATTERNS.numbers.test(normalized)) {
    // Permitir números si NO están combinados con palabras de contacto
    const hasSuspiciousCombination = PATTERNS.suspiciousCombination.test(normalized);
    
    if (hasSuspiciousCombination) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.multiple,
        errorType: 'multiple',
      };
    }
    
    // Números solos en contexto normal = PERMITIDO
    // Ej: "Tractor año 2020", "Lote 45", "2 ambientes"
    return { isValid: true };
  }

  return { isValid: true };
}

/**
 * Validar específicamente el título
 */
export function validateTitle(title: string): ValidationResult {
  return validateContent(title, 'title');
}

/**
 * Validar específicamente la descripción
 */
export function validateDescription(description: string): ValidationResult {
  return validateContent(description, 'description');
}

/**
 * Validar en tiempo real (LEGACY - mantener compatibilidad)
 */
export function validateNoContactInfo(text: string): ValidationResult {
  const result = validateContent(text);
  return {
    isValid: result.isValid,
    reason: result.error,
  };
}

/**
 * Sanitizar texto en tiempo real
 */
export function sanitizeInput(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim();
}
