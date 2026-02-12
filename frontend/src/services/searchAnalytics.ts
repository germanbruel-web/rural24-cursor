/**
 * searchAnalytics.ts
 * Sistema de analytics para trackear búsquedas y generar insights
 * 
 * Features:
 * - Track de búsquedas en tiempo real
 * - Almacenamiento local + envío al backend
 * - Cálculo de tendencias
 * - Privacy-first (datos anonimizados)
 */

interface SearchEvent {
  query: string;
  timestamp: number;
  resultCount?: number;
  userId?: string;
  sessionId: string;
  filters?: Record<string, any>;
  source: 'header' | 'hero' | 'page';
}

interface SearchAnalytics {
  popularQueries: { query: string; count: number }[];
  recentSearches: SearchEvent[];
  trends: { query: string; growth: number }[];
}

const STORAGE_KEY = 'rural24_search_analytics';
const MAX_LOCAL_EVENTS = 100;
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 30000; // 30 segundos

class SearchAnalyticsService {
  private sessionId: string;
  private pendingEvents: SearchEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initBatchSending();
  }

  /**
   * Trackear una búsqueda
   */
  trackSearch(params: {
    query: string;
    resultCount?: number;
    filters?: Record<string, any>;
    source?: 'header' | 'hero' | 'page';
  }): void {
    const event: SearchEvent = {
      query: params.query.trim().toLowerCase(),
      timestamp: Date.now(),
      resultCount: params.resultCount,
      sessionId: this.sessionId,
      filters: params.filters,
      source: params.source || 'header',
    };

    // Guardar localmente
    this.saveLocalEvent(event);

    // Agregar a cola para envío
    this.pendingEvents.push(event);

    // Si llegamos al límite, enviar inmediatamente
    if (this.pendingEvents.length >= BATCH_SIZE) {
      this.sendBatch();
    }
  }

  /**
   * Obtener búsquedas populares (desde localStorage)
   */
  getPopularQueries(limit: number = 10): { query: string; count: number }[] {
    const events = this.getLocalEvents();
    const queryCounts = new Map<string, number>();

    events.forEach((event) => {
      const count = queryCounts.get(event.query) || 0;
      queryCounts.set(event.query, count + 1);
    });

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Obtener tendencias (queries con mayor crecimiento)
   */
  getTrending(limit: number = 5): { query: string; growth: number }[] {
    const events = this.getLocalEvents();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const twoDaysAgo = now - 48 * 60 * 60 * 1000;

    // Contar búsquedas en las últimas 24h vs 24-48h anteriores
    const recentCounts = new Map<string, number>();
    const previousCounts = new Map<string, number>();

    events.forEach((event) => {
      if (event.timestamp >= oneDayAgo) {
        const count = recentCounts.get(event.query) || 0;
        recentCounts.set(event.query, count + 1);
      } else if (event.timestamp >= twoDaysAgo) {
        const count = previousCounts.get(event.query) || 0;
        previousCounts.set(event.query, count + 1);
      }
    });

    // Calcular crecimiento
    const trends: { query: string; growth: number }[] = [];

    recentCounts.forEach((recentCount, query) => {
      const previousCount = previousCounts.get(query) || 0;
      const growth =
        previousCount > 0
          ? ((recentCount - previousCount) / previousCount) * 100
          : recentCount > 1
          ? 100 // 100% growth si no había búsquedas previas
          : 0;

      if (growth > 0) {
        trends.push({ query, growth });
      }
    });

    return trends.sort((a, b) => b.growth - a.growth).slice(0, limit);
  }

  /**
   * Obtener analytics completos
   */
  getAnalytics(): SearchAnalytics {
    return {
      popularQueries: this.getPopularQueries(10),
      recentSearches: this.getLocalEvents().slice(0, 20),
      trends: this.getTrending(5),
    };
  }

  /**
   * Limpiar datos locales (privacy)
   */
  clearAnalytics(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.pendingEvents = [];
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveLocalEvent(event: SearchEvent): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const events: SearchEvent[] = stored ? JSON.parse(stored) : [];

      // Agregar nuevo evento
      events.unshift(event);

      // Limitar cantidad de eventos almacenados
      const trimmed = events.slice(0, MAX_LOCAL_EVENTS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Error guardando analytics:', error);
    }
  }

  private getLocalEvents(): SearchEvent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Error cargando analytics:', error);
      return [];
    }
  }

  private initBatchSending(): void {
    // Enviar batch cada 30 segundos
    this.batchTimer = setInterval(() => {
      if (this.pendingEvents.length > 0) {
        this.sendBatch();
      }
    }, BATCH_INTERVAL);

    // Enviar batch antes de cerrar la página
    window.addEventListener('beforeunload', () => {
      if (this.pendingEvents.length > 0) {
        this.sendBatch();
      }
    });
  }

  private async sendBatch(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const batch = [...this.pendingEvents];
    this.pendingEvents = [];

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Endpoint para analytics (debe crearse en el backend)
      await fetch(`${apiUrl}/api/analytics/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: batch,
          timestamp: Date.now(),
        }),
        // No bloquear si falla
        keepalive: true,
      });
    } catch (error) {
      // Silencioso - no afectar UX si analytics falla
      console.debug('Analytics batch failed:', error);
      
      // Reintegramos los eventos para retry
      this.pendingEvents.unshift(...batch);
    }
  }

  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.sendBatch(); // Último envío
  }
}

// Singleton
export const searchAnalytics = new SearchAnalyticsService();

// Hook React para usar en componentes
export function useSearchAnalytics() {
  return {
    trackSearch: searchAnalytics.trackSearch.bind(searchAnalytics),
    getPopularQueries: searchAnalytics.getPopularQueries.bind(searchAnalytics),
    getTrending: searchAnalytics.getTrending.bind(searchAnalytics),
    getAnalytics: searchAnalytics.getAnalytics.bind(searchAnalytics),
    clearAnalytics: searchAnalytics.clearAnalytics.bind(searchAnalytics),
  };
}
