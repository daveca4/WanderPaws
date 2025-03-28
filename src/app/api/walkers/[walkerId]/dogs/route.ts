import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { walkerId: string } }
) {
  try {
    const walkerId = params.walkerId;
    console.log(`Fetching dogs for walker ID: ${walkerId}`);
    
    // Find walks assigned to this walker
    const walks = await prisma.walk.findMany({
      where: { 
        walkerId,
        status: {
          in: ['scheduled', 'completed', 'in-progress']
        }
      },
      include: {
        dog: true
      },
      distinct: ['dogId'] // Only get one entry per dog
    });
    
    console.log(`Found ${walks.length} walks with distinct dogs for walker ${walkerId}`);
    
    // Extract the dogs from the walks
    const dogs = walks.map(walk => walk.dog);
    
    // Also get any dogs from assessments that are assigned to this walker
    // First get the assessments
    const assessments = await prisma.assessment.findMany({
      where: {
        assignedWalkerId: walkerId,
        status: {
          in: ['scheduled', 'completed']
        }
      }
    });
    
    console.log(`Found ${assessments.length} assessments for walker ${walkerId}`);
    
    // Get the dogs separately since there's no direct relation in the schema
    if (assessments.length > 0) {
      const dogIds = assessments.map(assessment => assessment.dogId);
      console.log(`Fetching ${dogIds.length} dogs from assessments`);
      
      const assessmentDogs = await prisma.dog.findMany({
        where: {
          id: {
            in: dogIds
          }
        }
      });
      
      // Add assessment dogs, avoiding duplicates
      for (const dog of assessmentDogs) {
        if (!dogs.some(existingDog => existingDog.id === dog.id)) {
          dogs.push(dog);
        }
      }
    }
    
    return NextResponse.json(dogs);
  } catch (error) {
    console.error('Error fetching dogs for walker:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dogs for walker',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 