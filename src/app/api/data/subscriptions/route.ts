import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query parameters or headers
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || request.headers.get('user-id') || '';
    const userProfileId = request.headers.get('user-profile-id') || '';
    
    console.log('GET /api/data/subscriptions - fetching real data');
    console.log('User identifiers:', { userId, userProfileId });
    
    if (!userId && !userProfileId) {
      console.error('No user ID or profile ID provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Query the database for real subscription data
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        OR: [
          { userId: userId },
          { userId: userProfileId }
        ]
      }
    });
    
    console.log(`Found ${subscriptions.length} subscriptions for user ${userId}`);
    
    // Transform data to match expected format
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      userId: sub.userId,
      planId: sub.planId,
      planName: sub.planName,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      creditsRemaining: sub.creditsRemaining,
      walkCredits: sub.walkCredits,
      walkDuration: sub.walkDuration,
      purchaseAmount: sub.purchaseAmount,
      purchaseDate: sub.purchaseDate,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }));
    
    // Return real subscription data
    return NextResponse.json(formattedSubscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}

