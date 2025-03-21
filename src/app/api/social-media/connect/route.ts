import { NextRequest, NextResponse } from 'next/server';
import { 
  connectInstagram, 
  connectFacebook, 
  connectTikTok
} from '@/lib/socialMediaService';

// POST /api/social-media/connect - Connect to a social media platform
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, credentials } = body;
    
    if (!platform || !credentials) {
      return NextResponse.json(
        { success: false, error: 'Platform and credentials are required' }, 
        { status: 400 }
      );
    }
    
    let result;
    
    switch (platform) {
      case 'instagram':
        result = await connectInstagram(credentials);
        break;
        
      case 'facebook':
        result = await connectFacebook(credentials);
        break;
        
      case 'tiktok':
        result = await connectTikTok(credentials);
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid platform specified' }, 
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error(`Error connecting to social media platform:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to connect to platform' }, 
      { status: 500 }
    );
  }
} 