import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET() {
  try {
    const dogs = await dbOps.getAllDogs();
    
    // Parse any JSON fields in the data
    const parsedDogs = dogs.map(dog => parseJsonFields(dog));
    
    return NextResponse.json(parsedDogs);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    return NextResponse.json({ error: 'Failed to fetch dogs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Dog name is required' }, { status: 400 });
    }
    
    if (!data.ownerId) {
      return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
    }
    
    console.log('Creating dog with owner ID:', data.ownerId);
    
    const newDog = await dbOps.createDog(data);
    
    // Parse any JSON fields in the response
    const parsedDog = parseJsonFields(newDog);
    
    return NextResponse.json(parsedDog, { status: 201 });
  } catch (error) {
    console.error('Error creating dog:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Send a more descriptive error message to the client
    return NextResponse.json({ 
      error: `Failed to create dog: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 