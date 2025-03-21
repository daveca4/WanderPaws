import { NextRequest, NextResponse } from 'next/server';
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dggxbflnu',
  api_key: process.env.CLOUDINARY_API_KEY || '399599184441365',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HECjkZnvZvMaOgSmESdi-A9ABsQ',
  secure: true,
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType') || 'image';
    const tags = searchParams.get('tags') ? searchParams.get('tags')!.split(',') : [];
    const maxResults = parseInt(searchParams.get('maxResults') || '100', 10);
    
    // Fetch assets from Cloudinary
    const result = await cloudinary.api.resources({
      resource_type: resourceType,
      tags: tags.length > 0 ? tags : undefined,
      max_results: maxResults,
      type: 'upload',
    });
    
    // Map to our expected format
    const assets = result.resources.map((resource: any) => ({
      id: resource.asset_id,
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      type: resource.resource_type,
      createdAt: resource.created_at,
      fileSize: resource.bytes,
      width: resource.width,
      height: resource.height,
      duration: resource.duration,
      tags: resource.tags || [],
    }));
    
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets from Cloudinary:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 