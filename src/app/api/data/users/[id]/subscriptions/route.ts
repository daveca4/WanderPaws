import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Get the user's subscriptions
    const userSubscriptions = await prisma.userSubscription.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Parse any JSON fields in the data
    const parsedSubscriptions = userSubscriptions.map(subscription => parseJsonFields(subscription));
    
    return NextResponse.json(parsedSubscriptions);
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch user subscriptions' }, { status: 500 });
  }
} 