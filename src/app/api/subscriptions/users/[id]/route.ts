import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  }
}

// Get a specific user subscription by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }
    
    // Find the subscription
    const subscription = await prisma.userSubscription.findUnique({
      where: { id }
    });
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error(`Error fetching subscription ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// Update a user subscription
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }
    
    // Find and update the subscription
    const subscription = await prisma.userSubscription.update({
      where: { id },
      data: body
    });
    
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error(`Error updating subscription ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// Delete a user subscription
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the subscription
    await prisma.userSubscription.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting subscription ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
} 