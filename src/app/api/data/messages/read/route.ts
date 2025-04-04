import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { messageIds } = await request.json();
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Invalid message IDs' }, { status: 400 });
    }
    
    // Get user info from headers
    const userId = request.headers.get('user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    // Update messages in the database
    const updateResults = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        // Only mark as read if the current user is not the sender
        // This prevents marking your own messages as unread
        NOT: { senderId: userId }
      },
      data: {
        readStatus: 'read',
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      updatedCount: updateResults.count 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ 
      error: 'Failed to mark messages as read' 
    }, { status: 500 });
  }
} 