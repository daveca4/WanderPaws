import { NextRequest, NextResponse } from 'next/server';
import { getSignedViewUrl } from '@/lib/s3Service';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const key = searchParams.get('key');
    const expiresIn = searchParams.get('expiresIn') 
      ? parseInt(searchParams.get('expiresIn') as string, 10) 
      : 3600; // Default to 1 hour
    
    // Validate required fields
    if (!key) {
      return NextResponse.json(
        { error: 'key parameter is required' },
        { status: 400 }
      );
    }
    
    // Generate the signed URL for viewing
    const signedUrl = await getSignedViewUrl(key, expiresIn);
    
    // Return the signed URL
    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error('Error generating signed URL for viewing:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL for viewing' },
      { status: 500 }
    );
  }
} 