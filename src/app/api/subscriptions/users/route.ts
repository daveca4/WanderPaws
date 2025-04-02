import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get all user subscriptions, optionally filtered by userId
export async function GET(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get('userId');
    console.log('GET /api/subscriptions/users:', { userId });
    
    const whereClause = userId ? { userId } : {};
    
    // Fetch subscriptions
    const subscriptions = await prisma.userSubscription.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Found subscriptions:', {
      count: subscriptions.length,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        status: sub.status,
        endDate: sub.endDate,
        creditsRemaining: sub.creditsRemaining
      }))
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
    const { planId, userId } = body;
    
    console.log('POST /api/subscriptions/users - Creating subscription:', { planId, userId });
    
    // Validate required fields
    if (!planId || !userId) {
      const error = 'Plan ID and User ID are required';
      console.warn('Validation error:', error, { planId, userId });
      return NextResponse.json({ error }, { status: 400 });
    }
    
    // Verify user exists and is an owner
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { owner: true }
    });
    
    if (!user) {
      const error = 'User not found';
      console.warn('User validation error:', error, { userId });
      return NextResponse.json({ error }, { status: 404 });
    }
    
    if (user.role !== 'owner') {
      const error = 'User must be an owner to create a subscription';
      console.warn('Role validation error:', error, { userId, role: user.role });
      return NextResponse.json({ error }, { status: 400 });
    }
    
    if (!user.owner) {
      const error = 'User does not have an owner profile';
      console.warn('Owner profile error:', error, { userId });
      return NextResponse.json({ error }, { status: 400 });
    }
    
    // Find the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });
    
    if (!plan) {
      const error = 'Subscription plan not found';
      console.warn('Plan validation error:', error, { planId });
      return NextResponse.json({ error }, { status: 404 });
    }
    
    console.log('Found subscription plan:', {
      id: plan.id,
      name: plan.name,
      walkCredits: plan.walkCredits,
      walkDuration: plan.walkDuration
    });
    
    // Calculate end date (30 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Create the subscription
    const subscription = await prisma.userSubscription.create({
      data: {
        planId,
        userId,
        status: 'active',
        purchaseDate: new Date(),
        endDate,
        purchaseAmount: plan.price,
        walkCredits: plan.walkCredits,
        creditsRemaining: plan.walkCredits,
        walkDuration: plan.walkDuration,
        planName: plan.name
      }
    });
    
    console.log('Successfully created subscription:', {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.planId,
      planName: subscription.planName,
      status: subscription.status,
      endDate: subscription.endDate,
      creditsRemaining: subscription.creditsRemaining
    });
    
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error creating user subscription:', error);
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint failed')) {
        return NextResponse.json(
          { error: 'Invalid user ID or plan ID provided' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'User already has an active subscription' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create user subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 