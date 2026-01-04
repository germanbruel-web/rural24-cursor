import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      anonKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      serviceKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
}
