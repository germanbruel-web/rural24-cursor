/**
 * Auth Guard - Middleware centralizado de autenticación y autorización
 * Rural24 Backend
 * 
 * USO:
 *   import { withAuth, withOptionalAuth, type AuthUser } from '@/infrastructure/auth/guard';
 * 
 *   // Requiere autenticación
 *   export async function POST(request: NextRequest) {
 *     return withAuth(request, async (user) => {
 *       // user.id, user.email, user.role están disponibles
 *       return NextResponse.json({ ok: true });
 *     });
 *   }
 * 
 *   // Requiere rol superadmin
 *   export async function DELETE(request: NextRequest) {
 *     return withAuth(request, async (user) => {
 *       return NextResponse.json({ ok: true });
 *     }, { roles: ['superadmin'] });
 *   }
 * 
 *   // Auth opcional (para GET que muestra más datos si autenticado)
 *   export async function GET(request: NextRequest) {
 *     return withOptionalAuth(request, async (user) => {
 *       // user puede ser null
 *       return NextResponse.json({ ok: true });
 *     });
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

// ============================================================
// TYPES
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
}

export interface AuthOptions {
  /** Roles permitidos. Si se omite, cualquier usuario autenticado pasa. */
  roles?: string[];
}

type AuthenticatedHandler = (user: AuthUser) => Promise<NextResponse>;
type OptionalAuthHandler = (user: AuthUser | null) => Promise<NextResponse>;

// ============================================================
// INTERNAL: Extraer y verificar usuario del token Bearer
// ============================================================

async function extractUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    const supabase = getSupabaseClient();

    // Verificar token con Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return null;
    }

    // Obtener perfil del usuario con su rol
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', user.id)
      .single<{ id: string; email: string; role: string; full_name: string | null }>();

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      role: normalizeRole(profile.role),
      full_name: profile.full_name,
    };
  } catch (error) {
    // Network errors, Supabase downtime, etc. — fail closed (no auth)
    console.error('[auth-guard] Error extracting user:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Normaliza variantes de rol: 'super-admin' → 'superadmin'
 */
function normalizeRole(role: string): string {
  if (role === 'super-admin') return 'superadmin';
  return role;
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Requiere autenticación. Responde 401/403 automáticamente si falla.
 */
export async function withAuth(
  request: NextRequest,
  handler: AuthenticatedHandler,
  options?: AuthOptions
): Promise<NextResponse> {
  const user = await extractUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado. Se requiere token Bearer válido.' },
      { status: 401 }
    );
  }

  // Verificar roles si se especificaron
  if (options?.roles && options.roles.length > 0) {
    const allowed = options.roles.map(normalizeRole);
    if (!allowed.includes(user.role)) {
      return NextResponse.json(
        { error: 'No autorizado. Permisos insuficientes.' },
        { status: 403 }
      );
    }
  }

  return handler(user);
}

/**
 * Auth opcional. Extrae usuario si hay token, pero no bloquea si no hay.
 */
export async function withOptionalAuth(
  request: NextRequest,
  handler: OptionalAuthHandler
): Promise<NextResponse> {
  const user = await extractUser(request);
  return handler(user);
}

/**
 * Verificación rápida de superadmin. Retorna el usuario o null.
 * Útil para rutas que necesitan el objeto usuario antes de decidir la respuesta.
 */
export async function verifySuperAdmin(request: NextRequest): Promise<AuthUser | null> {
  const user = await extractUser(request);
  if (!user || user.role !== 'superadmin') return null;
  return user;
}
