import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dogId = searchParams.get('dogId');
    const ownerId = searchParams.get('ownerId');
    
    // Get auth context from headers
    const authContext = {
      userId: request.headers.get('user-id'),
      role: request.headers.get('user-role'),
      profileId: request.headers.get('user-profile-id')
    };
    
    logger.info('Fetching assessments with filters', { 
      status,
      dogId,
      ownerId,
      url: request.url,
      auth: authContext
    });
    
    // Build query conditions
    const where: any = {};
    
    if (status) {
      // Case insensitive query for status
      where.status = {
        contains: status,
        mode: 'insensitive'
      };
    }
    
    if (dogId) {
      where.dogId = dogId;
    }
    
    if (ownerId) {
      where.ownerId = ownerId;
    }
    
    // Log the query we're about to execute
    logger.info('Executing assessment query', { where });
    
    // First check if there are any assessments at all
    const totalCount = await prisma.assessment.count();
    logger.info(`Total assessments in database: ${totalCount}`);
    
    // Get all status values in the database for debugging
    if (totalCount > 0) {
      const allStatuses = await prisma.assessment.findMany({
        select: {
          id: true,
          status: true,
          dogId: true,
          ownerId: true
        }
      });
      
      logger.info('All assessment statuses in database', {
        statusSummary: allStatuses.map(a => ({ 
          id: a.id, 
          status: a.status,
          dogId: a.dogId,
          ownerId: a.ownerId
        }))
      });
    }
    
    // Fetch assessments with filters
    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    logger.info('Found assessments', { 
      count: assessments.length, 
      filters: where,
      firstAssessment: assessments.length > 0 ? {
        id: assessments[0].id,
        status: assessments[0].status,
        dogId: assessments[0].dogId,
        ownerId: assessments[0].ownerId
      } : null
    });
    
    // Parse any JSON fields in the data
    const parsedAssessments = assessments.map(assessment => parseJsonFields(assessment));
    
    return NextResponse.json({ assessments: parsedAssessments });
  } catch (error) {
    logger.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.dogId) {
      return NextResponse.json({ error: 'Dog ID is required' }, { status: 400 });
    }
    
    if (!data.ownerId) {
      return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
    }
    
    // Make sure the dog exists
    const dogExists = await prisma.dog.findUnique({
      where: { id: data.dogId }
    });
    
    if (!dogExists) {
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
    }
    
    // Check if owner exists
    const ownerExists = await prisma.owner.findUnique({
      where: { id: data.ownerId }
    });
    
    if (!ownerExists) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }
    
    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        dogId: data.dogId,
        ownerId: data.ownerId,
        status: data.status || 'pending',
        createdDate: new Date(),
        scheduledDate: new Date(data.scheduledDate) || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Default to 3 days from now
        adminNotes: data.adminNotes || '',
        resultNotes: data.resultNotes || ''
      }
    });
    
    logger.info('Created new assessment', { 
      id: assessment.id, 
      dogId: assessment.dogId,
      ownerId: assessment.ownerId,
      status: assessment.status
    });
    
    // Parse any JSON fields in the response
    const parsedAssessment = parseJsonFields(assessment);
    
    return NextResponse.json(parsedAssessment, { status: 201 });
  } catch (error) {
    logger.error('Error creating assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Failed to create assessment: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 