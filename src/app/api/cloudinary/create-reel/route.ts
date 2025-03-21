import { NextRequest, NextResponse } from 'next/server';
import { getSignedViewUrl } from '@/lib/s3Service';
import axios from 'axios';
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dggxbflnu',
  api_key: process.env.CLOUDINARY_API_KEY || '399599184441365',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HECjkZnvZvMaOgSmESdi-A9ABsQ',
  secure: true,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaItems, title, transitions, outputFormat, aspectRatio, tags } = body;
    
    if (!mediaItems || mediaItems.length === 0) {
      return NextResponse.json(
        { error: 'No media items provided' },
        { status: 400 }
      );
    }
    
    // Process S3 assets first - upload them to Cloudinary
    const processedMediaItems = [];
    
    for (const item of mediaItems) {
      if (item.isS3Asset) {
        try {
          // Get a signed URL for the S3 asset
          const signedUrl = await getSignedViewUrl(item.publicId);
          
          // Upload the S3 asset to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(signedUrl, {
            resource_type: 'auto',
            folder: 'from-s3',
            public_id: `s3-${item.publicId.split('/').pop()}`.replace(/[^\w\d-_]/g, '-'),
            tags: ['from-s3', ...(tags || [])],
          });
          
          // Add the uploaded asset to our processed list
          processedMediaItems.push({
            publicId: uploadResult.public_id,
            startTime: item.startTime,
            endTime: item.endTime
          });
        } catch (uploadError) {
          console.error(`Error uploading S3 asset to Cloudinary: ${item.publicId}`, uploadError);
          // Skip this asset if there's an error
          continue;
        }
      } else {
        // Regular Cloudinary asset
        processedMediaItems.push({
          publicId: item.publicId,
          startTime: item.startTime,
          endTime: item.endTime
        });
      }
    }
    
    if (processedMediaItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid media items could be processed' },
        { status: 400 }
      );
    }
    
    // Set up transformations
    const transformation = [];
    
    // Set aspect ratio
    if (aspectRatio) {
      switch (aspectRatio) {
        case '1:1':
          transformation.push({ width: 1080, height: 1080, crop: 'fill' });
          break;
        case '16:9':
          transformation.push({ width: 1920, height: 1080, crop: 'fill' });
          break;
        case '9:16':
          transformation.push({ width: 1080, height: 1920, crop: 'fill' });
          break;
        case '4:5':
          transformation.push({ width: 1080, height: 1350, crop: 'fill' });
          break;
      }
    }
    
    // Create a sanitized title for the public_id
    const sanitizedTitle = title ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\d-_]/g, '') : 'reel';
    const public_id = `reels/${sanitizedTitle}-${Date.now()}`;
    
    // Create the reel with Cloudinary's API
    const result = await cloudinary.uploader.create_slideshow({
      public_ids: processedMediaItems.map(item => item.publicId),
      transformation,
      public_id,
      notification_url: '/api/cloudinary/webhook',
      tags: [...(tags || []), 'reel', 'auto-generated'],
      resource_type: 'video',
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating reel:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 