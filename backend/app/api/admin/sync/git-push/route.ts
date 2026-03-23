/**
 * POST /api/admin/sync/git-push
 * Crea un PR de main → prod en GitHub y opcionalmente lo mergea.
 * Body: { merge?: boolean } — si merge=true, auto-mergea con squash.
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const REPO = 'germanbruel-web/rural24-cursor';
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
    const body = await request.json().catch(() => ({}));
    const shouldMerge: boolean = body.merge === true;

    try {
      // 1. Buscar PR abierto existente main→prod
      const prs = await ghFetch(
        `/repos/${REPO}/pulls?base=prod&head=main&state=open`
      ) as Array<{ number: number; html_url: string; title: string }>;

      let prNumber: number;
      let prUrl: string;

      if (prs.length > 0) {
        // Ya existe — reusar
        prNumber = prs[0].number;
        prUrl    = prs[0].html_url;
        logger.log(`[sync/git-push] PR existente: #${prNumber}`);
      } else {
        // Crear nuevo PR
        const today = new Date().toISOString().slice(0, 10);
        const pr = await ghFetch(`/repos/${REPO}/pulls`, {
          method: 'POST',
          body: JSON.stringify({
            title: `chore: sync main → prod [${today}]`,
            body: `Deploy automático desde el panel Sync DEV→PROD.\n\nGenerado: ${new Date().toISOString()}`,
            head: 'main',
            base: 'prod',
          }),
        }) as { number: number; html_url: string };

        prNumber = pr.number;
        prUrl    = pr.html_url;
        logger.log(`[sync/git-push] PR creado: #${prNumber} ${prUrl}`);
      }

      if (!shouldMerge) {
        return NextResponse.json({ success: true, pr: { number: prNumber, url: prUrl }, merged: false });
      }

      // 2. Mergear (squash)
      await ghFetch(`/repos/${REPO}/pulls/${prNumber}/merge`, {
        method: 'PUT',
        body: JSON.stringify({
          merge_method: 'squash',
          commit_title: `chore: sync main → prod [${new Date().toISOString().slice(0, 10)}]`,
        }),
      });

      logger.log(`[sync/git-push] PR #${prNumber} mergeado`);
      return NextResponse.json({ success: true, pr: { number: prNumber, url: prUrl }, merged: true });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      logger.error('[sync/git-push] Error:', err);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { roles: ['superadmin'] });
}
