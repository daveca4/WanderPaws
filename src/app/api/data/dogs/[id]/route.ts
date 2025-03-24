import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    const dog = await dbOps.getDogById(id);
    
    if (!dog) {
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
    }
    
    // Parse any JSON fields in the data
    const parsedDog = parseJsonFields(dog);
    
    return NextResponse.json(parsedDog);
  } catch (error) {
    console.error(`Error fetching dog with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch dog' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    const data = await request.json();
    const updatedDog = await dbOps.updateDog(id, data);
    
    // Parse any JSON fields in the response
    const parsedDog = parseJsonFields(updatedDog);
    
    return NextResponse.json(parsedDog);
  } catch (error) {
    console.error(`Error updating dog with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update dog' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    await dbOps.deleteDog(id);
    
    return NextResponse.json({ message: 'Dog deleted successfully' });
  } catch (error) {
    console.error(`Error deleting dog with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to delete dog' }, { status: 500 });
  }
} 