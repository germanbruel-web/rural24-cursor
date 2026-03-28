/**
 * POST /api/admin/sync/git-push
 * Sincroniza prod con main actualizando el ref directamente (force-update).
 * Reemplaza el flujo PR+squash que causaba divergencia de ramas.
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const REPO   = 'germanbruel-web/rural24-cursor';
const GH_API = 'https://api.github.com';

async function ghFetch(path: string, options: RequestInit = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN no configurado');

  const res = await fetch(`${GH_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { message?: string }).message ?? `HTTP ${res.status}`;
    throw new Error(`GitHub API error: ${msg}`);
  }
  return json;
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    // Ignorado pero mantenido por compatibilidad con el frontend del Sync Panel
    await request.json().catch(() => ({}));

    try {
      // 1. Obtener SHA actual de main y prod
      const [mainRef, prodRef] = await Promise.all([
        ghFetch(`/repos/${REPO}/git/ref/heads/main`) as Promise<{ object: { sha: string } }>,
        ghFetch(`/repos/${REPO}/git/ref/heads/prod`) as Promise<{ object: { sha: string } }>,
      ]);

      const mainSha = mainRef.object.sha;
      const prodSha = prodRef.object.sha;

      if (mainSha === prodSha) {
        return NextResponse.json({
          success: true,
          alreadyInSync: true,
          message: 'main y prod ya están sincronizados — nada que deployar',
          merged: false,
        });
      }

      // 2. Force-update prod → main SHA (equivalente a git push origin main:prod --force)
      await ghFetch(`/repos/${REPO}/git/refs/heads/prod`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: mainSha, force: true }),
      });

      logger.log(`[sync/git-push] prod actualizado: ${prodSha.slice(0, 7)} → ${mainSha.slice(0, 7)}`);

      return NextResponse.json({
        success: true,
        merged: true,
        sha: mainSha,
        message: `prod sincronizado con main (${mainSha.slice(0, 7)})`,
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      logger.error('[sync/git-push] Error:', err);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { roles: ['superadmin'] });
}
