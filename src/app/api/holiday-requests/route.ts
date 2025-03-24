import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get all holiday requests with optional filtering
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const walkerId = url.searchParams.get('walkerId');
    
    // Build where clause based on query parameters
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (walkerId) {
      where.walkerId = walkerId;
    }
    
    // Fetch holiday requests
    const requests = await prisma.holidayRequest.findMany({
      where,
      orderBy: { date: 'asc' }
    });
    
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching holiday requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holiday requests', requests: [] },
      { status: 500 }
    );
  }
}

// Create a new holiday request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walkerId, date, reason } = body;
    
    if (!walkerId || !date || !reason) {
      return NextResponse.json(
        { error: 'Walker ID, date, and reason are required' },
        { status: 400 }
      );
    }
    
    // Create a new holiday request
    const holidayRequest = await prisma.holidayRequest.create({
      data: {
        walkerId,
        date,
        reason,
        status: 'pending',
      }
    });
    
    return NextResponse.json({ request: holidayRequest });
  } catch (error) {
    console.error('Error creating holiday request:', error);
    return NextResponse.json(
      { error: 'Failed to create holiday request' },
      { status: 500 }
    );
  }
} 