import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    console.log('[Health Check] Testing database connection...');
    
    // Simple query that should work with service_role bypassing RLS
    const { data, error, status, statusText } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .single();
    
    console.log('[Health Check] Response status:', status);
    console.log('[Health Check] Response statusText:', statusText);
    console.log('[Health Check] Data:', data);
    console.log('[Health Check] Error:', error);
    
    // If no error, connection is good
    if (!error) {
      console.log('[Health Check] ✅ Database connected successfully');
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Check if it's "no rows returned" (which means connection is OK, just empty table)
    if (error.code === 'PGRST116') {
      console.log('[Health Check] ✅ Database connected (table empty)');
      return NextResponse.json({
        status: 'healthy',
        database: 'connected (empty table)',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Real error
    console.error('[Health Check] ❌ Database error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'error',
      error: error.message || 'Database query failed',
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
    
  } catch (error) {
    console.error('[Health Check] ❌ Unexpected error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      database: 'error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

