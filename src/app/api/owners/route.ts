import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Fetch all owners
    const owners = await prisma.owner.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json({ owners });
  } catch (error) {
    console.error('Error fetching owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owners' },
      { status: 500 }
    );
  }
}

// Get a single owner by ID
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }
    
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        dogs: true, // Include the owner's dogs
      },
    });
    
    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ owner });
  } catch (error) {
    console.error('Error fetching owner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owner' },
      { status: 500 }
    );
  }
} 