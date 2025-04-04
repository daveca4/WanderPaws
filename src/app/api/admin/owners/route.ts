import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId, role } = await getUserFromRequest(request);
    
    logger.info('Admin owners request', { userId, role });
    
    if (!userId || role !== 'admin') {
      logger.warn('Unauthorized access attempt to admin owners', { userId, role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.info('Fetching admin owners data');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || '';
    
    // Build the where clause based on filters
    const where: any = {
      user: {
        role: 'owner'
      }
    };
    
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { phone: { contains: searchQuery, mode: 'insensitive' } },
        { user: { email: { contains: searchQuery, mode: 'insensitive' } } }
      ];
    }
    
    // Query database for owners
    const owners = await prisma.owner.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            createdAt: true
          }
        },
        dogs: {
          select: {
            id: true,
            name: true,
            breed: true,
            age: true,
            size: true,
          }
        },
        subscriptions: {
          where: {
            status: 'active'
          },
          select: {
            id: true,
            planName: true,
            startDate: true,
            endDate: true,
            creditsRemaining: true
          },
          orderBy: {
            endDate: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        user: {
          createdAt: 'desc'
        }
      }
    });
    
    logger.success('Admin owners data fetched', { count: owners.length });
    
    return NextResponse.json({ owners });
  } catch (error) {
    logger.error('Error fetching admin owners data', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch admin owners data' },
      { status: 500 }
    );
  }
} 