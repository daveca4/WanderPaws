import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/stripeService';
import { headers } from 'next/headers';

// Ensure this route is configured to skip body parsing
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 Stripe webhook received');
    
    // Check for webhook secret
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    const body = await req.text();
    const signature = headers().get('stripe-signature') || '';
    
    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }
    
    console.log('🔄 Processing webhook with signature:', signature.substring(0, 10) + '...');
    
    // Process the webhook event
    try {
      const result = await handleWebhookEvent(body, signature);
      console.log('✅ Webhook processed successfully:', result);
      return NextResponse.json(result);
    } catch (error) {
      console.error('❌ Error processing webhook event:', error);
      return NextResponse.json(
        { 
          error: 'Webhook processing error',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
} 