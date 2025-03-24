import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const status = new URL(request.url).searchParams.get('status');
    
    const whereClause = status === 'active' 
      ? { isActive: true } 
      : {};
    
    // Fetch subscription plans from database
    const plans = await prisma.subscriptionPlan.findMany({
      where: whereClause,
      orderBy: { price: 'asc' }
    });
    
    // Return with proper plans structure
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans', plans: [] },
      { status: 500 }
    );
  }
} 