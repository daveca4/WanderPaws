import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    console.log(`GET /api/data/owners/byUserId/${userId}`);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the requesting user's info from headers
    const requestingUserId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');
    
    if (!requestingUserId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized - Missing user information' }, { status: 401 });
    }
    
    // Find owner by userId
    const owner = await prisma.owner.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }
    
    // Admin can access any owner
    // An owner can only access their own profile
    if (userRole !== 'admin' && requestingUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Cannot access this owner profile' }, { status: 403 });
    }
    
    return NextResponse.json(owner);
  } catch (error) {
    console.error('Error fetching owner by userId:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owner', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 