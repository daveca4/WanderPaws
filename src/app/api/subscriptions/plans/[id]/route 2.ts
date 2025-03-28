import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    // Find the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ plan });
  } catch (error) {
    console.error(`Error fetching subscription plan ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plan' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    // Get request body
    const data = await request.json();
    
    // Check if plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });
    
    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    
    // Update the subscription plan
    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        walkCredits: data.walkCredits,
        walkDuration: data.walkDuration,
        price: data.price,
        validityPeriod: data.validityPeriod,
        isActive: data.isActive,
        updatedAt: new Date(),
        discountPercentage: data.discountPercentage
      }
    });
    
    return NextResponse.json({ 
      plan: updatedPlan,
      message: 'Subscription plan updated successfully'
    });
  } catch (error) {
    console.error(`Error updating subscription plan ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    // Check if plan exists first
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });
    
    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    
    // Delete the subscription plan
    await prisma.subscriptionPlan.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting subscription plan ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete subscription plan' },
      { status: 500 }
    );
  }
} 