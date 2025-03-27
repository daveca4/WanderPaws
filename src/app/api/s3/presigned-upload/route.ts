import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configure S3 client - create once and reuse
const region = process.env.AWS_REGION || 'eu-central-1';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
};
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'wanderpaws';

// Use singleton pattern for S3 client to avoid recreation on each request
let s3ClientInstance: S3Client | null = null;

const getS3Client = () => {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({ region, credentials });
  }
  return s3ClientInstance;
};

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { fileName, contentType, prefix = '', metadata = {} } = body;
    
    // Validate required fields - fast fail
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }
    
    // Generate a unique key for the file using a timestamp prefix
    const timestamp = Date.now().toString(); // Faster than ISO string manipulation
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Create key based on whether a prefix is provided
    const key = prefix 
      ? `${prefix}/${timestamp}-${sanitizedName}` 
      : `${timestamp}-${sanitizedName}`;
    
    // Get S3 client instance
    const s3Client = getS3Client();
    
    // Create the command for the operation
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      Metadata: metadata,
    });

    // Generate the presigned URL with shorter expiration for faster response
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 5, // 5 minutes instead of 15
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