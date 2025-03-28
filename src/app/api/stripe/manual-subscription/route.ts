import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }
    
    console.log('🔄 Manually processing checkout session:', sessionId);
    
    // Fetch the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent', 'line_items']
    });
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed for this session' },
        { status: 400 }
      );
    }
    
    // Import the handler from stripeService
    const { handleSuccessfulCheckout } = await import('@/lib/stripeService');
    
    // Check if a subscription already exists for this session
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const existingSubscription = await prisma.userSubscription.findFirst({
      where: {
        stripePayments: {
          some: {
            checkoutSessionId: sessionId
          }
        }
      }
    });
    
    if (existingSubscription) {
      console.log('✅ Subscription already exists for this session:', existingSubscription.id);
      return NextResponse.json({ 
        message: 'Subscription already exists',
        subscription: existingSubscription
      });
    }
    
    // Process the checkout session manually
    console.log('📋 Processing session manually:', session.id);
    try {
      const subscription = await handleSuccessfulCheckout(session);
      
      if (!subscription) {
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        message: 'Subscription created successfully',
        subscription
      });
    } catch (error) {
      console.error('❌ Error in manual subscription creation:', error);
      
      // Return a more detailed error message
      return NextResponse.json(
        { 
          error: 'Failed to create subscription',
          details: error instanceof Error ? error.message : 'Unknown error',
          sessionInfo: {
            id: session.id,
            customerType: typeof session.customer,
            paymentStatus: session.payment_status,
            amount: session.amount_total
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error manually processing session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process session', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 