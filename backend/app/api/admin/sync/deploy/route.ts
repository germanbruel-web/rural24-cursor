/**
 * POST /api/admin/sync/deploy
 * Dispara los deploy hooks de Render para PROD (frontend y/o backend).
 * Body: { targets?: ('frontend' | 'backend')[] } — vacío = ambos.
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

type Target = 'frontend' | 'backend';

export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    const frontendHook = process.env.RENDER_DEPLOY_HOOK_PROD_FRONTEND;
    const backendHook  = process.env.RENDER_DEPLOY_HOOK_PROD_BACKEND;

    const body = await request.json().catch(() => ({}));
    const requested: Target[] = Array.isArray(body.targets) ? body.targets : ['frontend', 'backend'];

    const hooks: { target: Target; url: string }[] = [];
    if (requested.includes('frontend') && frontendHook) hooks.push({ target: 'frontend', url: frontendHook });
    if (requested.includes('backend')  && backendHook)  hooks.push({ target: 'backend',  url: backendHook });

    if (hooks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay RENDER_DEPLOY_HOOK_PROD_* configurados o targets inválidos' },
        { status: 503 }
      );
    }

    const results = await Promise.all(
      hooks.map(async ({ target, url }) => {
        try {
          const res = await fetch(url, { method: 'POST' });
          const ok = res.status >= 200 && res.status < 300;
          logger.log(`[sync/deploy] ${target}: HTTP ${res.status}`);
          return { target, ok, status: res.status };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.error(`[sync/deploy] Error ${target}:`, msg);
          return { target, ok: false, error: msg };
        }
      })
    );

    const allOk = results.every(r => r.ok);
    return NextResponse.json({ success: allOk, results });

  }, { roles: ['superadmin'] });
}
