import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

/**
 * API endpoint to test authentication
 * This returns the auth headers received for debugging purposes
 */
export async function GET(request: NextRequest) {
  try {
    // Get all headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = key === 'authorization' ? 'Bearer [REDACTED]' : value;
    });
    
    // Get URL and path
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Log the request
    logger.info('Auth test request received', { 
      path,
      method: request.method,
      headers
    });
    
    // Get auth data from request
    const { userId, role, profileId } = await getUserFromRequest(request);
    
    // Check cookies
    const cookies: Record<string, string> = {};
    request.cookies.getAll().forEach(cookie => {
      cookies[cookie.name] = cookie.value.substring(0, 20) + '...';
    });
    
    // Create response data
    const responseData = {
      authenticated: !!userId,
      userId,
      role,
      profileId,
      headers,
      cookies: Object.keys(cookies),
      url: request.url,
      timestamp: new Date().toISOString()
    };
    
    // Log the response
    logger.info('Auth test response', responseData);
    
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error in auth test endpoint', { error });
    
    return NextResponse.json(
      { error: 'Auth test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 