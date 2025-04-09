import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request - only admin users should access this
    const { userId, role } = await getUserFromRequest(request);
    
    if (!userId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if Cloudinary credentials are configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary not configured properly' }, { status: 500 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType') || 'image';
    const tagsParam = searchParams.get('tags') || '';
    const maxResults = parseInt(searchParams.get('maxResults') || '25', 10);
    
    const tags = tagsParam ? tagsParam.split(',') : [];
    
    // Call Cloudinary API to get resources
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
    console.error('Error fetching Cloudinary assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
} 