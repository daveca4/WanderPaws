import { NextRequest, NextResponse } from 'next/server';
// Import cloudinary using require to avoid client-side import issues
const cloudinary = require('cloudinary').v2;

export async function GET(request: NextRequest) {
  try {
    // Configure cloudinary (server-side only)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dggxbflnu',
      api_key: process.env.CLOUDINARY_API_KEY || '399599184441365',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'HECjkZnvZvMaOgSmESdi-A9ABsQ',
      secure: true,
    });
    
    // Try to ping Cloudinary
    const result = await cloudinary.api.ping();
    
    return NextResponse.json({
      status: 'connected',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      config: {
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key ? '✓ Set' : '✗ Missing',
        apiSecret: cloudinary.config().api_secret ? '✓ Set' : '✗ Missing',
      },
      result
    });
  } catch (error) {
    console.error('Cloudinary connectivity test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: (error as Error).message,
      config: {
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key ? '✓ Set' : '✗ Missing',
        apiSecret: cloudinary.config().api_secret ? '✓ Set' : '✗ Missing',
      }
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 