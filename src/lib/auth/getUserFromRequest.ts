import { NextRequest } from 'next/server';
import { logger } from '../utils/logger';

/**
 * Extracts user information from request headers
 * @param request The Next.js request object
 * @returns Object containing userId, role, and profileId from headers
 */
export async function getUserFromRequest(request: NextRequest) {
  try {
    // Get user info from headers
    const userId = request.headers.get('user-id') || '';
    const role = request.headers.get('user-role') || '';
    const profileId = request.headers.get('user-profile-id') || '';
    
    // Log all headers for debugging
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    const path = new URL(request.url).pathname;
    logger.info('Auth request received', { 
      path,
      method: request.method,
      allHeaders
    });

    const isAuthenticated = !!userId;

    if (isAuthenticated) {
      logger.info('Authenticated request', { 
        userId, 
        role, 
        profileId,
        isAdmin: role === 'admin'
      });
      
      // If this is an admin request, log additional context
      if (role === 'admin') {
        logger.info('Admin access', {
          endpoint: path,
          adminUserId: userId
        });
      }
    } else {
      // Try to get auth from cookies
      const cookies = request.cookies;
      const authCookie = cookies.get('wanderpaws_auth');
      
      if (authCookie) {
        try {
          const cookieData = JSON.parse(authCookie.value);
          logger.info('Found auth cookie', { 
            cookieUserId: cookieData.id,
            cookieRole: cookieData.role 
          });
          return {
            userId: cookieData.id,
            role: cookieData.role,
            profileId: cookieData.profileId || ''
          };
        } catch (e) {
          logger.error('Failed to parse auth cookie', { error: e });
        }
      }
      
      logger.warn('Unauthenticated request', { path });
    }

    return {
      userId,
      role,
      profileId
    };
  } catch (error) {
    logger.error('Error extracting user from request', { 
      error,
      url: request.url,
      method: request.method
    });
    return {
      userId: '',
      role: '',
      profileId: ''
    };
  }
} 