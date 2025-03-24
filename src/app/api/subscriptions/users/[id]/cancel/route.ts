import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  }
}

// Cancel a subscription
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }
    
    // First, check if the subscription exists
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: { id }
    });
    
    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    // Cancel the subscription (update status to 'cancelled')
    const subscription = await prisma.userSubscription.update({
      where: { id },
      data: {
        status: 'cancelled',
        endDate: new Date() // Immediately end the subscription
      }
    });
    
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error(`Error cancelling subscription ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 