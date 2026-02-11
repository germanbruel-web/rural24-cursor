/**
 * Session Handler - Stateless JWT + Optional DB Sessions
 * =======================================================
 * IMPORTANTE: Render puede matar/reiniciar instancias en cualquier momento
 * Las sesiones NUNCA deben estar solo en memoria
 * 
 * ETAPA 1: JWT stateless (sin DB)
 * ETAPA 2: JWT + DB sessions (para revocación)
 * ETAPA 3: JWT + Redis sessions (ultra-rápido)
 * 
 * INSTALACIÓN REQUERIDA:
 * npm install jsonwebtoken @types/jsonwebtoken
 */

// @ts-ignore - Instalar con: npm install jsonwebtoken @types/jsonwebtoken
import * as jwt from 'jsonwebtoken';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  planId?: string;
  jti?: string;
  [key: string]: any;
}

export interface SessionOptions {
  expiresIn?: string; // '7d', '1h', etc.
  refreshable?: boolean;
}

// =========================================
// JWT UTILITIES (Stateless) - jsonwebtoken
// =========================================

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production-use-32-chars-min';

export async function createSession(
  data: SessionData,
  options: SessionOptions = {}
): Promise<string> {
  const expiresIn = options.expiresIn || '7d';
  const jti = `${data.userId}-${Date.now()}`;
  
  const payload = { ...data, jti };
  
  // @ts-ignore - Los tipos se resuelven al instalar @types/jsonwebtoken
  const token = jwt.sign(payload, JWT_SECRET, { 
    expiresIn,
    algorithm: 'HS256' as const
  });

  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    // @ts-ignore - Los tipos se resuelven al instalar @types/jsonwebtoken
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    return decoded;
  } catch (error) {
    console.error('[Session] JWT verification failed:', error);
    return null;
  }
}

export async function refreshSession(
  oldToken: string,
  options: SessionOptions = {}
): Promise<string | null> {
  const session = await verifySession(oldToken);
  if (!session) return null;

  // Crear nuevo token con mismos datos
  return createSession(session, options);
}

// =========================================
// DB-BACKED SESSIONS (Revocación)
// =========================================

import { PrismaClient } from '@prisma/client';

export interface ISessionStore {
  create(userId: string, token: string, expiresAt: Date): Promise<void>;
  exists(jti: string): Promise<boolean>;
  revoke(jti: string): Promise<void>;
  revokeAll(userId: string): Promise<void>;
  cleanup(): Promise<number>;
}

/**
 * Session store en base de datos
 * Requiere tabla: sessions (id, user_id, jti, expires_at)
 */
class DatabaseSessionStore implements ISessionStore {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, jti: string, expiresAt: Date): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO sessions (user_id, jti, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (jti) DO NOTHING`,
      userId,
      jti,
      expiresAt
    );
  }

  async exists(jti: string): Promise<boolean> {
    const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM sessions 
       WHERE jti = $1 AND expires_at > NOW()`,
      jti
    );
    return Number(result[0]?.count || 0) > 0;
  }

  async revoke(jti: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM sessions WHERE jti = $1`,
      jti
    );
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM sessions WHERE user_id = $1`,
      userId
    );
  }

  async cleanup(): Promise<number> {
    const result = await this.prisma.$executeRaw`
      DELETE FROM sessions WHERE expires_at < NOW()
    `;
    // $executeRaw retorna número de rows afectados directamente
    return typeof result === 'number' ? result : 0;
  }
}

/**
 * Session store en Redis (más rápido)
 */
class RedisSessionStore implements ISessionStore {
  private keyPrefix = 'session:';

  constructor(private redis: any) {}

  async create(userId: string, jti: string, expiresAt: Date): Promise<void> {
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    await this.redis.setex(`${this.keyPrefix}${jti}`, ttl, userId);
    
    // Índice por usuario para revocación masiva
    await this.redis.sadd(`${this.keyPrefix}user:${userId}`, jti);
    await this.redis.expire(`${this.keyPrefix}user:${userId}`, ttl);
  }

  async exists(jti: string): Promise<boolean> {
    const exists = await this.redis.exists(`${this.keyPrefix}${jti}`);
    return exists === 1;
  }

  async revoke(jti: string): Promise<void> {
    // Obtener userId primero
    const userId = await this.redis.get(`${this.keyPrefix}${jti}`);
    
    await this.redis.del(`${this.keyPrefix}${jti}`);
    
    if (userId) {
      await this.redis.srem(`${this.keyPrefix}user:${userId}`, jti);
    }
  }

  async revokeAll(userId: string): Promise<void> {
    const jtis = await this.redis.smembers(`${this.keyPrefix}user:${userId}`);
    
    if (jtis.length > 0) {
      const keys = jtis.map((jti: string) => `${this.keyPrefix}${jti}`);
      await this.redis.del(...keys, `${this.keyPrefix}user:${userId}`);
    }
  }

  async cleanup(): Promise<number> {
    // Redis maneja TTL automáticamente
    return 0;
  }
}

// =========================================
// SESSION MANAGER (Combina JWT + Store)
// =========================================

export class SessionManager {
  private store: ISessionStore | null;

  constructor(store?: ISessionStore) {
    this.store = store || null;
  }

  async create(data: SessionData, options: SessionOptions = {}): Promise<string> {
    const token = await createSession(data, options);

    // Si hay store, registrar sesión
    if (this.store) {
      const decoded = await verifySession(token);
      if (decoded?.jti) {
        const expiresAt = new Date(Date.now() + this.parseExpiry(options.expiresIn || '7d'));
        await this.store.create(data.userId, decoded.jti, expiresAt);
      }
    }

    return token;
  }

  async verify(token: string): Promise<SessionData | null> {
    const session = await verifySession(token);
    if (!session) return null;

    // Si hay store, verificar que no esté revocada
    if (this.store && session.jti) {
      const exists = await this.store.exists(session.jti);
      if (!exists) {
        console.warn(`[SessionManager] Token ${session.jti} was revoked`);
        return null;
      }
    }

    return session;
  }

  async revoke(token: string): Promise<void> {
    if (!this.store) {
      console.warn('[SessionManager] Cannot revoke: no session store configured');
      return;
    }

    const session = await verifySession(token);
    if (session?.jti) {
      await this.store.revoke(session.jti);
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    if (!this.store) {
      console.warn('[SessionManager] Cannot revoke: no session store configured');
      return;
    }

    await this.store.revokeAll(userId);
  }

  async refresh(token: string, options?: SessionOptions): Promise<string | null> {
    const session = await this.verify(token);
    if (!session) return null;

    // Revocar viejo token
    if (this.store && session.jti) {
      await this.store.revoke(session.jti);
    }

    // Crear nuevo token
    return this.create(session, options);
  }

  private parseExpiry(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}

// =========================================
// FACTORY
// =========================================

export function createSessionManager(config?: {
  type?: 'stateless' | 'database' | 'redis';
  prisma?: PrismaClient;
  redis?: any;
}): SessionManager {
  if (!config || config.type === 'stateless') {
    console.log('[Sessions] Using stateless JWT (no revocation)');
    return new SessionManager();
  }

  if (config.type === 'redis' && config.redis) {
    console.log('[Sessions] Using Redis-backed sessions');
    return new SessionManager(new RedisSessionStore(config.redis));
  }

  if (config.type === 'database' && config.prisma) {
    console.log('[Sessions] Using DB-backed sessions');
    return new SessionManager(new DatabaseSessionStore(config.prisma));
  }

  console.warn('[Sessions] Invalid config, falling back to stateless');
  return new SessionManager();
}

// =========================================
// SINGLETON
// =========================================

let globalSessionManager: SessionManager | null = null;

export function initSessionManager(config?: Parameters<typeof createSessionManager>[0]): SessionManager {
  if (!globalSessionManager) {
    globalSessionManager = createSessionManager(config);
  }
  return globalSessionManager;
}

export function getSessionManager(): SessionManager {
  if (!globalSessionManager) {
    console.warn('[Sessions] Manager not initialized, creating stateless default');
    globalSessionManager = new SessionManager();
  }
  return globalSessionManager;
}
