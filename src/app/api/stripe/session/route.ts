import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export async function GET(request: NextRequest) {
  try {
    // Extract session ID from query parameters
    const sessionId = request.nextUrl.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }
    
    // Fetch the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent', 'line_items']
    });
    
    // Check the database for any subscriptions created from this session
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Look for subscriptions with metadata matching this session ID
    const userSubscriptions = await prisma.userSubscription.findMany({
      where: {
        // Use $contains operator to search in JSON fields
        OR: [
          {
            id: {
              contains: sessionId
            }
          },
          {
            userId: session.metadata?.userId
          }
        ]
      }
    });
    
    // Return both the Stripe session and any related subscriptions
    return NextResponse.json({
      session,
      userSubscriptions,
      timestamp: new Date().toISOString(),
      sessionMetadata: session.metadata,
      // Add more detailed customer debugging information
      customerInfo: {
        rawValue: session.customer,
        type: typeof session.customer,
        id: typeof session.customer === 'string' 
          ? session.customer 
          : session.customer?.id || null,
        objectKeys: typeof session.customer === 'object' && session.customer 
          ? Object.keys(session.customer) 
          : []
      },
      // Add any other useful debugging information
      paymentStatus: session.payment_status,
      customer: session.customer,
      paymentIntent: session.payment_intent,
    });
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 