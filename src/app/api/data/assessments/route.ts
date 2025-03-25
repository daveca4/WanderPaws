import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET() {
  try {
    const assessments = await prisma.assessment.findMany();
    
    // Parse any JSON fields in the data
    const parsedAssessments = assessments.map(assessment => parseJsonFields(assessment));
    
    return NextResponse.json(parsedAssessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
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
    
    // Parse any JSON fields in the response
    const parsedAssessment = parseJsonFields(assessment);
    
    return NextResponse.json(parsedAssessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Failed to create assessment: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 