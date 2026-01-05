import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Permitir acceso a /admin y /api/admin/verify sin bloqueo
  // El dashboard y el endpoint de verificación manejan su propia autenticación
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
