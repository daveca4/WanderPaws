import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId, role } = await getUserFromRequest(request);
    
    logger.info('Admin assessments request', { userId, role });
    
    if (!userId || role !== 'admin') {
      logger.warn('Unauthorized access attempt to admin assessments', { userId, role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.info('Fetching admin assessments data');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const dogId = searchParams.get('dogId') || '';
    
    // Build the where clause based on filters
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (dogId) {
      where.dogId = dogId;
    }
    
    // Query database for assessments with filters
    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        dog: {
          select: {
            id: true,
            name: true,
            breed: true,
            age: true,
            size: true,
            imageUrl: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    logger.success('Admin assessments data fetched', { count: assessments.length });
    
    return NextResponse.json({ assessments });
  } catch (error) {
    logger.error('Error fetching admin assessments data', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch admin assessments data' },
      { status: 500 }
    );
  }
} 