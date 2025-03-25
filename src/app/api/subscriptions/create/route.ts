import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, paymentMethodId } = await request.json();
    
    if (!userId || !planId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    
    // Get or create Stripe customer
    let stripeCustomer = await prisma.stripeCustomer.findUnique({
      where: { userId }
    });
    
    if (!stripeCustomer) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      stripeCustomer = await prisma.stripeCustomer.create({
        data: {
          id: customer.id,
          userId,
          email: user.email
        }
      });
    }
    
    // Create Stripe payment
    const payment = await stripe.paymentIntents.create({
      amount: plan.price,
      currency: 'gbp',
      customer: stripeCustomer.id,
      payment_method: paymentMethodId,
      confirm: true
    });
    
    // Create payment record
    const stripePayment = await prisma.stripePayment.create({
      data: {
        id: payment.id,
        stripeCustomerId: stripeCustomer.id,
        amount: plan.price,
        status: payment.status,
        paymentIntentId: payment.id,
        metadata: {
          paymentIntent: payment.id,
          customer: stripeCustomer.id,
          amount: plan.price,
          currency: 'gbp'
        }
      }
    });
    
    // Create subscription
    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        planName: plan.name,
        walkCredits: plan.walkCredits,
        walkDuration: plan.walkDuration,
        creditsRemaining: plan.walkCredits,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active',
        purchaseAmount: plan.price,
        purchaseDate: new Date(),
        stripePayments: {
          connect: {
            id: stripePayment.id
          }
        }
      }
    });
    
    return NextResponse.json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
} 