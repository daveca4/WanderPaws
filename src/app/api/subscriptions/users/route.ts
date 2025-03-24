import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get all user subscriptions, optionally filtered by userId
export async function GET(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get('userId');
    
    const whereClause = userId ? { userId } : {};
    
    const subscriptions = await prisma.userSubscription.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user subscriptions', subscriptions: [] },
      { status: 500 }
    );
  }
}

// Create a new user subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, userId, ownerId } = body;
    
    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Plan ID and User ID are required' },
        { status: 400 }
      );
    }
    
    // Find the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    
    // Calculate end date (30 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Create the subscription
    const subscription = await prisma.userSubscription.create({
      data: {
        planId,
        userId,
        ownerId: ownerId || userId,
        status: 'active',
        purchaseDate: new Date(),
        endDate,
        purchaseAmount: plan.price,
        totalCredits: plan.walkCredits,
        creditsRemaining: plan.walkCredits
      }
    });
    
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error creating user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create user subscription' },
      { status: 500 }
    );
  }
} 