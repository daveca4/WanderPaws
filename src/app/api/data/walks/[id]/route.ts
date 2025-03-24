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
    const walk = await dbOps.getWalkById(id);
    
    if (!walk) {
      return NextResponse.json({ error: 'Walk not found' }, { status: 404 });
    }
    
    // Parse any JSON fields in the data
    const parsedWalk = parseJsonFields(walk);
    
    return NextResponse.json(parsedWalk);
  } catch (error) {
    console.error(`Error fetching walk with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch walk' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    const data = await request.json();
    const updatedWalk = await dbOps.updateWalk(id, data);
    
    // Parse any JSON fields in the response
    const parsedWalk = parseJsonFields(updatedWalk);
    
    return NextResponse.json(parsedWalk);
  } catch (error) {
    console.error(`Error updating walk with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update walk' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    await dbOps.deleteWalk(id);
    
    return NextResponse.json({ message: 'Walk deleted successfully' });
  } catch (error) {
    console.error(`Error deleting walk with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to delete walk' }, { status: 500 });
  }
} 