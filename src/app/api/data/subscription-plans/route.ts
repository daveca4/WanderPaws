import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/data/subscription-plans - fetching real data');
    
    // Query the database for real subscription plan data
    const subscriptionPlans = await prisma.subscriptionPlan.findMany({
      orderBy: {
        price: 'asc'
      }
    });
    
    console.log(`Found ${subscriptionPlans.length} subscription plans`);
    
    if (subscriptionPlans.length === 0) {
      console.warn('No subscription plans found in database');
    }
    
    // Return real subscription plans
    return NextResponse.json(subscriptionPlans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
} 