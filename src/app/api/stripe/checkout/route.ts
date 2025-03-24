import { NextRequest, NextResponse } from 'next/server';
import { 
  createCheckoutSession, 
  createStripeCustomer
} from '@/lib/stripeService';
import { getSubscriptionPlanById } from '@/lib/mockSubscriptions';
import { getCurrentUser } from '@/lib/auth';
import { getStripeCustomer, createStripeCustomerRecord } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { planId } = await req.json();
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    const existingCustomer = await getStripeCustomer(user.id);
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create a new Stripe customer
      customerId = await createStripeCustomer(user.email, user.id);
      
      // Save the customer record in the database
      await createStripeCustomerRecord(customerId, user.id, user.email);
    }
    
    // Create the checkout session
    const checkoutUrl = await createCheckoutSession(
      planId,
      user.id,
      user.email,
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