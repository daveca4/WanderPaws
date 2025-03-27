import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Find the assessment
    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    
    // Parse any JSON fields in the data
    const parsedAssessment = parseJsonFields(assessment);
    
    return NextResponse.json(parsedAssessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Check if assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    
    // Validate data
    if (data.scheduledDate && !isValidDate(data.scheduledDate)) {
      return NextResponse.json({ error: 'Invalid scheduled date' }, { status: 400 });
    }
    
    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: {
        scheduledDate: data.scheduledDate !== undefined ? data.scheduledDate : undefined,
        status: data.status !== undefined ? data.status : undefined,
        assignedWalkerId: data.assignedWalkerId !== undefined ? data.assignedWalkerId : undefined,
        result: data.result !== undefined ? data.result : undefined,
        adminNotes: data.adminNotes !== undefined ? data.adminNotes : undefined,
        resultNotes: data.resultNotes !== undefined ? data.resultNotes : undefined,
        feedback: data.feedback !== undefined ? data.feedback : undefined
      }
    });
    
    // Parse any JSON fields in the response
    const parsedAssessment = parseJsonFields(updatedAssessment);
    
    return NextResponse.json(parsedAssessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Failed to update assessment: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
}

// Helper function to validate date string
function isValidDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
} 