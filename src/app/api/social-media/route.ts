import { NextRequest, NextResponse } from 'next/server';
import { 
  getSocialMediaConfig, 
  updateSocialMediaConfig, 
  connectInstagram, 
  connectFacebook, 
  connectTikTok, 
  disconnectPlatform 
} from '@/lib/socialMediaService';

// GET /api/social-media - Get all social media configurations
export async function GET() {
  try {
    const config = await getSocialMediaConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching social media config:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch social media configurations' }, { status: 500 });
  }
}

// PUT /api/social-media - Update social media settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedConfig = await updateSocialMediaConfig(body);
    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (error) {
    console.error('Error updating social media config:', error);
    return NextResponse.json({ success: false, error: 'Failed to update social media configurations' }, { status: 500 });
  }
} 