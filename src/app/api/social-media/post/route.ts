import { NextRequest, NextResponse } from 'next/server';
import { postToSocialMedia, scheduleForSocialMedia } from '@/lib/socialMediaService';
import { getContentItemById } from '@/lib/contentAIService';

// POST /api/social-media/post - Post content to social media
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, platforms, schedule, scheduledTime } = body;
    
    if (!contentId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content ID and at least one platform are required' }, 
        { status: 400 }
      );
    }
    
    // Validate the platforms are ones we support
    const validPlatforms = ['instagram', 'facebook', 'tiktok'];
    const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
    
    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid platforms specified: ${invalidPlatforms.join(', ')}` }, 
        { status: 400 }
      );
    }
    
    // Get the content item
    const contentItem = await getContentItemById(contentId);
    
    if (!contentItem) {
      return NextResponse.json(
        { success: false, error: 'Content item not found' }, 
        { status: 404 }
      );
    }
    
    let result;
    
    // If schedule is true, schedule the post instead of posting immediately
    if (schedule && scheduledTime) {
      if (!Date.parse(scheduledTime)) {
        return NextResponse.json(
          { success: false, error: 'Invalid scheduled time format' }, 
          { status: 400 }
        );
      }
      
      result = await scheduleForSocialMedia(
        contentItem, 
        platforms as ('instagram' | 'facebook' | 'tiktok')[], 
        scheduledTime
      );
      
      return NextResponse.json({ 
        success: true, 
        data: result,
        message: 'Content scheduled for posting' 
      });
    } else {
      // Post immediately
      result = await postToSocialMedia(
        contentItem, 
        platforms as ('instagram' | 'facebook' | 'tiktok')[]
      );
      
      return NextResponse.json({ 
        success: true, 
        data: result,
        message: 'Content posted to social media' 
      });
    }
  } catch (error: any) {
    console.error(`Error posting to social media:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post to social media' }, 
      { status: 500 }
    );
  }
} 