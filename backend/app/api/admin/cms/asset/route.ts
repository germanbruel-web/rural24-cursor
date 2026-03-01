/**
 * API Route - /api/admin/cms/asset?path=images/icons/busca.png
 * Proxy que sirve archivos de frontend/public con auth de admin
 *
 * Runtime: Node.js (requiere fs)
 * Seguridad: Bearer token (superadmin) + validación path traversal
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import fs from 'fs';
import path from 'path';

const FRONTEND_PUBLIC = path.resolve(path.join(process.cwd(), '..', 'frontend', 'public'));

const MIME_MAP: Record<string, string> = {
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg:  'image/svg+xml',
  gif:  'image/gif',
  ico:  'image/x-icon',
  avif: 'image/avif',
};

async function verifyAdmin(request: NextRequest) {
  // Soportar token en header o en query param (para <img src="...?token=xxx">)
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');

  const token = authHeader?.replace('Bearer ', '') ?? queryToken;
  if (!token) return false;

  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>();

  return profile && ['superadmin', 'super-admin'].includes(profile.role);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get('path');

  if (!rawPath) {
    return NextResponse.json({ error: 'Parámetro path requerido' }, { status: 400 });
  }

  // Validar path traversal
  const normalized = path.normalize(rawPath).replace(/\\/g, '/');
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    return NextResponse.json({ error: 'Path inválido' }, { status: 400 });
  }

  const absolutePath = path.resolve(path.join(FRONTEND_PUBLIC, normalized));
  if (!absolutePath.startsWith(FRONTEND_PUBLIC)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  const ext = path.extname(absolutePath).slice(1).toLowerCase();
  const contentType = MIME_MAP[ext] ?? 'application/octet-stream';

  const buffer = fs.readFileSync(absolutePath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
      'Content-Length': String(buffer.length),
    },
  });
}
