import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId, role } = await getUserFromRequest(request);
    
    logger.info('Admin dogs request', { userId, role });
    
    if (!userId || role !== 'admin') {
      logger.warn('Unauthorized access attempt to admin dogs', { userId, role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.info('Fetching admin dogs data');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const breedFilter = searchParams.get('breedFilter') || '';
    const sizeFilter = searchParams.get('sizeFilter') || '';
    const statusFilter = searchParams.get('statusFilter') || '';
    const ownerId = searchParams.get('ownerId') || '';
    
    // Build the where clause based on filters
    const where: any = {};
    
    if (breedFilter) {
      where.breed = {
        contains: breedFilter,
        mode: 'insensitive'
      };
    }
    
    if (sizeFilter) {
      where.size = sizeFilter;
    }
    
    if (statusFilter) {
      where.status = statusFilter;
    }
    
    if (ownerId) {
      where.ownerId = ownerId;
    }
    
    // Query database for dogs with filters
    const dogs = await prisma.dog.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        walks: {
          select: {
            id: true,
            status: true,
            startTime: true,
          },
          take: 5,
          orderBy: {
            startTime: 'desc'
          }
        },
        assessments: {
          select: {
            id: true,
            status: true,
            result: true,
            createdAt: true
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    logger.success('Admin dogs data fetched', { count: dogs.length });
    
    return NextResponse.json({ dogs });
  } catch (error) {
    logger.error('Error fetching admin dogs data', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch admin dogs data' },
      { status: 500 }
    );
  }
} 