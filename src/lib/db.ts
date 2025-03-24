import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Stripe Customer Functions
export async function getStripeCustomer(userId: string) {
  try {
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
    return await prisma.stripeCustomer.create({
      data: {
        id: stripeCustomerId,
        userId,
        email,
      },
    });
  } catch (error) {
    console.error('Error creating Stripe customer record:', error);
    throw error;
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

export default prisma; 