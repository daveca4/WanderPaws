import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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
    console.log('S3 direct upload request received');
    
    // Parse form data with file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const prefix = formData.get('prefix') as string || '';
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    // Generate a unique key
    const timestamp = Date.now().toString();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = prefix 
      ? `${prefix}/${timestamp}-${sanitizedName}` 
      : `${timestamp}-${sanitizedName}`;
    
    console.log(`Generated key: ${key}`);
    
    // Get file buffer
    const fileBuffer = await file.arrayBuffer();
    console.log(`File buffer created, size: ${fileBuffer.byteLength}`);
    
    const bucket = process.env.AWS_S3_BUCKET_NAME || 'wanderpaws';
    console.log(`Using bucket: ${bucket}`);
    
    // Upload without ACL, keeping bucket private
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
      Metadata: metadata
    });
    
    console.log('Sending upload command to S3');
    const uploadResult = await s3Client.send(command);
    console.log('S3 upload successful:', uploadResult);
    
    // Generate a pre-signed URL for viewing the object (valid for 7 days)
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    // Create a signed URL with 7-day expiration
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
      expiresIn: 60 * 60 * 24 * 7 // 7 days
    });
    
    console.log(`Generated pre-signed URL: ${signedUrl}`);
    
    return NextResponse.json({
      success: true,
      key,
      bucket,
      location: signedUrl, // Use the pre-signed URL as the primary location
      originalKey: key,
      contentType: file.type,
      expiresIn: '7 days'
    });
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    // Send a more detailed error response
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to upload file',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Increase payload size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
}; 