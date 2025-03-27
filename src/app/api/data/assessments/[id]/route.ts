import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Fetching assessment with ID: ${id}`);
    
    // Find the assessment
    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });
    
    if (!assessment) {
      console.error(`Assessment not found with ID: ${id}`);
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    
    console.log(`Assessment found: ${assessment.id}, status: ${assessment.status}`);
    
    // Parse any JSON fields in the data
    const parsedAssessment = parseJsonFields(assessment);
    
    return NextResponse.json(parsedAssessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch assessment',
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    console.log(`Updating assessment ${id} with data:`, data);
    
    // Check if assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });
    
    if (!assessment) {
      console.error(`Assessment not found with ID: ${id}`);
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    
    console.log(`Existing assessment found: ${assessment.id}, status: ${assessment.status}`);
    
    // Validate data
    if (data.scheduledDate && !isValidDate(data.scheduledDate)) {
      console.error(`Invalid scheduled date provided: ${data.scheduledDate}`);
      return NextResponse.json({ error: 'Invalid scheduled date' }, { status: 400 });
    }
    
    const updateData = {
      ...(data.scheduledDate !== undefined && { scheduledDate: new Date(data.scheduledDate) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.assignedWalkerId !== undefined && { assignedWalkerId: data.assignedWalkerId }),
      ...(data.result !== undefined && { result: data.result }),
      ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes }),
      ...(data.resultNotes !== undefined && { resultNotes: data.resultNotes }),
      ...(data.feedback !== undefined && { feedback: data.feedback }),
      updatedAt: new Date()
    };
    
    console.log('Final update data:', updateData);
    
    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: updateData
    });
    
    console.log(`Assessment updated successfully: ${updatedAssessment.id}, new status: ${updatedAssessment.status}`);
    
    // Parse any JSON fields in the response
    const parsedAssessment = parseJsonFields(updatedAssessment);
    
    return NextResponse.json(parsedAssessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Failed to update assessment: ${errorMessage}`,
      details: error instanceof Error ? error.stack : undefined
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