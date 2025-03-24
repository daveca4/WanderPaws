import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  }
}

// Get a specific holiday request by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Holiday request ID is required' },
        { status: 400 }
      );
    }
    
    // Find the holiday request
    const holidayRequest = await prisma.holidayRequest.findUnique({
      where: { id }
    });
    
    if (!holidayRequest) {
      return NextResponse.json(
        { error: 'Holiday request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ request: holidayRequest });
  } catch (error) {
    console.error(`Error fetching holiday request ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch holiday request' },
      { status: 500 }
    );
  }
}

// Update a holiday request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Holiday request ID is required' },
        { status: 400 }
      );
    }
    
    // Find and update the holiday request
    const holidayRequest = await prisma.holidayRequest.update({
      where: { id },
      data: body
    });
    
    return NextResponse.json({ request: holidayRequest });
  } catch (error) {
    console.error(`Error updating holiday request ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update holiday request' },
      { status: 500 }
    );
  }
}

// Delete a holiday request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Holiday request ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the holiday request
    await prisma.holidayRequest.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting holiday request ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete holiday request' },
      { status: 500 }
    );
  }
} 