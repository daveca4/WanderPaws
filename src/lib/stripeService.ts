import Stripe from 'stripe';
import { SubscriptionPlan, UserSubscription } from './types';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export interface StripeCustomer {
  id: string;        // Stripe customer ID
  userId: string;    // WanderPaws user ID
  email: string;     // Customer email
  createdAt: Date;   // Date when the customer was created
}

// Create a Stripe customer for a user
export async function createStripeCustomer(email: string, userId: string): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });
    
    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create customer');
  }
}

// Create a checkout session for subscription purchase
export async function createCheckoutSession(
  planId: string,
  userId: string,
  customerEmail: string,
  customerId: string,
  plan: SubscriptionPlan
): Promise<string> {
  try {
    // Create a product for the subscription plan if it doesn't exist
    // In a production app, you'd likely create products through the Stripe dashboard or API
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        planId,
      },
    });
    
    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price,
      currency: 'gbp',
    });
    
    // Create a checkout session
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/owner-dashboard/subscriptions?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/owner-dashboard/subscriptions?canceled=true`,
      metadata: {
        userId,
        planId,
        walkCredits: plan.walkCredits.toString(),
        walkDuration: plan.walkDuration.toString(),
        validityPeriod: plan.validityPeriod.toString(),
      },
    });
    
    return session.url || '';
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Retrieve a checkout session
export async function retrieveCheckoutSession(sessionId: string) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw new Error('Failed to retrieve checkout session');
  }
}

// Handle webhook events
export async function handleWebhookEvent(body: string, signature: string) {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed':
        // Process successful checkout
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulCheckout(session);
        break;
      case 'payment_intent.succeeded':
        // Handle successful payment if needed
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment if needed
        break;
      // Add more event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    return { received: true };
  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw new Error('Webhook error');
  }
}

// Process a successful checkout to create a subscription
async function handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
  if (!session.metadata) {
    console.error('No metadata in the session');
    return;
  }
  
  const { userId, planId, walkCredits, walkDuration, validityPeriod } = session.metadata;
  
  if (!userId || !planId) {
    console.error('Missing required metadata');
    return;
  }
  
  try {
    // Import database functions
    const {
      createStripePayment,
      createSubscription,
      updateStripePaymentWithSubscription
    } = await import('./db');
  
    // Create payment record
    const paymentId = `payment_${session.id}`;
    await createStripePayment(
      paymentId,
      session.customer as string,
      session.amount_total as number,
      'succeeded',
      session.payment_intent as string | undefined,
      session.id,
      session.metadata
    );
    
    // Create subscription record
    const subscription = await createSubscription(
      userId,
      planId,
      session.metadata.planName || 'Subscription Plan',
      parseInt(walkCredits, 10),
      parseInt(walkDuration, 10),
      parseInt(validityPeriod, 10),
      session.amount_total as number,
      paymentId
    );
    
    // Update payment with subscription ID
    await updateStripePaymentWithSubscription(paymentId, subscription.id);
    
    console.log('Successfully processed payment and created subscription');
  } catch (error) {
    console.error('Error handling successful checkout:', error);
  }
} 