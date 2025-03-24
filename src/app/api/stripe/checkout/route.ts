import { NextRequest, NextResponse } from 'next/server';
import { 
  createCheckoutSession, 
  createStripeCustomer
} from '@/lib/stripeService';
import { getSubscriptionPlanById } from '@/lib/mockSubscriptions';
import { getStripeCustomer, createStripeCustomerRecord } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const data = await req.json();
    const { planId, userId, userEmail } = data;
    
    if (!planId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, userId, userEmail' },
        { status: 400 }
      );
    }
    
    // Get the subscription plan
    const plan = getSubscriptionPlanById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    
    // Check if the user already has a Stripe customer ID
    let customerId;
    const existingCustomer = await getStripeCustomer(userId);
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create a new Stripe customer
      customerId = await createStripeCustomer(userEmail, userId);
      
      // Save the customer record in the database
      await createStripeCustomerRecord(customerId, userId, userEmail);
    }
    
    // Create the checkout session
    const checkoutUrl = await createCheckoutSession(
      planId,
      userId,
      userEmail,
      customerId,
      plan
    );
    
    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 