/**
 * Rate Limiting Service - In-Memory
 * Protege contra abuso de uploads sin necesitar Redis
 */

interface RateLimitEntry {
  uploads: number;
  lastReset: number;
  blocked: boolean;
  blockUntil?: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  
  // Límites configurables
  private readonly LIMIT_PER_WINDOW = 10; // uploads por ventana
  private readonly WINDOW_MS = 5 * 60 * 1000; // 5 minutos
  private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 min bloqueo
  private readonly CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // Limpiar cada 10 min

  constructor() {
    // Auto-cleanup de entradas antiguas
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Verificar si el identificador (IP/user) puede hacer upload
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number; reason?: string } {
    const now = Date.now();
    let entry = this.store.get(identifier);

    // Si está bloqueado, verificar si ya pasó el tiempo
    if (entry?.blocked && entry.blockUntil) {
      if (now < entry.blockUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.blockUntil,
          reason: `Bloqueado hasta ${new Date(entry.blockUntil).toLocaleTimeString()}`
        };
      }
      // Desbloquear
      entry.blocked = false;
      entry.uploads = 0;
      entry.lastReset = now;
    }

    // Si no existe o la ventana expiró, crear/resetear
    if (!entry || (now - entry.lastReset) > this.WINDOW_MS) {
      entry = {
        uploads: 0,
        lastReset: now,
        blocked: false
      };
      this.store.set(identifier, entry);
    }

    // Verificar límite
    if (entry.uploads >= this.LIMIT_PER_WINDOW) {
      // Bloquear por BLOCK_DURATION_MS
      entry.blocked = true;
      entry.blockUntil = now + this.BLOCK_DURATION_MS;
      this.store.set(identifier, entry);

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockUntil,
        reason: `Límite excedido. Bloqueado por ${Math.floor(this.BLOCK_DURATION_MS / 60000)} minutos`
      };
    }

    return {
      allowed: true,
      remaining: this.LIMIT_PER_WINDOW - entry.uploads,
      resetAt: entry.lastReset + this.WINDOW_MS
    };
  }

  /**
   * Registrar un upload exitoso
   */
  record(identifier: string): void {
    const entry = this.store.get(identifier);
    if (entry) {
      entry.uploads++;
      this.store.set(identifier, entry);
    }
  }

  /**
   * Limpiar entradas antiguas (más de 1 hora sin actividad)
   */
  private cleanup(): void {
    const now = Date.now();
    const MAX_AGE = 60 * 60 * 1000; // 1 hora

    for (const [key, entry] of this.store.entries()) {
      if ((now - entry.lastReset) > MAX_AGE && !entry.blocked) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Stats para monitoreo
   */
  getStats(): { totalEntries: number; blockedCount: number } {
    let blockedCount = 0;
    for (const entry of this.store.values()) {
      if (entry.blocked) blockedCount++;
    }

    return {
      totalEntries: this.store.size,
      blockedCount
    };
  }
}

// Singleton global
export const rateLimiter = new RateLimiter();
