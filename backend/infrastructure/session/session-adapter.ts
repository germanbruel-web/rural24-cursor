/**
 * Session Adapter - Stateless session handling
 * =============================================
 * NUNCA almacena sesiones en memoria del servidor
 * 
 * Estrategias:
 * 1. JWT stateless (sin almacenamiento)
 * 2. Database sessions (PostgreSQL)
 * 3. Redis sessions (futuro)
 */

export interface ISessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  expiresAt: number;
  metadata?: Record<string, any>;
}

export interface ISessionAdapter {
  create(userId: string, data: Partial<ISessionData>, ttlSeconds: number): Promise<string>;
  get(sessionId: string): Promise<ISessionData | null>;
  update(sessionId: string, data: Partial<ISessionData>): Promise<void>;
  destroy(sessionId: string): Promise<void>;
  destroyAll(userId: string): Promise<void>;
}

/**
 * JWT-based Sessions (Stateless - NO storage)
 * ============================================
 * ✅ Ventajas: 
 *    - Sin latencia (no consulta DB)
 *    - Escala infinitamente
 *    - Sin estado en servidor
 * ⚠️ Desventajas:
 *    - No se puede revocar (hasta que expire)
 *    - Payload visible (aunque firmado)
 * 
 * ✅ Mejor para: Etapa 1-2 (MVP y crecimiento inicial)
 */
class JWTSessionAdapter implements ISessionAdapter {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || '';
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is required');
    }
  }

  async create(userId: string, data: Partial<ISessionData>, ttlSeconds: number): Promise<string> {
    const jwt = await import('jsonwebtoken');
    const now = Date.now();

    const payload: ISessionData = {
      userId,
      email: data.email || '',
      role: data.role || 'user',
      createdAt: now,
      expiresAt: now + (ttlSeconds * 1000),
      metadata: data.metadata || {}
    };

    return jwt.default.sign(payload, this.jwtSecret, {
      expiresIn: ttlSeconds,
      issuer: 'rural24',
      audience: 'rural24-api'
    });
  }

  async get(token: string): Promise<ISessionData | null> {
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, this.jwtSecret, {
        issuer: 'rural24',
        audience: 'rural24-api'
      }) as ISessionData;

      // Verificar expiración manual (por si acaso)
      if (decoded.expiresAt && Date.now() > decoded.expiresAt) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  async update(sessionId: string, data: Partial<ISessionData>): Promise<void> {
    // JWT es inmutable, requiere crear nuevo token
    throw new Error('JWT sessions are immutable. Create a new token instead.');
  }

  async destroy(sessionId: string): Promise<void> {
    // JWT no se puede revocar (usar blacklist en Redis si es necesario)
    console.warn('JWT sessions cannot be revoked. Consider DB sessions if revocation is needed.');
  }

  async destroyAll(userId: string): Promise<void> {
    // JWT no se puede revocar en batch
    console.warn('JWT sessions cannot be revoked. Consider DB sessions.');
  }
}

/**
 * Database Sessions (PostgreSQL)
 * ================================
 * ✅ Ventajas:
 *    - Se puede revocar instantáneamente
 *    - Auditoría completa
 *    - Ver sesiones activas por usuario
 * ⚠️ Desventajas:
 *    - 1 query por request autenticado
 *    - Más carga en DB
 * 
 * ✅ Mejor para: Apps con revocación de sesiones, multi-device
 */
class DatabaseSessionAdapter implements ISessionAdapter {
  private prisma: any;

  constructor() {
    // Lazy import para evitar dependencia circular
    this.initPrisma();
  }

  private async initPrisma() {
    const { PrismaClient } = await import('@prisma/client');
    this.prisma = new PrismaClient();
  }

  async create(userId: string, data: Partial<ISessionData>, ttlSeconds: number): Promise<string> {
    const crypto = await import('crypto');
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttlSeconds * 1000));

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        email: data.email || '',
        role: data.role || 'user',
        metadata: data.metadata || {},
        expiresAt,
        createdAt: now,
        lastActivityAt: now
      }
    });

    return sessionId;
  }

  async get(sessionId: string): Promise<ISessionData | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) return null;

    // Verificar expiración
    if (new Date() > session.expiresAt) {
      await this.destroy(sessionId);
      return null;
    }

    // Actualizar última actividad (async, no esperar)
    this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() }
    }).catch(() => {});

    return {
      userId: session.userId,
      email: session.email,
      role: session.role,
      createdAt: session.createdAt.getTime(),
      expiresAt: session.expiresAt.getTime(),
      metadata: session.metadata as Record<string, any>
    };
  }

  async update(sessionId: string, data: Partial<ISessionData>): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        email: data.email,
        role: data.role,
        metadata: data.metadata,
        lastActivityAt: new Date()
      }
    });
  }

  async destroy(sessionId: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id: sessionId }
    }).catch(() => {});
  }

  async destroyAll(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId }
    });
  }

  /**
   * Limpiar sesiones expiradas (ejecutar en cron job)
   */
  async cleanup(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    return result.count;
  }

  /**
   * Obtener sesiones activas de un usuario
   */
  async getUserSessions(userId: string): Promise<Array<{ id: string; createdAt: Date; lastActivityAt: Date }>> {
    return await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        createdAt: true,
        lastActivityAt: true
      },
      orderBy: { lastActivityAt: 'desc' }
    });
  }
}

/**
 * Redis Sessions (Futuro - Alta concurrencia)
 * ============================================
 * ✅ Ventajas:
 *    - Ultra rápido (<1ms)
 *    - Menos carga en PostgreSQL
 *    - TTL automático
 * 
 * ✅ Mejor para: Etapa 3 (+1500 usuarios concurrentes)
 */
class RedisSessionAdapter implements ISessionAdapter {
  private client: any;

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL not configured');
    }

    const { createClient } = await import('redis');
    this.client = createClient({ url: process.env.REDIS_URL });
    await this.client.connect();
  }

  async create(userId: string, data: Partial<ISessionData>, ttlSeconds: number): Promise<string> {
    const crypto = await import('crypto');
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();

    const sessionData: ISessionData = {
      userId,
      email: data.email || '',
      role: data.role || 'user',
      createdAt: now,
      expiresAt: now + (ttlSeconds * 1000),
      metadata: data.metadata || {}
    };

    const key = `session:${sessionId}`;
    const userSessionsKey = `user:${userId}:sessions`;

    // Guardar sesión con TTL
    await this.client.setEx(key, ttlSeconds, JSON.stringify(sessionData));

    // Agregar a set de sesiones del usuario
    await this.client.sAdd(userSessionsKey, sessionId);
    await this.client.expire(userSessionsKey, ttlSeconds + 3600);

    return sessionId;
  }

  async get(sessionId: string): Promise<ISessionData | null> {
    const key = `session:${sessionId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async update(sessionId: string, data: Partial<ISessionData>): Promise<void> {
    const key = `session:${sessionId}`;
    const existing = await this.get(sessionId);
    if (!existing) return;

    const updated = { ...existing, ...data };
    const ttl = await this.client.ttl(key);
    await this.client.setEx(key, ttl > 0 ? ttl : 3600, JSON.stringify(updated));
  }

  async destroy(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      await this.client.del(`session:${sessionId}`);
      await this.client.sRem(`user:${session.userId}:sessions`, sessionId);
    }
  }

  async destroyAll(userId: string): Promise<void> {
    const userSessionsKey = `user:${userId}:sessions`;
    const sessionIds = await this.client.sMembers(userSessionsKey);

    const pipeline = this.client.multi();
    for (const sessionId of sessionIds) {
      pipeline.del(`session:${sessionId}`);
    }
    pipeline.del(userSessionsKey);
    await pipeline.exec();
  }
}

/**
 * Factory para sessions según estrategia
 */
export class SessionFactory {
  private static instance: ISessionAdapter | null = null;

  static create(strategy?: 'jwt' | 'database' | 'redis'): ISessionAdapter {
    if (this.instance) return this.instance;

    // Auto-detect mejor estrategia
    if (!strategy) {
      if (process.env.REDIS_ENABLED === 'true' && process.env.REDIS_URL) {
        strategy = 'redis';
      } else if (process.env.SESSION_STRATEGY === 'database') {
        strategy = 'database';
      } else {
        strategy = 'jwt';
      }
    }

    switch (strategy) {
      case 'redis':
        console.log('🔴 Using Redis Sessions');
        this.instance = new RedisSessionAdapter();
        break;
      case 'database':
        console.log('🟢 Using Database Sessions');
        this.instance = new DatabaseSessionAdapter();
        break;
      case 'jwt':
      default:
        console.log('🟡 Using JWT Sessions (stateless)');
        this.instance = new JWTSessionAdapter();
        break;
    }

    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

// Export singleton con estrategia por defecto
export const sessions = SessionFactory.create();
