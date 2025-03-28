import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`API: Fetching assessment with ID: ${id}`);

    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      console.log(`API: Assessment with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    console.log(`API: Successfully found assessment: ${assessment.id}`);

    // Format dates
    const assessmentWithFormattedDates = {
      ...assessment,
      createdDate: assessment.createdDate.toISOString(),
      scheduledDate: assessment.scheduledDate.toISOString(),
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString()
    };

    return NextResponse.json(assessmentWithFormattedDates);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updateData = await request.json();
    console.log(`API: Updating assessment with ID: ${id}`, updateData);

    // Handle special cases for assessment status
    if (updateData.feedback && !updateData.status) {
      // If feedback was submitted but status wasn't specified, set status to 'feedback_submitted'
      updateData.status = 'feedback_submitted';
    }

    // Perform the actual update
    const assessment = await prisma.assessment.update({
      where: { id },
      data: updateData
    });

    console.log(`API: Successfully updated assessment: ${assessment.id}, status: ${assessment.status}`);

    // Format dates
    const assessmentWithFormattedDates = {
      ...assessment,
      createdDate: assessment.createdDate.toISOString(),
      scheduledDate: assessment.scheduledDate.toISOString(),
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString()
    };

    return NextResponse.json(assessmentWithFormattedDates);
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
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