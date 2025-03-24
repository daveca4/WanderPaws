import { NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET() {
  try {
    const owners = await dbOps.getAllOwners();
    
    // Parse any JSON fields in the data
    const parsedOwners = owners.map(owner => parseJsonFields(owner));
    
    return NextResponse.json(parsedOwners);
  } catch (error) {
    console.error('Error fetching owners:', error);
    return NextResponse.json({ error: 'Failed to fetch owners' }, { status: 500 });
  }
} 