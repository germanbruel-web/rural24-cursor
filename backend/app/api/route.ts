import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Rural24 Backend API v1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
