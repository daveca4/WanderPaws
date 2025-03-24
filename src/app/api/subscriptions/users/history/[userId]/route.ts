import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface RouteParams {
  params: {
    userId: string;
  }
}

// Get subscription history for a user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get all subscriptions for this user, ordered by purchase date
    const subscriptions = await prisma.userSubscription.findMany({
      where: { userId },
      orderBy: { purchaseDate: 'desc' }
    });
    
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error(`Error fetching subscription history for user ${params.userId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription history', subscriptions: [] },
      { status: 500 }
    );
  }
} 