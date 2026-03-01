/**
 * API Route - /api/admin/cms/public-assets
 * Lista los assets de frontend/public organizados por categoría
 *
 * Runtime: Node.js (requiere fs)
 * Seguridad: Bearer token (superadmin)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import fs from 'fs';
import path from 'path';

const FRONTEND_PUBLIC = path.join(process.cwd(), '..', 'frontend', 'public');

const CATEGORIES = [
  { id: 'logos',   label: 'Logos',          dir: 'images/logos' },
  { id: 'icons',   label: 'Íconos UI',       dir: 'images/icons' },
  { id: 'hero',    label: 'Hero',            dir: 'images/hero' },
  { id: 'pwa-android', label: 'PWA Android', dir: 'images/AppImages/android' },
  { id: 'pwa-ios',     label: 'PWA iOS',     dir: 'images/AppImages/ios' },
  { id: 'pwa-win',     label: 'PWA Windows', dir: 'images/AppImages/windows11' },
  { id: 'root',    label: 'Raíz / Otros',   dir: '.' },
] as const;

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'ico', 'avif']);

interface AssetFile {
  name: string;
  path: string;
  size: number;
  ext: string;
}

function scanDir(relDir: string): AssetFile[] {
  const absDir = path.join(FRONTEND_PUBLIC, relDir);
  if (!fs.existsSync(absDir)) return [];

  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  const files: AssetFile[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).slice(1).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;

    const fullPath = path.join(absDir, entry.name);
    const stat = fs.statSync(fullPath);
    const relPath = (relDir === '.' ? entry.name : `${relDir}/${entry.name}`);

    files.push({
      name: entry.name,
      path: relPath,
      size: stat.size,
      ext,
    });
  }

  // Ordenar: primero por nombre
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>();

  if (!profile || !['superadmin', 'super-admin'].includes(profile.role)) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryFilter = searchParams.get('category') ?? 'all';

  const categoriesToScan = categoryFilter === 'all'
    ? CATEGORIES
    : CATEGORIES.filter(c => c.id === categoryFilter);

  const result = categoriesToScan.map(cat => ({
    id: cat.id,
    label: cat.label,
    dir: cat.dir,
    files: scanDir(cat.dir),
  }));

  const totalFiles = result.reduce((acc, c) => acc + c.files.length, 0);

  return NextResponse.json({
    categories: result,
    total: totalFiles,
    frontendPublicExists: fs.existsSync(FRONTEND_PUBLIC),
  });
}
