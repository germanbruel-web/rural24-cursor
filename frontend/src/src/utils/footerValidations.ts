/**
 * =====================================================
 * FOOTER VALIDATIONS - Validadores para Footer CMS
 * =====================================================
 */

import type { FooterConfig, ContactItem, FooterLinkItem, SocialLinkItem } from '../types/footer';

// ============ VALIDADORES DE FORMATO ============

/**
 * Validar formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar formato de URL
 */
export const isValidURL = (url: string): boolean => {
  // Acepta URLs absolutas (http/https) o rutas relativas (#/)
  const urlRegex = /^(https?:\/\/|#\/)/;
  return urlRegex.test(url);
};

/**
 * Validar formato de teléfono (flexible)
 */
export const isValidPhone = (phone: string): boolean => {
  // Acepta formato flexible: +54 9 11 1234-5678 o similar
  const phoneRegex = /^\+?[\d\s\-()]{8,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validar que no haya orders duplicados
 */
export const hasValidOrder = (items: { order: number }[]): boolean => {
  const orders = items.map(i => i.order);
  return orders.length === new Set(orders).size; // No duplicados
};

/**
 * Validar ID único
 */
export const isValidId = (id: string): boolean => {
  return id && id.length > 0;
};

// ============ VALIDADORES DE ITEMS ============

/**
 * Validar ContactItem
 */
export const validateContactItem = (item: ContactItem, type: 'address' | 'phone' | 'email'): string | null => {
  if (!isValidId(item.id)) {
    return 'ID inválido';
  }
  
  if (!item.text || item.text.trim().length === 0) {
    return 'Texto vacío';
  }
  
  if (type === 'email' && !isValidEmail(item.text)) {
    return 'Formato de email inválido';
  }
  
  if (type === 'phone' && !isValidPhone(item.text)) {
    return 'Formato de teléfono sugerido: +54 9 11 1234-5678';
  }
  
  if (typeof item.order !== 'number' || item.order < 0) {
    return 'Orden inválido';
  }
  
  return null; // Válido
};

/**
 * Validar FooterLinkItem
 */
export const validateLinkItem = (item: FooterLinkItem): string | null => {
  if (!isValidId(item.id)) {
    return 'ID inválido';
  }
  
  if (!item.label || item.label.trim().length === 0) {
    return 'Label vacío';
  }
  
  if (!item.url || !isValidURL(item.url)) {
    return 'URL inválida. Debe empezar con http://, https:// o #/';
  }
  
  if (typeof item.order !== 'number' || item.order < 0) {
    return 'Orden inválido';
  }
  
  return null; // Válido
};

/**
 * Validar SocialLinkItem
 */
export const validateSocialItem = (item: SocialLinkItem): string | null => {
  if (!isValidId(item.id)) {
    return 'ID inválido';
  }
  
  const validPlatforms = ['twitter', 'facebook', 'instagram', 'whatsapp', 'youtube', 'tiktok', 'linkedin'];
  if (!validPlatforms.includes(item.platform)) {
    return `Platform inválida. Debe ser una de: ${validPlatforms.join(', ')}`;
  }
  
  if (!item.url || !isValidURL(item.url)) {
    return 'URL inválida. Debe empezar con http:// o https://';
  }
  
  if (typeof item.order !== 'number' || item.order < 0) {
    return 'Orden inválido';
  }
  
  return null; // Válido
};

// ============ VALIDADORES DE COLUMNAS ============

/**
 * Validar Columna 1 (Contacto)
 */
export const validateColumn1 = (column: FooterConfig['column1']): string[] => {
  const errors: string[] = [];
  
  if (!column.slogan || column.slogan.trim().length === 0) {
    errors.push('Slogan vacío');
  }
  
  if (column.addresses.length === 0) {
    errors.push('Debe haber al menos 1 dirección');
  }
  
  if (column.phones.length === 0) {
    errors.push('Debe haber al menos 1 teléfono');
  }
  
  if (column.emails.length === 0) {
    errors.push('Debe haber al menos 1 email');
  }
  
  // Validar cada address
  column.addresses.forEach((item, idx) => {
    const error = validateContactItem(item, 'address');
    if (error) errors.push(`Dirección ${idx + 1}: ${error}`);
  });
  
  // Validar cada phone
  column.phones.forEach((item, idx) => {
    const error = validateContactItem(item, 'phone');
    if (error) errors.push(`Teléfono ${idx + 1}: ${error}`);
  });
  
  // Validar cada email
  column.emails.forEach((item, idx) => {
    const error = validateContactItem(item, 'email');
    if (error) errors.push(`Email ${idx + 1}: ${error}`);
  });
  
  // Validar orders únicos
  if (!hasValidOrder(column.addresses)) {
    errors.push('Direcciones: orders duplicados');
  }
  if (!hasValidOrder(column.phones)) {
    errors.push('Teléfonos: orders duplicados');
  }
  if (!hasValidOrder(column.emails)) {
    errors.push('Emails: orders duplicados');
  }
  
  return errors;
};

/**
 * Validar Columna 2 (Links)
 */
export const validateColumn2 = (column: FooterConfig['column2']): string[] => {
  const errors: string[] = [];
  
  if (!column.title || column.title.trim().length === 0) {
    errors.push('Título vacío');
  }
  
  if (column.items.length === 0) {
    errors.push('Debe haber al menos 1 link');
  }
  
  column.items.forEach((item, idx) => {
    const error = validateLinkItem(item);
    if (error) errors.push(`Link ${idx + 1}: ${error}`);
  });
  
  if (!hasValidOrder(column.items)) {
    errors.push('Orders duplicados');
  }
  
  return errors;
};

/**
 * Validar Columna 3 (Categorías)
 */
export const validateColumn3 = (column: FooterConfig['column3']): string[] => {
  const errors: string[] = [];
  
  if (!column.title || column.title.trim().length === 0) {
    errors.push('Título vacío');
  }
  
  if (column.limit < 1 || column.limit > 20) {
    errors.push('Límite debe estar entre 1 y 20');
  }
  
  if (column.source === 'manual') {
    if (!column.manualItems || column.manualItems.length === 0) {
      errors.push('Source manual requiere al menos 1 item');
    } else {
      column.manualItems.forEach((item, idx) => {
        const error = validateLinkItem(item);
        if (error) errors.push(`Categoría ${idx + 1}: ${error}`);
      });
      
      if (!hasValidOrder(column.manualItems)) {
        errors.push('Orders duplicados');
      }
    }
  }
  
  return errors;
};

/**
 * Validar Columna 4 (Mixed)
 */
export const validateColumn4 = (column: FooterConfig['column4']): string[] => {
  const errors: string[] = [];
  
  if (!column.title || column.title.trim().length === 0) {
    errors.push('Título vacío');
  }
  
  if (column.links.length === 0) {
    errors.push('Debe haber al menos 1 link');
  }
  
  if (column.socials.length === 0) {
    errors.push('Debe haber al menos 1 red social');
  }
  
  column.links.forEach((item, idx) => {
    const error = validateLinkItem(item);
    if (error) errors.push(`Link ${idx + 1}: ${error}`);
  });
  
  column.socials.forEach((item, idx) => {
    const error = validateSocialItem(item);
    if (error) errors.push(`Red social ${idx + 1}: ${error}`);
  });
  
  if (!hasValidOrder(column.links)) {
    errors.push('Links: orders duplicados');
  }
  
  if (!hasValidOrder(column.socials)) {
    errors.push('Redes sociales: orders duplicados');
  }
  
  return errors;
};

/**
 * Validar FooterConfig completo
 */
export const validateFooterConfig = (config: FooterConfig): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {
    column1: validateColumn1(config.column1),
    column2: validateColumn2(config.column2),
    column3: validateColumn3(config.column3),
    column4: validateColumn4(config.column4),
  };
  
  const allErrors = Object.values(errors).flat();
  
  return {
    isValid: allErrors.length === 0,
    errors
  };
};

// ============ CONSTANTES ============

export const MIN_CONTACT_ITEMS = 1;
export const MIN_LINKS = 1;
export const MAX_CATEGORIES_LIMIT = 20;
export const MIN_CATEGORIES_LIMIT = 1;
