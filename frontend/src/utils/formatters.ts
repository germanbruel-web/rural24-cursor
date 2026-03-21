export const SENSITIVE_RE = [
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  /(\+?54[\s\-.]?)?(\(?\d{2,4}\)?)[\s\-.]?\d{4}[\s\-.]?\d{4}/,
  /https?:\/\/\S+/i,
  /\b(whatsapp|wsp|telegram|instagram|facebook|mercadolibre|mercadopago|tiktok|signal)\b/i,
];

export const hasSensitiveContent = (text: string) =>
  SENSITIVE_RE.some((re) => re.test(text));

export function scanAttributesForSensitive(values: Record<string, unknown>): boolean {
  return Object.values(values).some(
    (v) => typeof v === 'string' && hasSensitiveContent(v),
  );
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function formatMessageDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days === 0) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'ayer';
  if (days < 7)  return d.toLocaleDateString('es-AR', { weekday: 'short' });
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}
