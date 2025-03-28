import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAdminRequest } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    // Verify this is an admin request
    const adminAuth = await verifyAdminRequest(request);
    if (!adminAuth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    const { assessmentId, approved, notes } = data;
    
    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the assessment
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId }
    });
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    // Validate the assessment is in valid state for approval
    if (assessment.status !== 'feedback_submitted' && assessment.status !== 'ready_for_review') {
      return NextResponse.json(
        { error: `Assessment cannot be approved in current status: ${assessment.status}` },
        { status: 400 }
      );
    }
    
    // Update assessment with approval status
    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'completed',
        result: approved ? 'approved' : 'denied',
        resultNotes: notes || '',
        updatedAt: new Date()
      }
    });
    
    // Update dog assessment status
    if (updatedAssessment) {
      await prisma.dog.update({
        where: { id: updatedAssessment.dogId },
        data: {
          assessmentStatus: approved ? 'approved' : 'denied',
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Assessment ${approved ? 'approved' : 'denied'} successfully`,
      assessment: updatedAssessment
    });
    
  } catch (error) {
    console.error('Error in approve-assessment API:', error);
    return NextResponse.json(
      { error: 'Failed to process approval', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 