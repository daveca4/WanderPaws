import { NextRequest, NextResponse } from 'next/server';
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
    
    // For development, we'll just return a mock response
    // In production, this would call Cloudinary's API
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find first image or video as mock result
    const mockMediaItem = mediaItems && mediaItems.length > 0 ? mediaItems[0] : null;
    
    if (!mockMediaItem || !mockMediaItem.publicId) {
      return NextResponse.json(
        { error: 'No media items provided' },
        { status: 400 }
      );
    }
    
    // Simulate a response from Cloudinary
    const mockResponse = {
      public_id: `reels/${title.toLowerCase().replace(/\s+/g, '-')}`,
      secure_url: mockMediaItem.url || `https://res.cloudinary.com/dggxbflnu/video/upload/v1623456789/reels/${title.toLowerCase().replace(/\s+/g, '-')}.mp4`,
      format: outputFormat || 'mp4',
      resource_type: 'video',
      created_at: new Date().toISOString(),
      bytes: 15000000,
      width: aspectRatio === '16:9' ? 1920 : 1080,
      height: aspectRatio === '16:9' ? 1080 : 1920,
      duration: 30,
    };
    
    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error creating reel:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 