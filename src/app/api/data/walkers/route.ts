import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';
import { Walker } from '@/lib/types';

export async function GET() {
  try {
    const walkers = await dbOps.getAllWalkers();
    
    // Parse any JSON fields in the data
    const parsedWalkers = walkers.map((walker: any) => parseJsonFields(walker));
    
    return NextResponse.json(parsedWalkers);
  } catch (error) {
    console.error('Error fetching walkers:', error);
    return NextResponse.json({ error: 'Failed to fetch walkers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newWalker = await dbOps.createWalker(data);
    
    // Parse any JSON fields in the response
    const parsedWalker = parseJsonFields(newWalker);
    
    return NextResponse.json(parsedWalker, { status: 201 });
  } catch (error) {
    console.error('Error creating walker:', error);
    return NextResponse.json({ error: 'Failed to create walker' }, { status: 500 });
  }
} 