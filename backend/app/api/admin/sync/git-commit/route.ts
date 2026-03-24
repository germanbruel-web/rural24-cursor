/**
 * POST /api/admin/sync/git-commit
 * Hace git add -A && git commit con el mensaje recibido.
 * Solo superadmin, solo en entorno local (NODE_ENV !== 'production').
 */

import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/infrastructure/logger';

const REPO_ROOT = path.resolve(process.cwd(), '..');

export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'No disponible en producción' },
        { status: 403 }
      );
    }

    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El mensaje de commit es requerido' },
        { status: 400 }
      );
    }

    try {
      execSync('git add -A', { cwd: REPO_ROOT, timeout: 10_000 });

      const output = execSync(
        `git commit -m ${JSON.stringify(message.trim())}`,
        { cwd: REPO_ROOT, timeout: 10_000 }
      ).toString().trim();

      logger.info(`[git-commit] ${output}`);

      return NextResponse.json({ success: true, output });
    } catch (err: any) {
      const stderr = err.stderr?.toString() || err.message || 'Error desconocido';
      logger.error('[git-commit] Error:', stderr);
      return NextResponse.json({ success: false, error: stderr }, { status: 500 });
    }
  }, { roles: ['superadmin'] });
}
