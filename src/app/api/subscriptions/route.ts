import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get all subscription plans
export async function GET() {
  try {
    // Fetch subscription plans from database
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
    
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

// Create an endpoint for fetching user subscriptions
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch user's subscriptions
    const subscriptions = await prisma.userSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user subscriptions' },
      { status: 500 }
    );
  }
} 