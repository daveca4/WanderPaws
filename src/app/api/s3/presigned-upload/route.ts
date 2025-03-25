import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { fileName, contentType, prefix = '', metadata = {} } = body;
    
    // Validate required fields
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }
    
    // Generate a unique key for the file using a timestamp prefix
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Create key based on whether a prefix is provided
    const key = prefix 
      ? `${prefix}/${timestamp}-${sanitizedName}` 
      : `${timestamp}-${sanitizedName}`;
    
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || 'wanderpaws';
    
    // Create the command for the operation
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      Metadata: metadata,
    });

    // Generate the presigned URL
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 15, // 15 minutes
    });
    
    return NextResponse.json({
      uploadUrl,
      key,
      bucket: bucketName
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
} 