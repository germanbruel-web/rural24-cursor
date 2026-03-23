/**
 * POST /api/admin/sync/local-push
 * Ejecuta `git push origin main` desde el repo local.
 * Solo tiene sentido cuando el BFF corre en localhost.
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const REPO_ROOT = path.resolve(process.cwd(), '..');

export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    try {
      const output = execSync('git push origin main', {
        cwd: REPO_ROOT,
        timeout: 30_000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      logger.log('[sync/local-push] git push origin main ok:', output);
      return NextResponse.json({ success: true, output: output.trim() });

    } catch (err: unknown) {
      // execSync lanza si el exit code != 0; stderr está en err.stderr
      const stderr = (err as { stderr?: string }).stderr ?? '';
      const stdout = (err as { stdout?: string }).stdout ?? '';
      const message = stderr || stdout || (err instanceof Error ? err.message : 'Error desconocido');
      logger.error('[sync/local-push] Error:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { roles: ['superadmin'] });
}
