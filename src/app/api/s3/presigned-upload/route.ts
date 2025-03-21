import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/s3Service';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { fileName, contentType, prefix, metadata } = body;
    
    // Validate required fields
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }
    
    // Generate the presigned URL using v3 SDK
    const result = await getPresignedUploadUrl(fileName, contentType, {
      prefix,
      metadata,
    });
    
    // Return the presigned URL - now using a PUT operation instead of POST
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
} 