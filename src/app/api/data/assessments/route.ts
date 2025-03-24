import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET() {
  try {
    const assessments = await dbOps.getAllAssessments();
    
    // Parse any JSON fields in the data
    const parsedAssessments = assessments.map((assessment: any) => parseJsonFields(assessment));
    
    return NextResponse.json(parsedAssessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newAssessment = await dbOps.createAssessment(data);
    
    // Parse any JSON fields in the response
    const parsedAssessment = parseJsonFields(newAssessment);
    
    return NextResponse.json(parsedAssessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
} 