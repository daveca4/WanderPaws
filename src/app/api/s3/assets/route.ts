import { NextRequest, NextResponse } from 'next/server';
import { getS3Assets } from '@/lib/s3Service';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const prefix = searchParams.get('prefix') || undefined;
    const walkId = searchParams.get('walkId') || undefined;
    const maxResults = searchParams.get('maxResults') 
      ? parseInt(searchParams.get('maxResults') as string, 10) 
      : undefined;
    
    console.log(`Asset API Request - prefix: ${prefix}, walkId: ${walkId}, maxResults: ${maxResults}`);
    
    // Fetch assets from S3 using v3 SDK
    const assets = await getS3Assets({
      prefix,
      walkId,
      maxResults,
    });
    
    console.log(`Asset API Response - Found ${assets.length} assets`);
    
    // Log a sample of assets if available
    if (assets.length > 0) {
      console.log(`Sample asset: ${JSON.stringify(assets[0])}`);
    }
    
    // Return the assets
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching S3 assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch S3 assets' },
      { status: 500 }
    );
  }
} 