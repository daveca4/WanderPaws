import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAdminRequest } from '../../../../lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    // Verify this is an admin request
    const adminAuth = await verifyAdminRequest(request);
    if (!adminAuth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    const { 
      userId, 
      planId, 
      startDate = new Date(), 
      durationDays = 30,
      creditsOverride,
      notes
    } = data;
    
    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and planId are required' },
        { status: 400 }
      );
    }
    
    // Get the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    
    // Get the user and check they exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { owner: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'User must be an owner to create a subscription' },
        { status: 400 }
      );
    }
    
    if (!user.owner) {
      return NextResponse.json(
        { error: 'User does not have an owner profile' },
        { status: 400 }
      );
    }
    
    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (durationDays || 30));
    
    // Create the subscription
    const subscription = await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        walkCredits: plan.walkCredits,
        walkDuration: plan.walkDuration,
        creditsRemaining: creditsOverride !== undefined ? creditsOverride : plan.walkCredits,
        startDate: start,
        endDate: end,
        status: 'active',
        purchaseAmount: plan.price,
        purchaseDate: start
        // Store admin notes in a comment for now as schema doesn't support it
      }
    });
    
    // Log the action in console instead
    console.log('Admin action:', {
      action: 'create_subscription',
      adminId: adminAuth.userId || 'unknown',
      subscription: subscription.id,
      user: userId,
      plan: planId,
      date: new Date()
    });
    
    // Log detailed information about the subscription to help with debugging
    console.log('Created subscription details:', {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.planId,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      credits: subscription.walkCredits,
      creditsRemaining: subscription.creditsRemaining
    });
    
    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscription
    });
    
  } catch (error) {
    console.error('Error in create-subscription API:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 