import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    
    // Query just the assessments first, without complex relations
    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get the unique IDs we need for additional queries
    const dogIds = Array.from(new Set(assessments.map(a => a.dogId)));
    const ownerIds = Array.from(new Set(assessments.map(a => a.ownerId)));
    
    // Fetch dogs separately
    const dogs = await prisma.dog.findMany({
      where: {
        id: { in: dogIds }
      },
      include: {
        owner: true
      }
    });
    
    // Create a lookup map for dogs
    const dogMap = dogs.reduce((map, dog) => {
      map[dog.id] = dog;
      return map;
    }, {} as Record<string, any>);
    
    // Merge the data into a format the frontend expects
    const formattedAssessments = assessments.map(assessment => {
      const dog = dogMap[assessment.dogId] || null;
      
      return {
        ...assessment,
        dog: dog ? {
          id: dog.id,
          name: dog.name,
          breed: dog.breed,
          age: dog.age,
          size: dog.size,
          imageUrl: dog.imageUrl,
          owner: dog.owner ? {
            id: dog.owner.id,
            name: dog.owner.name,
            email: dog.owner.email
          } : null
        } : null
      };
    });
    
    logger.success('Admin assessments data fetched', { count: assessments.length });
    
    return NextResponse.json({ assessments: formattedAssessments });
  } catch (error) {
    logger.error('Error fetching admin assessments data', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch admin assessments data' },
      { status: 500 }
    );
  }
} 