import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET() {
  try {
    const walks = await dbOps.getAllWalks();
    
    // Parse any JSON fields in the data
    const parsedWalks = walks.map(walk => parseJsonFields(walk));
    
    return NextResponse.json(parsedWalks);
  } catch (error) {
    console.error('Error fetching walks:', error);
    return NextResponse.json({ error: 'Failed to fetch walks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newWalk = await dbOps.createWalk(data);
    
    // Parse any JSON fields in the response
    const parsedWalk = parseJsonFields(newWalk);
    
    return NextResponse.json(parsedWalk, { status: 201 });
  } catch (error) {
    console.error('Error creating walk:', error);
    return NextResponse.json({ error: 'Failed to create walk' }, { status: 500 });
  }
} 