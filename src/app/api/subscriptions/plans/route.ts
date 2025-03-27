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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.description || !data.walkCredits || !data.price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create the subscription plan
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        walkCredits: data.walkCredits,
        walkDuration: data.walkDuration || 60,
        price: data.price,
        // Note: validityPeriod is not in the schema, we need to store this in features or add it to the schema
        features: [`Valid for ${data.validityPeriod} days`],
        isActive: data.isActive === undefined ? true : data.isActive,
        discountPercentage: data.discountPercentage || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      plan,
      message: 'Subscription plan created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
} 