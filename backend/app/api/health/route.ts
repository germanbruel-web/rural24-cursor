import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { logger } from '@/infrastructure/logger';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error, status } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .single();
    
    if (!error) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    }
    
    // "no rows returned" means connection is OK, just empty table
    if (error.code === 'PGRST116') {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected (empty table)',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Real error
    logger.error('[Health] Database error:', { message: error.message, code: error.code });
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'error',
      error: error.message || 'Database query failed',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
    
  } catch (error) {
    logger.error('[Health] Unexpected error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      database: 'error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

