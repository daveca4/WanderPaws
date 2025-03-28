import { NextRequest, NextResponse } from 'next/server';

// Mock user subscription data for the current user
function getMockUserSubscription(userId: string) {
  // Create a subscription that's active for the next 30 days
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 30);
  
  return {
    id: `sub_${userId.substring(0, 8)}`,
    userId: userId,
    ownerId: userId,
    planId: 'plan2', // Premium plan
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    creditsRemaining: 8,
    status: 'active',
    purchaseAmount: 9995,
    purchaseDate: now.toISOString()
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/data/subscriptions - returning mock data');
    
    // Get userId from query parameter
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json([]);
    }
    
    // Return mock subscription for the user
    return NextResponse.json([getMockUserSubscription(userId)]);
  } catch (error) {
    console.error('Error in subscriptions API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
