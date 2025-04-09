import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { logger } from '@/lib/utils/logger';

/**
 * API endpoint to fetch pending assessments for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId, role } = await getUserFromRequest(request);
    
    logger.info('Admin pending assessments request', { userId, role });
    
    if (!userId || role !== 'admin') {
      logger.warn('Unauthorized access attempt to admin pending assessments', { userId, role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Query for all pending assessments
    const assessments = await prisma.assessment.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    logger.info('Found pending assessments', { count: assessments.length });
    
    // Format the assessments - ensure dates are converted to strings
    const formattedAssessments = assessments.map(assessment => ({
      ...assessment,
      createdDate: assessment.createdDate.toISOString(),
      scheduledDate: assessment.scheduledDate.toISOString(),
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString()
    }));
    
    // Include more detailed info about the assessments
    const enhancedAssessments = await Promise.all(
      formattedAssessments.map(async (assessment) => {
        try {
          // Get dog info
          const dog = await prisma.dog.findUnique({
            where: { id: assessment.dogId },
            select: {
              id: true,
              name: true,
              breed: true,
              imageUrl: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          });
          
          return {
            ...assessment,
            dog,
            owner: dog?.owner || null
          };
        } catch (error) {
          logger.error('Error enriching assessment data', { assessmentId: assessment.id, error });
          return assessment;
        }
      })
    );
    
    logger.success('Admin pending assessments data fetched', { count: enhancedAssessments.length });
    
    return NextResponse.json({ assessments: enhancedAssessments });
  } catch (error) {
    logger.error('Error fetching admin pending assessments data', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch admin pending assessments data' },
      { status: 500 }
    );
  }
} 