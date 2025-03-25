import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result, resultNotes, feedback } = await request.json();
    
    if (!result) {
      return NextResponse.json(
        { error: 'Assessment result is required' },
        { status: 400 }
      );
    }
    
    if (!['approved', 'denied'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be either "approved" or "denied"' },
        { status: 400 }
      );
    }
    
    // Verify the assessment exists and is in the correct state
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id }
    });
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    if (assessment.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Assessment must be in scheduled state to be reviewed' },
        { status: 400 }
      );
    }
    
    // Update the assessment with the review results
    const updatedAssessment = await prisma.assessment.update({
      where: { id: params.id },
      data: {
        status: 'completed',
        result,
        resultNotes,
        feedback
      }
    });
    
    // If approved, update the dog's assessment status
    if (result === 'approved') {
      await prisma.dog.update({
        where: { id: assessment.dogId },
        data: {
          assessmentStatus: 'approved'
        }
      });
    }
    
    return NextResponse.json(updatedAssessment);
  } catch (error) {
    console.error('Error reviewing assessment:', error);
    return NextResponse.json(
      { error: 'Failed to review assessment' },
      { status: 500 }
    );
  }
} 