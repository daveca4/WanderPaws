import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    logger.info(`GET /api/data/owners/byUserId/${userId}`);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the requesting user's info
    const { userId: requestingUserId, role } = await getUserFromRequest(request);
    
    if (!requestingUserId || !role) {
      logger.warn('Unauthorized - Missing user information', { requestingUserId, role });
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
      logger.warn('Owner not found', { userId });
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }
    
    // Admin can access any owner
    // An owner can only access their own profile
    if (role !== 'admin' && requestingUserId !== userId) {
      logger.warn('Unauthorized - Cannot access this owner profile', { 
        requestingUserId, 
        targetUserId: userId,
        role 
      });
      return NextResponse.json({ error: 'Unauthorized - Cannot access this owner profile' }, { status: 403 });
    }
    
    logger.success('Owner data fetched', { ownerId: owner.id });
    return NextResponse.json(owner);
  } catch (error) {
    logger.error('Error fetching owner by userId:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owner', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 