import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { walkerId } = await request.json();
    
    if (!walkerId) {
      return NextResponse.json(
        { error: 'Walker ID is required' },
        { status: 400 }
      );
    }
    
    // Verify the assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id }
    });
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    // Verify the walker exists
    const walker = await prisma.walker.findUnique({
      where: { id: walkerId }
    });
    
    if (!walker) {
      return NextResponse.json(
        { error: 'Walker not found' },
        { status: 404 }
      );
    }
    
    // Update the assessment with the assigned walker
    const updatedAssessment = await prisma.assessment.update({
      where: { id: params.id },
      data: {
        assignedWalkerId: walkerId,
        status: 'scheduled'
      }
    });
    
    return NextResponse.json(updatedAssessment);
  } catch (error) {
    console.error('Error assigning walker to assessment:', error);
    return NextResponse.json(
      { error: 'Failed to assign walker to assessment' },
      { status: 500 }
    );
  }
} 