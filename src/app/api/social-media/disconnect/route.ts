import { NextRequest, NextResponse } from 'next/server';
import { disconnectPlatform } from '@/lib/socialMediaService';

// POST /api/social-media/disconnect - Disconnect from a social media platform
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform } = body;
    
    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform name is required' }, 
        { status: 400 }
      );
    }
    
    // Validate the platform is one we support
    if (!['instagram', 'facebook', 'tiktok'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Invalid platform specified' }, 
        { status: 400 }
      );
    }
    
    const result = await disconnectPlatform(platform as 'instagram' | 'facebook' | 'tiktok');
    
    return NextResponse.json({ success: result });
  } catch (error: any) {
    console.error(`Error disconnecting from social media platform:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect from platform' }, 
      { status: 500 }
    );
  }
} 