import { NextRequest, NextResponse } from 'next/server';
import { getSignedViewUrl } from '@/lib/s3Service';
import axios from 'axios';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const key = searchParams.get('key');
    const size = searchParams.get('size') || '';
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

    // If not a HEIC file, redirect to regular signed URL endpoint
    if (!key.toLowerCase().endsWith('.heic')) {
      return NextResponse.redirect(
        new URL(`/api/s3/signed-url?key=${encodeURIComponent(key)}&expiresIn=${expiresIn}`, req.url)
      );
    }
    
    // Get bucket name from environment
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'wanderpaws-media';
    
    // Create a command to get the HEIC file
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Generate a signed URL to get the HEIC file
    const heicUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn,
    });

    try {
      // Download the HEIC file
      const response = await axios.get(heicUrl, {
        responseType: 'arraybuffer'
      });
      
      // Set up sharp for conversion
      let sharpProcess = sharp(response.data).toFormat('jpeg');
      
      // Apply resizing based on size if specified
      if (size) {
        const dimensions = {
          small: { width: 150, height: 150 },
          medium: { width: 300, height: 300 },
          large: { width: 600, height: 600 }
        };
        
        if (size in dimensions) {
          const { width, height } = dimensions[size as keyof typeof dimensions];
          sharpProcess = sharpProcess.resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
      }
      
      // Convert HEIC to JPEG using sharp
      const jpeg = await sharpProcess.jpeg({ quality: 85 }).toBuffer();
      
      // Create a key for the converted file, including size if it was specified
      let jpegKey = key.replace(/\.heic$/i, '.jpg');
      if (size) {
        jpegKey = jpegKey.replace(/\.jpg$/i, `-${size}.jpg`);
      }
      
      // Upload the converted file to S3
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: jpegKey,
        Body: jpeg,
        ContentType: 'image/jpeg',
        Metadata: {
          'converted-from': key,
          'size': size || 'original',
        },
      });
      
      await s3Client.send(putCommand);
      
      // Generate a signed URL for the JPEG file
      const signedJpegUrl = await getSignedViewUrl(jpegKey, expiresIn);
      
      // Return the signed URL for the JPEG file
      return NextResponse.json({ signedUrl: signedJpegUrl });
    } catch (error) {
      console.error('Error converting HEIC:', error);
      
      // Fallback to original signed URL if conversion fails
      const signedUrl = await getSignedViewUrl(key, expiresIn);
      return NextResponse.json({ signedUrl });
    }
  } catch (error) {
    console.error('Error handling HEIC conversion:', error);
    return NextResponse.json(
      { error: 'Failed to process HEIC file' },
      { status: 500 }
    );
  }
} 