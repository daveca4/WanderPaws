import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { walkerId: string } }
) {
  try {
    const walkerId = params.walkerId;
    console.log(`API: Fetching assessments for walker ID: ${walkerId}`);
    
    // Directly query assessments with this walker ID
    const assessments = await prisma.assessment.findMany({
      where: { 
        assignedWalkerId: walkerId
      }
    });
    
    console.log(`API: Found ${assessments.length} assessments for walker ${walkerId}`);
    
    // Format dates to ISO strings
    const formattedAssessments = assessments.map(assessment => ({
      ...assessment,
      createdDate: assessment.createdDate.toISOString(),
      scheduledDate: assessment.scheduledDate.toISOString(),
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString()
    }));
    
    return NextResponse.json(formattedAssessments);
  } catch (error) {
    console.error('Error fetching assessments for walker:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assessments for walker',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 