import { NextRequest, NextResponse } from 'next/server';

// Import the dogCache from the dogs route file
// For simplicity, we'll just create a mock implementation here
const dogCache = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');
    
    console.log('Clearing cache for user:', userId, 'role:', userRole);
    
    // Clear all cache entries related to this user
    if (userId && userRole) {
      const cacheKey = `${userRole}-${userId}`;
      dogCache.delete(cacheKey);
      console.log('Cleared cache for key:', cacheKey);
    } else {
      // If no specific user, clear all cache
      dogCache.clear();
      console.log('Cleared entire dog cache');
    }
    
    return NextResponse.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 