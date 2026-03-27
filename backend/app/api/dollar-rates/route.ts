/**
 * GET /api/dollar-rates
 * Proxy BFF para cotizaciones del dólar (dolarapi.com).
 * Cachea en memoria 30 minutos para reducir requests externos.
 */

import { NextResponse } from 'next/server';

interface DolarRate {
  oficial: number;
  blue: number;
  updatedAt: string;
}

// Cache en memoria del servidor — 30 min TTL
let cache: { data: DolarRate; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function GET() {
  // Servir desde caché si está vigente
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data);
  }

  try {
    const [oficialRes, blueRes] = await Promise.all([
      fetch('https://dolarapi.com/v1/dolares/oficial', { next: { revalidate: 0 } }),
      fetch('https://dolarapi.com/v1/dolares/blue',    { next: { revalidate: 0 } }),
    ]);

    if (!oficialRes.ok || !blueRes.ok) {
      throw new Error('dolarapi upstream error');
    }

    const [oficial, blue] = await Promise.all([oficialRes.json(), blueRes.json()]);

    const data: DolarRate = {
      oficial:   Math.round(oficial.venta || 0),
      blue:      Math.round(blue.venta    || 0),
      updatedAt: new Date().toISOString(),
    };

    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };

    return NextResponse.json(data);
  } catch {
    // Si falla y hay caché expirado, devolver el último conocido
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ oficial: 0, blue: 0, updatedAt: null }, { status: 503 });
  }
}
