// ====================================================================
// UTILIDADES DE FORMATO DE MONEDA
// ====================================================================

import { TEXTS } from '../constants/texts';

export interface CurrencyConfig {
  locale: string;
  currency: string;
}

export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  locale: 'es-AR',
  currency: 'ARS',
};

/**
 * Formatea un número como precio con el locale configurado
 * @param price - El precio a formatear (puede ser number o string)
 * @param config - Configuración de locale y moneda (opcional)
 * @returns String formateado como precio o texto de consulta
 */
export function formatPrice(
  price: number | string | null | undefined,
  config: Partial<CurrencyConfig> = {}
): string {
  const { locale, currency } = { ...DEFAULT_CURRENCY_CONFIG, ...config };

  if (!price || price === 'consultar' || price === 'a_consultar') {
    return TEXTS.adDetail.consultPrice;
  }

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return TEXTS.adDetail.consultPrice;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

/**
 * Formatea un número simple con separadores de miles
 * @param value - El valor a formatear
 * @param locale - Locale a usar (por defecto 'es-AR')
 * @returns String formateado con separadores
 */
export function formatNumber(
  value: number | string,
  locale: string = DEFAULT_CURRENCY_CONFIG.locale
): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat(locale).format(numericValue);
}

/**
 * Convierte un valor booleano a texto legible
 * @param value - El valor booleano
 * @returns 'Sí', 'No' o el valor original si no es booleano
 */
export function formatBoolean(value: any): string {
  if (typeof value === 'boolean') {
    return value ? TEXTS.adDetail.yes : TEXTS.adDetail.no;
  }
  
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    if (normalized === 'true' || normalized === 'sí' || normalized === 'si') {
      return TEXTS.adDetail.yes;
    }
    if (normalized === 'false' || normalized === 'no') {
      return TEXTS.adDetail.no;
    }
  }
  
  return String(value);
}

/**
 * Formatea un valor según su tipo
 * @param value - El valor a formatear
 * @returns String formateado según el tipo de dato
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '-';
  }

  // Booleanos
  if (typeof value === 'boolean') {
    return formatBoolean(value);
  }

  // Strings que parecen booleanos
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    if (['true', 'false', 'sí', 'si', 'no'].includes(normalized)) {
      return formatBoolean(value);
    }
  }

  // Números grandes (usar separadores)
  if (typeof value === 'number' && value > 999) {
    return formatNumber(value);
  }

  return String(value);
}
