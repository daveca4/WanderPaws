import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownerId = params.id;
    
    if (!ownerId) {
      return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
    }
    
    // Check if the owner exists
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId }
    });
    
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }
    
    // Find all dogs for this owner
    const dogs = await prisma.dog.findMany({
      where: { ownerId: ownerId }
    });
    
    // Parse any JSON fields in the data
    const parsedDogs = dogs.map(dog => parseJsonFields(dog));
    
    return NextResponse.json(parsedDogs);
  } catch (error) {
    console.error(`Error fetching dogs for owner:`, error);
    return NextResponse.json({ error: 'Failed to fetch dogs' }, { status: 500 });
  }
} 