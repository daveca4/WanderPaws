import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Create S3 client with credentials from environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function POST(req: NextRequest) {
  try {
    // Get the key from the request body
    const { key, expiresIn = 60 * 60 * 24 } = await req.json();
    
    if (!key) {
      return NextResponse.json({ error: 'Object key is required' }, { status: 400 });
    }
    
    const bucket = process.env.AWS_S3_BUCKET_NAME || 'wanderpaws';
    
    // Generate a new pre-signed URL for viewing the object
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
      expiresIn: Number(expiresIn) // Convert to number in case it's passed as string
    });
    
    return NextResponse.json({
      success: true,
      key,
      bucket,
      location: signedUrl,
      expiresIn
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate URL' },
      { status: 500 }
    );
  }
} 