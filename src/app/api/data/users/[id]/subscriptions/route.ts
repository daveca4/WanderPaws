import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API: Fetching subscriptions for user ID:', params.id);
    
    // Get user profile ID if not directly provided
    let userProfileId = null;
    
    // First try to find an owner profile
    const ownerProfile = await prisma.owner.findUnique({
      where: {
        userId: params.id
      },
      select: { id: true }
    });
    
    if (ownerProfile) {
      userProfileId = ownerProfile.id;
      console.log('Found owner profile ID:', userProfileId);
    } else {
      // If no owner profile, try walker profile
      const walkerProfile = await prisma.walker.findUnique({
        where: {
          userId: params.id
        },
        select: { id: true }
      });
      
      if (walkerProfile) {
        userProfileId = walkerProfile.id;
        console.log('Found walker profile ID:', userProfileId);
      }
    }
    
    if (!userProfileId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    // Now fetch subscriptions
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        userId: userProfileId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Also fetch plans to join with subscriptions
    const plans = await prisma.subscriptionPlan.findMany();
    
    console.log(`Found ${subscriptions.length} subscriptions for user`);
    
    // Add derived fields and join with plan data
    const enhancedSubscriptions = subscriptions.map(sub => {
      const plan = plans.find(p => p.id === sub.planId);
      
      // Transform data from the database to match our frontend type
      return {
        ...sub,
        walkDuration: plan?.walkDuration || sub.walkDuration || 30,
        // Create any other fields needed by the frontend
        isActive: sub.status === 'active' && new Date(sub.endDate) > new Date()
      };
    });
    
    return NextResponse.json(enhancedSubscriptions);
  } catch (error: any) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 