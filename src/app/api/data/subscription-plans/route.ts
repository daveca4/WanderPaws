import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET() {
  try {
    // Get all active subscription plans
    const subscriptionPlans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        price: 'asc'
      }
    });
    
    // Parse any JSON fields in the data
    const parsedPlans = subscriptionPlans.map(plan => parseJsonFields(plan));
    
    return NextResponse.json(parsedPlans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription plans' }, { status: 500 });
  }
} 