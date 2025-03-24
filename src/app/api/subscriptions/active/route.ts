import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    
    // Fetch all active subscriptions
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        status: 'active',
        endDate: {
          gt: now,
        },
        creditsRemaining: {
          gt: 0,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active subscriptions', subscriptions: [] },
      { status: 500 }
    );
  }
} 