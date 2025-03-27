import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownerId = params.id;
    console.log('Fetching dogs for owner:', ownerId);
    
    if (!ownerId) {
      console.error('No owner ID provided');
      return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
    }
    
    // Check if the owner exists
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId }
    });
    
    if (!owner) {
      console.error('Owner not found:', ownerId);
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }
    
    // Find all dogs for this owner
    const dogs = await prisma.dog.findMany({
      where: { ownerId: ownerId },
      include: {
        owner: true
      }
    });
    
    console.log('Found dogs for owner:', dogs.length);
    
    // Parse any JSON fields in the data
    const parsedDogs = dogs.map(dog => parseJsonFields(dog));
    
    return NextResponse.json(parsedDogs);
  } catch (error) {
    console.error('Error fetching dogs for owner:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dogs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 