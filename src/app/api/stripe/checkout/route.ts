import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSubscriptionPlanById } from '@/lib/mockSubscriptions';
import { getStripeCustomer, createStripeCustomerRecord } from '@/lib/db';

// Initialize Stripe directly in the API route
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export async function POST(req: NextRequest) {
  try {
    // Log that we're inside the API route
    console.log('Stripe checkout API called');
    
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
      console.log('Creating a new Stripe customer');
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        },
      });
      
      customerId = customer.id;
      
      // Save the customer record in the database
      await createStripeCustomerRecord(customerId, userId, userEmail);
    }
    
    // Create a product for the subscription plan
    console.log('Creating Stripe product');
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        planId,
      },
    });
    
    // Create a price for the product
    console.log('Creating Stripe price');
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price,
      currency: 'gbp',
    });
    
    // Determine the base URL for success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Create a checkout session
    console.log('Creating checkout session');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/owner-dashboard/subscriptions?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/owner-dashboard/subscriptions?canceled=true`,
      metadata: {
        userId,
        planId,
        planName: plan.name,
        walkCredits: plan.walkCredits.toString(),
        walkDuration: plan.walkDuration.toString(),
        validityPeriod: plan.validityPeriod.toString(),
      },
    });
    
    console.log('Checkout session created with ID:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 