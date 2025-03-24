import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

let prisma: PrismaClient;

if (typeof window === 'undefined') {
  // We're on the server
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    // In development, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global.prisma) {
      global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
  }
} else {
  // We're in the browser
  // Create a dummy object that throws helpful errors when accessed
  prisma = new Proxy({} as PrismaClient, {
    get() {
      throw new Error(
        'PrismaClient cannot be accessed on the client side. Please use data context or server components for database access.'
      );
    },
  });
}

// Export the prisma instance
export default prisma;

// IMPORTANT: All exports below should ONLY be used in server components or API routes

// Stripe Customer Functions
export async function getStripeCustomer(userId: string) {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called from the server side');
    }
    
    return await prisma.stripeCustomer.findUnique({
      where: {
        userId,
      },
    });
  } catch (error) {
    console.error('Error getting Stripe customer:', error);
    return null;
  }
}

export async function createStripeCustomerRecord(stripeCustomerId: string, userId: string, email: string) {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called from the server side');
    }
    
    return await prisma.stripeCustomer.create({
      data: {
        id: stripeCustomerId,
        userId,
        email,
      },
    });
  } catch (error) {
    console.error('Error creating Stripe customer record:', error);
    throw new Error(`Failed to create Stripe customer record: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Subscription Functions
export async function createSubscription(
  userId: string,
  planId: string,
  planName: string,
  walkCredits: number,
  walkDuration: number,
  validityPeriod: number,
  amount: number,
  stripePaymentId: string
) {
  try {
    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + validityPeriod);
    
    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planId,
        planName,
        walkCredits,
        walkDuration,
        creditsRemaining: walkCredits,
        startDate,
        endDate,
        status: 'active',
        purchaseAmount: amount,
        purchaseDate: startDate,
        stripePayments: {
          connect: {
            id: stripePaymentId,
          },
        },
      },
    });
    
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Payment Functions
export async function createStripePayment(
  stripePaymentId: string,
  stripeCustomerId: string | null,
  amount: number,
  status: string,
  paymentIntentId?: string,
  checkoutSessionId?: string,
  metadata?: any
) {
  try {
    return await prisma.stripePayment.create({
      data: {
        id: stripePaymentId,
        stripeCustomerId,
        amount,
        status,
        paymentIntentId,
        checkoutSessionId,
        metadata,
      },
    });
  } catch (error) {
    console.error('Error creating Stripe payment record:', error);
    throw error;
  }
}

export async function updateStripePaymentWithSubscription(
  paymentId: string, 
  subscriptionId: string
) {
  try {
    return await prisma.stripePayment.update({
      where: {
        id: paymentId,
      },
      data: {
        subscriptionId,
      },
    });
  } catch (error) {
    console.error('Error updating Stripe payment record:', error);
    throw error;
  }
}

// Only export the necessary functions that are actually used directly in API routes 