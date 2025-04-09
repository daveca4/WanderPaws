import { NextRequest, NextResponse } from 'next/server';

// This route is disabled in production
export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Route not available in production' }, { status: 404 });
  }
  
  return NextResponse.json({ message: 'Stripe test endpoint is disabled in production' });
}

export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Route not available in production' }, { status: 404 });
  }
  
  return NextResponse.json({ message: 'Stripe test endpoint is disabled in production' });
} 