import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the webhook signature (in production, implement proper validation)
    // For now, we'll just log the event
    console.log('Cloudinary webhook received:', body);
    
    // Process different notification types
    switch (body.notification_type) {
      case 'upload':
        // Handle completed upload
        console.log('Upload completed:', body.public_id);
        break;
        
      case 'eager':
        // Handle completed transformation
        console.log('Transformation completed:', body.public_id);
        break;
        
      default:
        console.log('Unknown notification type:', body.notification_type);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Cloudinary webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 