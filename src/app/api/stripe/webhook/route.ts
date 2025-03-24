import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/stripeService';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature') || '';
    
    // Process the webhook event
    const result = await handleWebhookEvent(body, signature);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    );
  }
}

// Ensure this route is configured to skip CSRF protection
export const config = {
  api: {
    bodyParser: false,
  },
}; 