/**
 * API Route - /api/featured-ads/cron/route.ts
 * Endpoint CRON para activar avisos destacados pendientes de usuarios
 * 
 * Este endpoint debe ser llamado periódicamente (cada hora o diariamente)
 * para activar los destacados cuya fecha de inicio llegó.
 * 
 * Protección: Requiere header X-Cron-Secret o ser llamado por Supabase Edge Function
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

const supabase = getSupabaseClient();

// Secret para proteger el endpoint (DEBE estar configurado en env)
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.warn('⚠️ CRON_SECRET no configurado en variables de entorno');
}

/**
 * GET /api/featured-ads/cron
 * Ejecuta la activación de destacados pendientes
 * 
 * Headers requeridos:
 *   - X-Cron-Secret: Token de autenticación
 * 
 * Returns:
 *   - activated: Cantidad de destacados activados
 *   - expired: Cantidad de destacados expirados
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const cronSecret = request.headers.get('X-Cron-Secret');
    
    // Permitir acceso si:
    // 1. Tiene el X-Cron-Secret correcto (requerido en producción)
    // 2. Es localhost (solo desarrollo)
    const isLocalhost = request.headers.get('host')?.includes('localhost');
    const hasValidSecret = CRON_SECRET && cronSecret === CRON_SECRET;
    
    if (!isLocalhost && !hasValidSecret) {
      console.warn('⚠️ CRON unauthorized access attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 [CRON] Ejecutando activación de destacados...');

    // Llamar a la función RPC que activa pendientes y expira vencidos
    const { data, error } = await supabase.rpc('activate_pending_featured_ads');

    if (error) {
      console.error('❌ [CRON] Error en activate_pending_featured_ads:', error);
      throw error;
    }

    const activatedCount = data || 0;
    console.log(`✅ [CRON] Destacados activados: ${activatedCount}`);

    // También contar cuántos expiraron (ya lo hace la función, pero logueamos)
    const { count: expiredCount } = await supabase
      .from('featured_ads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired')
      .gte('updated_at', new Date(Date.now() - 60000).toISOString()); // Último minuto

    return NextResponse.json({
      success: true,
      message: 'CRON ejecutado correctamente',
      activated: activatedCount,
      expired: expiredCount || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [CRON] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error en CRON',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/featured-ads/cron
 * Alias para compatibilidad con diferentes schedulers
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
