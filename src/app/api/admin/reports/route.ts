import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/apiAuth';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminRequest(request);

    // Get revenue data (from completed walks)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Get revenue data by month
    const walks = await prisma.walk.findMany({
      where: {
        status: 'completed',
        startTime: { gte: sixMonthsAgo.toISOString() }
      },
      include: {
        walker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        dog: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    // Process walk data for reports
    const reports = walks.map(walk => ({
      id: walk.id,
      startTime: walk.startTime,
      duration: walk.duration,
      walker: walk.walker,
      dog: walk.dog,
      revenue: (walk.duration || 0) * (10 / 60) // £10 per hour
    }));

    logger.success('Admin reports data fetched');
    return NextResponse.json(reports);
  } catch (error) {
    logger.error('Error in reports API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
} 