import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(req: NextRequest) {
  try {
    // Log the environment variables (don't include full secret key)
    console.log('ENV VARS CHECK:');
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 10));
    console.log('STRIPE_WEBHOOK_SECRET exists:', !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
    });
    
    // Test Stripe connection
    const balance = await stripe.balance.retrieve();
    
    return NextResponse.json({
      status: 'success',
      message: 'Stripe connection successful',
      stripeConnected: true,
      balance: balance.available
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Stripe connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stripeConnected: false
    }, { status: 500 });
  }
} 